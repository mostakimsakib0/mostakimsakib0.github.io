import config from '../config.js';

const WEIGHTS = {
  isProperName:    0.25,
  isOrganization:  0.20,
  isAcronym:       0.30,
  isTechnicalTerm: 0.15,
  isProductName:   0.10,
  isCommonNoun:   -0.20,
  isDescriptive:  -0.15,
};

export function computeConfidence(scores) {
  const totalSignal = Object.values(scores).reduce((a, b) => a + Math.abs(b), 0);

  if (totalSignal === 0) return 0.10;

  let raw = 0;
  for (const [cat, val] of Object.entries(scores)) {
    raw += val * (WEIGHTS[cat] || 0);
  }

  if (scores.isProperName === 999) return 1.0;

  let confidence = Math.max(-1, Math.min(1, raw));
  confidence = (confidence + 1) / 2;

  if (scores.isAcronym >= 0.8) confidence = Math.max(confidence, 0.90);
  if (scores.isProperName >= 0.6) confidence = Math.max(confidence, 0.80);
  if (scores.isCommonNoun < 0) confidence = Math.min(confidence, 0.35);

  return Math.round(confidence * 100) / 100;
}

export function decide(phrase, confidence, context) {
  if (context.formatting?.protectedInline) {
    return { action: 'preserve', reason: 'structural', confidence };
  }

  if (context.formatting?.isCode || context.formatting?.isLink) {
    return { action: 'preserve', reason: 'structural', confidence };
  }

  if (confidence > config.preserveThreshold) {
    return { action: 'preserve', reason: 'high_confidence', confidence };
  }

  if (confidence >= config.translateThreshold && confidence <= config.preserveThreshold) {
    return { action: 'mixed', reason: 'medium_confidence', confidence };
  }

  return { action: 'translate', reason: 'low_confidence', confidence };
}
