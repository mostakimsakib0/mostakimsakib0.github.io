import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import matter from 'gray-matter';
import { extractStructuralElements, restoreStructuralElements, splitBlocks, reassembleBlocks, extractTextFromBlock, wrapBlockText } from './lib/markdown.js';
import { protectPhrases, restorePhrases, resetCounter } from './lib/placeholders.js';
import { splitSentences, extractPhrases } from './lib/phrases.js';
import { classifyPhrase } from './lib/classifier.js';
import { computeConfidence, decide } from './lib/decision.js';
import { translate, translateBatch } from './lib/translate-engine.js';
import { naturalize, naturalizeFrontmatter } from './lib/naturalize.js';
import * as cache from './lib/cache.js';
import config from './config.js';

function computeHash(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function computeFrequency(fullText, phraseText) {
  const escaped = phraseText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = fullText.match(new RegExp(escaped, 'g'));
  return matches ? matches.length : 0;
}

function computeFrequencies(fullText, phrases) {
  const freq = {};
  for (const phrase of phrases) {
    freq[phrase.text] = computeFrequency(fullText, phrase.text);
  }
  return freq;
}

function gatherHeadings(blocks) {
  return blocks
    .filter(b => b.type === 'heading')
    .map(b => b.content.replace(/^#+\s*/, ''));
}

function buildDocContext(fullText, blocks) {
  const headings = gatherHeadings(blocks);
  const title = headings[0] || '';
  return { headings, title };
}

export async function processFile(srcPath, dstPath) {
  const raw = readFileSync(srcPath, 'utf-8');
  const hash = computeHash(raw);
  const srcStat = statSync(srcPath);
  const srcMtime = srcStat.mtimeMs;

  const cached = cache.get(hash);
  if (cached && cache.isStale(hash) === false) {
    return { status: 'cached', dstPath };
  }

  const { data: fm, content } = matter(raw);
  const blocks = splitBlocks(content);
  const docContext = buildDocContext(content, blocks);
  const fullText = content;

  const processedBlocks = [];

  for (const block of blocks) {
    if (block.type === 'code') {
      processedBlocks.push(block);
      continue;
    }

    const blockText = extractTextFromBlock(block);
    if (!blockText || blockText.trim().length === 0) {
      processedBlocks.push(block);
      continue;
    }

    const step1 = extractStructuralElements(blockText);
    const sentences = splitSentences(step1.text);

    const allPhrases = [];
    for (const sentence of sentences) {
      const phraseCtx = {
        isSentenceStart: sentences.indexOf(sentence) === 0,
        docTitle: docContext.title,
        headings: docContext.headings,
        formatting: {},
      };
      const phrases = extractPhrases(sentence, phraseCtx);
      allPhrases.push(...phrases.map(p => ({ ...p, sentence })));
    }

    const frequencies = computeFrequencies(fullText, allPhrases);
    const protectSet = new Set();

    for (const phrase of allPhrases) {
      const ctx = {
        frequency: frequencies[phrase.text] || 1,
        isInTitle: docContext.title.includes(phrase.text),
        isInHeading: docContext.headings.some(h => h.includes(phrase.text)),
        appearsInOtherHeadings: docContext.headings.filter(h => h.includes(phrase.text)).length > 1,
        uniqueInDocument: frequencies[phrase.text] === 1,
        sentenceStart: allPhrases.indexOf(phrase) === 0,
        formatting: {},
      };

      const scores = classifyPhrase(phrase, ctx);
      const confidence = computeConfidence(scores);
      const decision = decide(phrase, confidence, ctx);

      if (decision.action === 'preserve' || decision.action === 'structural') {
        protectSet.add(phrase.text);
      }
    }

    const phrasesToProtect = Array.from(protectSet).filter(p => !p.match(/^[\s.,!?;:'"]+$/));
    const step2 = protectPhrases(step1.text, phrasesToProtect);

    let textToTranslate = step2.text;

    if (textToTranslate.trim().length > 0) {
      const translated = await translate(textToTranslate, 'en', 'bn');
      const afterRestore = restorePhrases(translated, step2.phMap);
      const finalText = restoreStructuralElements(afterRestore, step1.phMap);
      processedBlocks.push(wrapBlockText(block, finalText));
    } else {
      processedBlocks.push(block);
    }
  }

  let body = reassembleBlocks(processedBlocks);
  body = naturalize(body);

  const natFm = naturalizeFrontmatter(fm);
  const result = matter.stringify(body, natFm);

  const dstDir = dirname(dstPath);
  if (!existsSync(dstDir)) mkdirSync(dstDir, { recursive: true });
  writeFileSync(dstPath, result, 'utf-8');

  cache.set(hash, { hash, mtime: srcMtime, dstPath });
  return { status: 'translated', dstPath };
}
