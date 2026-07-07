const STRUCTURAL_PATTERNS = [
  { type: 'code_block',       re: /```[\s\S]*?```/g },
  { type: 'inline_code',      re: /`[^`]+`/g },
  { type: 'markdown_link',    re: /\[([^\]]+)\]\(([^)]+)\)/g },
  { type: 'image',            re: /!\[([^\]]*)\]\(([^)]+)\)/g },
  { type: 'html_tag',         re: /<[^>]+>/g },
  { type: 'horizontal_rule',  re: /^---+$/gm },
  { type: 'table_row',        re: /^\|.+\|$/gm },
  { type: 'table_separator',  re: /^\|[\s:-]+\|$/gm },
];

export function extractStructuralElements(md) {
  const map = new Map();
  let counter = 0;
  let result = md;

  for (const { type, re } of STRUCTURAL_PATTERNS) {
    result = result.replace(re, (match) => {
      counter++;
      const id = `\x00PH${counter}\x00`;
      map.set(id, { type, original: match });
      return id;
    });
  }

  return { text: result, phMap: map };
}

export function restoreStructuralElements(text, phMap) {
  let result = text;
  for (const [id, { original }] of phMap) {
    result = result.replace(id, original);
  }
  return result;
}

export function splitBlocks(md) {
  const blocks = [];
  const lines = md.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      let codeLines = [line];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) codeLines.push(lines[i]);
      blocks.push({ type: 'code', content: codeLines.join('\n') });
      i++;
      continue;
    }

    if (line.startsWith('#')) {
      const depth = line.match(/^#+/)[0].length;
      blocks.push({ type: 'heading', depth, content: line });
      i++;
      continue;
    }

    if (line.startsWith('|')) {
      let tableLines = [line];
      i++;
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'table', content: tableLines.join('\n') });
      continue;
    }

    if (line.match(/^[-*+]\s/)) {
      let listLines = [line];
      i++;
      while (i < lines.length && lines[i].match(/^[-*+]\s/)) {
        listLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'list', content: listLines.join('\n') });
      continue;
    }

    if (line.trim() === '') {
      i++;
      continue;
    }

    let paraLines = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && !lines[i].startsWith('```') && !lines[i].startsWith('|') && !lines[i].match(/^[-*+]\s/)) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'paragraph', content: paraLines.join('\n') });
  }

  return blocks;
}

export function reassembleBlocks(blocks) {
  return blocks.map(b => b.content).join('\n\n');
}

export function extractTextFromBlock(block) {
  if (block.type === 'code') return '';
  if (block.type === 'heading') return block.content.replace(/^#+\s*/, '');
  if (block.type === 'paragraph') return block.content;
  if (block.type === 'table') return block.content;
  if (block.type === 'list') return block.content;
  return block.content;
}

export function wrapBlockText(block, translatedText) {
  if (block.type === 'heading') {
    const prefix = block.content.match(/^(#+\s*)/)?.[1] || '# ';
    return { ...block, content: prefix + translatedText };
  }
  return { ...block, content: translatedText };
}
