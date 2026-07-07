export function classifyPhrase(phrase, context) {
  const signal = { ...phrase.structureSignals };
  const scores = {
    isProperName:    0,
    isOrganization:  0,
    isAcronym:       0,
    isTechnicalTerm: 0,
    isProductName:   0,
    isCommonNoun:    0,
    isDescriptive:   0,
  };

  const fmt = context.formatting || {};

  if (fmt.isCode || fmt.isLink || fmt.hasCodeBlock) {
    scores.isProperName = 999;
    return scores;
  }

  if (signal.isAcronym) {
    scores.isAcronym += 0.8 + (context.frequency >= 3 ? 0.1 : 0) + (fmt.isBold ? 0.1 : 0);
    scores.isProperName += 0.2;
  }

  if (signal.isCamelCase) {
    scores.isTechnicalTerm += 0.7 + (context.frequency >= 3 ? 0.15 : 0);
    scores.isProductName += 0.2;
  }

  if (signal.allCapitalized && phrase.wordCount >= 2) {
    scores.isOrganization += 0.3;
    scores.isProperName += 0.3;
  }

  if (signal.isCapitalized && phrase.wordCount >= 3) {
    scores.isOrganization += 0.5;
    scores.isProperName += 0.3;
    if (context.isInTitle) scores.isProperName += 0.2;
    if (context.isInHeading) scores.isProperName += 0.15;
  }

  if (signal.isCapitalized && phrase.wordCount === 1) {
    if (context.isSentenceStart === false) {
      scores.isProperName += 0.3;
      scores.isCommonNoun += -0.2;
    } else {
      scores.isCommonNoun += 0.15;
    }
  }

  if (signal.isHyphenated) {
    scores.isTechnicalTerm += 0.3;
    scores.isDescriptive += 0.2;
  }

  if (signal.hasDigits && !signal.isAcronym) {
    scores.isTechnicalTerm += 0.2;
  }

  if (context.frequency >= 4) scores.isTechnicalTerm += 0.15;
  if (context.frequency >= 2 && phrase.wordCount >= 2) scores.isProperName += 0.1;

  if (context.isInTitle) {
    scores.isProperName += 0.2;
    if (phrase.wordCount >= 2) scores.isProperName += 0.15;
  }

  if (fmt.isBold) {
    scores.isProductName += 0.25;
    scores.isProperName += 0.1;
  }

  if (fmt.isItalic) {
    scores.isDescriptive += 0.15;
  }

  if (context.appearsInOtherHeadings) scores.isProperName += 0.15;
  if (context.uniqueInDocument && context.frequency === 1 && phrase.wordCount === 1) {
    scores.isCommonNoun += 0.1;
  }

  if (signal.isGeneric && Object.values(scores).every(v => v === 0)) {
    scores.isCommonNoun += 0.2;
  }

  return scores;
}
