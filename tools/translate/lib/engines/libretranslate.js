import config from '../../config.js';

export async function libreTranslate(text, source, target) {
  const res = await fetch(`${config.libreTranslateUrl}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source,
      target,
      format: 'text',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LibreTranslate error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.translatedText;
}
