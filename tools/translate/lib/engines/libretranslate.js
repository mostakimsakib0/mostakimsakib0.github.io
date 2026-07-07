import config from '../../config.js';

export async function libreTranslate(text, source, target) {
  let lastErr;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), attempt === 0 ? 90000 : 30000);

      const res = await fetch(`${config.libreTranslateUrl}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source,
          target,
          format: 'text',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`LibreTranslate error ${res.status}: ${body}`);
      }

      const data = await res.json();
      return data.translatedText;
    } catch (err) {
      lastErr = err;
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  throw lastErr;
}
