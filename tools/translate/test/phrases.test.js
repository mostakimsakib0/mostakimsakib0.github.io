import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractPhrases, splitSentences } from '../lib/phrases.js';
import { classifyPhrase } from '../lib/classifier.js';
import { computeConfidence } from '../lib/decision.js';

describe('splitSentences', () => {
  it('splits on sentence boundaries', () => {
    const result = splitSentences('Hello world. This is a test! What about this?');
    assert.equal(result.length, 3);
    assert.equal(result[0], 'Hello world.');
  });
});

describe('extractPhrases', () => {
  it('detects acronyms', () => {
    const phrases = extractPhrases('The API and CNN models ran on AWS.');
    const acronyms = phrases.filter(p => p.type === 'acronym');
    assert.ok(acronyms.some(p => p.text === 'API'));
    assert.ok(acronyms.some(p => p.text === 'CNN'));
    assert.ok(acronyms.some(p => p.text === 'AWS'));
  });

  it('detects capitalized sequences', () => {
    const phrases = extractPhrases('Shahjalal University of Science and Technology');
    const seqs = phrases.filter(p => p.type === 'capitalized_sequence');
    assert.ok(seqs.some(p => p.text === 'Shahjalal University of Science and Technology'));
  });

  it('detects camelCase', () => {
    const phrases = extractPhrases('Built TensorFlow and EdgeAI models.');
    const cc = phrases.filter(p => p.type === 'camel_case');
    assert.ok(cc.some(p => p.text === 'TensorFlow'));
    assert.ok(cc.some(p => p.text === 'EdgeAI'));
  });

  it('detects hyphenated compounds', () => {
    const phrases = extractPhrases('state-of-the-art CI/CD pipeline');
    const hyphen = phrases.filter(p => p.type === 'compound');
    assert.ok(hyphen.some(p => p.text === 'state-of-the-art'));
  });

  it('detects capitalized single words mid-sentence', () => {
    const phrases = extractPhrases('The system uses Docker for deployment.', { isSentenceStart: false });
    const capSingles = phrases.filter(p => p.type === 'capitalized_single');
    assert.ok(capSingles.some(p => p.text === 'Docker'));
  });

  it('detects PascalCase terms', () => {
    const phrases = extractPhrases('Used TensorFlow and EdgeAI for inference.');
    const cc = phrases.filter(p => p.type === 'camel_case');
    assert.ok(cc.some(p => p.text === 'TensorFlow'));
    assert.ok(cc.some(p => p.text === 'EdgeAI'));
  });
});

describe('classifyPhrase', () => {
  it('gives high scores to acronyms', () => {
    const scores = classifyPhrase(
      { text: 'API', type: 'acronym', structureSignals: { isAcronym: true } },
      { frequency: 5, formatting: {} }
    );
    assert.ok(scores.isAcronym >= 0.8);
  });

  it('gives high scores to camelCase', () => {
    const scores = classifyPhrase(
      { text: 'TensorFlow', type: 'camel_case', structureSignals: { isCamelCase: true } },
      { frequency: 3, formatting: {} }
    );
    assert.ok(scores.isTechnicalTerm >= 0.7);
  });

  it('gives low generic scores to common nouns', () => {
    const scores = classifyPhrase(
      { text: 'system', type: 'generic', structureSignals: { isGeneric: true } },
      { frequency: 1, isSentenceStart: true, formatting: {} }
    );
    assert.ok(scores.isCommonNoun > 0);
    assert.ok(scores.isAcronym === 0);
  });

  it('marks code blocks for forced preservation', () => {
    const scores = classifyPhrase(
      { text: 'const x = 1;', type: 'generic', structureSignals: {} },
      { frequency: 1, formatting: { isCode: true } }
    );
    assert.equal(scores.isProperName, 999);
  });
});

describe('computeConfidence', () => {
  it('returns high confidence for acronyms', () => {
    const c = computeConfidence({ isAcronym: 0.9, isProperName: 0.2, isOrganization: 0, isTechnicalTerm: 0, isProductName: 0, isCommonNoun: 0, isDescriptive: 0 });
    assert.ok(c >= 0.85);
  });

  it('returns neutral-low confidence for generic words', () => {
    const c = computeConfidence({ isCommonNoun: 0.2, isProperName: 0, isOrganization: 0, isAcronym: 0, isTechnicalTerm: 0, isProductName: 0, isDescriptive: 0 });
    assert.ok(c < 0.60);
    assert.ok(c > 0.30);
  });

  it('returns very low confidence for zero signals', () => {
    const c = computeConfidence({ isProperName: 0, isOrganization: 0, isAcronym: 0, isTechnicalTerm: 0, isProductName: 0, isCommonNoun: 0, isDescriptive: 0 });
    assert.ok(c < 0.35);
  });
});
