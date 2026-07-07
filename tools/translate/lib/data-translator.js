import * as yaml from 'js-yaml';
import { extractStructuralElements, restoreStructuralElements } from './markdown.js';
import { protectPhrases, restorePhrases, resetCounter } from './placeholders.js';
import { splitSentences, extractPhrases } from './phrases.js';
import { classifyPhrase } from './classifier.js';
import { computeConfidence, decide } from './decision.js';
import { translate } from './translate-engine.js';

function computeFrequency(text, phraseText) {
  const escaped = phraseText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = text.match(new RegExp(escaped, 'g'));
  return matches ? matches.length : 0;
}

export async function translateString(text) {
  if (!text || text.trim().length === 0) return text;

  const step1 = extractStructuralElements(text);
  const sentences = splitSentences(step1.text);

  const allPhrases = [];
  for (const sentence of sentences) {
    const phrases = extractPhrases(sentence, { isSentenceStart: sentences.indexOf(sentence) === 0 });
    allPhrases.push(...phrases.map(p => ({ ...p, sentence })));
  }

  const fullText = text;
  const frequencies = {};
  for (const phrase of allPhrases) {
    frequencies[phrase.text] = computeFrequency(fullText, phrase.text);
  }

  const protectSet = new Set();
  for (const phrase of allPhrases) {
    const ctx = {
      frequency: frequencies[phrase.text] || 1,
      isInTitle: false,
      isInHeading: false,
      appearsInOtherHeadings: false,
      uniqueInDocument: frequencies[phrase.text] === 1,
      isSentenceStart: allPhrases.indexOf(phrase) === 0,
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

  if (step2.text.trim().length === 0) return text;

  const translated = await translate(step2.text, 'en', 'bn');
  const afterRestore = restorePhrases(translated, step2.phMap);
  const finalText = restoreStructuralElements(afterRestore, step1.phMap);
  return finalText;
}

export function isSkippableKey(key) {
  const skipKeys = new Set([
    'url', 'link', 'email', 'phone', 'avatar', 'doi',
    'year', 'statusType', 'authors', 'name',
  ]);
  return skipKeys.has(key);
}

export function isSkippableValue(value, key) {
  if (!value || value.trim().length === 0) return true;
  if (/^https?:\/\//.test(value)) return true;
  if (/^mailto:/.test(value)) return true;
  if (/^\d/.test(value)) return true;
  if (key === 'year' || key === 'doi') return true;
  if (key === 'authors') return true;
  if (key === 'name' && value.split(' ').length <= 5) return true;
  return false;
}

export function walkStrings(obj, path = '') {
  const strings = [];
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      strings.push(...walkStrings(value, currentPath));
    } else if (Array.isArray(value)) {
      if (value.every(v => typeof v === 'string')) {
        if (!isSkippableKey(key)) {
          strings.push({ path: currentPath, value: value.join('\n'), isArray: true, key });
        }
      } else {
        for (let i = 0; i < value.length; i++) {
          if (value[i] && typeof value[i] === 'object') {
            strings.push(...walkStrings(value[i], `${currentPath}[${i}]`));
          }
        }
      }
    } else if (typeof value === 'string') {
      if (!isSkippableValue(value, key) && !isSkippableKey(key)) {
        strings.push({ path: currentPath, value, isArray: false, key });
      }
    }
  }
  return strings;
}

export function setValueAtPath(obj, path, newValue, wasArray) {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const arrMatch = part.match(/^(.+)\[(\d+)\]$/);

    if (arrMatch) {
      const key = arrMatch[1];
      const idx = parseInt(arrMatch[2]);
      current = current[key][idx];
    } else if (i === parts.length - 1) {
      if (wasArray) {
        current[part] = newValue.split('\n');
      } else {
        current[part] = newValue;
      }
    } else {
      current = current[part];
    }
  }
  return obj;
}
