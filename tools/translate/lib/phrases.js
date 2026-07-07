export function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}

export function extractPhrases(sentence, docContext = {}) {
  const phrases = [];
  const seen = new Set();

  if (!sentence || sentence.length < 2) return phrases;

  const words = tokenize(sentence);

  extractMultiWordCapitalized(sentence, words, phrases, seen, docContext);
  extractAcronyms(sentence, words, phrases, seen, docContext);
  extractCamelCase(sentence, words, phrases, seen, docContext);
  extractHyphenatedCompounds(sentence, words, phrases, seen, docContext);
  extractCapitalizedSingles(sentence, words, phrases, seen, docContext);
  extractRemaining(sentence, words, phrases, seen, docContext);

  return phrases;
}

function tokenize(text) {
  return text.match(/[\w/.-]+|[^\w\s]/g) || [];
}

function findPosition(text, phrase) {
  const idx = text.indexOf(phrase);
  if (idx === -1) return { start: 0, end: 0 };
  return { start: idx, end: idx + phrase.length };
}

function isPunctuationOrConnector(word) {
  return /^[.,;:!?()\[\]{}"'\-/]$/.test(word) ||
         /^(of|the|and|for|in|on|at|to|a|an|by|with|from|is|are|was|were)$/i.test(word);
}

function extractMultiWordCapitalized(sentence, words, phrases, seen, context) {
  let i = 0;
  while (i < words.length) {
    if (isPunctuationOrConnector(words[i])) { i++; continue; }
    if (!/^[A-Z]/.test(words[i])) { i++; continue; }

    let seq = [];
    let j = i;
    while (j < words.length) {
      const w = words[j];
      if (isPunctuationOrConnector(w) && !/^[A-Z]/.test(w)) {
        if (/^(of|the|and|for|in|on|at|to|by)$/i.test(w)) {
          seq.push(w);
          j++;
          continue;
        }
        if (/^[.,;:!?()]$/.test(w)) { j++; break; }
        break;
      }
      if (/^[A-Z]/.test(w) || /^\d/.test(w)) {
        seq.push(w);
        j++;
      } else {
        break;
      }
    }

    if (seq.length >= 2) {
      let phrase = seq.join(' ');
      if (!seen.has(phrase)) {
        seen.add(phrase);
        const pos = findPosition(sentence, phrase);
        phrases.push({
          text: phrase,
          wordCount: seq.length,
          type: 'capitalized_sequence',
          start: pos.start,
          end: pos.end,
          structureSignals: {
            allCapitalized: seq.every(w => /^[A-Z]/.test(w)),
            hasConnectors: seq.some(w => /^(of|the|and|for|in|on|at|to|by)$/i.test(w)),
          },
        });
      }
      i = j;
    } else {
      i++;
    }
  }
}

function extractAcronyms(sentence, words, phrases, seen, context) {
  const re = /\b([A-Z]{2,5})\b/g;
  let match;
  while ((match = re.exec(sentence)) !== null) {
    if (!seen.has(match[1]) && !sentence[match.index - 1]?.match(/[A-Z]/)) {
      seen.add(match[1]);
      phrases.push({
        text: match[1],
        wordCount: 1,
        type: 'acronym',
        start: match.index,
        end: match.index + match[0].length,
        structureSignals: { isAcronym: true },
      });
    }
  }

  const reWithDigits = /\b([A-Z]{2,5}[-/]?\d+[A-Za-z]?)\b/g;
  while ((match = reWithDigits.exec(sentence)) !== null) {
    if (!seen.has(match[1])) {
      seen.add(match[1]);
      phrases.push({
        text: match[1],
        wordCount: 1,
        type: 'acronym',
        start: match.index,
        end: match.index + match[0].length,
        structureSignals: { isAcronym: true, hasDigits: true },
      });
    }
  }
}

function extractCamelCase(sentence, words, phrases, seen, context) {
  const re = /\b([a-z]+[A-Z][a-zA-Z0-9]*|[A-Z][a-z]+[A-Z][a-zA-Z0-9]*)\b/g;
  let match;
  while ((match = re.exec(sentence)) !== null) {
    if (!seen.has(match[1])) {
      seen.add(match[1]);
      phrases.push({
        text: match[1],
        wordCount: 1,
        type: 'camel_case',
        start: match.index,
        end: match.index + match[0].length,
        structureSignals: { isCamelCase: true },
      });
    }
  }
}

function extractHyphenatedCompounds(sentence, words, phrases, seen, context) {
  const re = /\b[a-zA-Z]+(?:[-/][a-zA-Z0-9]+)+\b/g;
  let match;
  while ((match = re.exec(sentence)) !== null) {
    if (!seen.has(match[0])) {
      seen.add(match[0]);
      phrases.push({
        text: match[0],
        wordCount: match[0].split(/[-/ ]/).length,
        type: 'compound',
        start: match.index,
        end: match.index + match[0].length,
        structureSignals: { isHyphenated: true },
      });
    }
  }
}

function extractCapitalizedSingles(sentence, words, phrases, seen, context) {
  for (const word of words) {
    if (seen.has(word)) continue;
    if (/^[A-Z][a-z]{2,}$/.test(word) && word.length > 2) {
      const isSentenceStart = context.isSentenceStart !== false &&
        sentence.trimStart().startsWith(word);
      if (!isSentenceStart) {
        seen.add(word);
        const pos = findPosition(sentence, word);
        phrases.push({
          text: word,
          wordCount: 1,
          type: 'capitalized_single',
          start: pos.start,
          end: pos.end,
          structureSignals: { isCapitalized: true, isSentenceStart },
        });
      }
    }
  }
}

function extractRemaining(sentence, words, phrases, seen, context) {
  for (const word of words) {
    if (seen.has(word)) continue;
    if (/^\w/.test(word) && word.length > 1) {
      seen.add(word);
      const pos = findPosition(sentence, word);
      phrases.push({
        text: word,
        wordCount: 1,
        type: 'generic',
        start: pos.start,
        end: pos.end,
        structureSignals: { isGeneric: true },
      });
    }
  }
}
