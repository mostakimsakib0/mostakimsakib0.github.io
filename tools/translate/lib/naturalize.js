export function naturalize(text) {
  if (!text || text.length < 3) return text;

  let result = text;

  result = result.replace(/\u200B/g, '');

  result = result.replace(/\s{2,}/g, ' ');

  result = fixConsecutiveShortSegments(result);

  result = fixPunctuationSpacing(result);

  result = result.trim();

  return result;
}

function fixConsecutiveShortSegments(text) {
  const bnNumeralPattern = /[০-৯]/;
  if (!bnNumeralPattern.test(text)) return text;
  return text;
}

function fixPunctuationSpacing(text) {
  let r = text.replace(/\s+([.,;:!?])/g, '$1');
  r = r.replace(/([.,;:!?])(?!\s|$)/g, '$1 ');
  r = r.replace(/\s{2,}/g, ' ');
  return r;
}

export function naturalizeFrontmatter(fm) {
  const result = { ...fm };
  if (result.description) {
    result.description = result.description.replace(/\u200B/g, '').trim();
  }
  return result;
}
