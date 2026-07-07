let counter = 0;
const PREFIX = '\x00PH';

export function resetCounter() {
  counter = 0;
}

export function protectPhrases(text, phrasesToProtect) {
  const map = new Map();
  let result = text;

  const sorted = [...phrasesToProtect].sort((a, b) => b.length - a.length);

  for (const phrase of sorted) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'g');
    result = result.replace(re, (match) => {
      counter++;
      const id = `${PREFIX}${counter}\x00`;
      map.set(id, { original: match });
      return id;
    });
  }

  return { text: result, phMap: map };
}

export function restorePhrases(text, phMap) {
  let result = text;
  for (const [id, { original }] of phMap) {
    result = result.replace(id, original);
  }
  return result;
}

export function isPlaceholder(str) {
  return str.startsWith(PREFIX) && str.endsWith('\x00');
}
