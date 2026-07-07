import config from '../../config.js';

export async function googleTranslate(text, source, target) {
  if (!config.googleApiKey) {
    throw new Error('GOOGLE_API_KEY not set');
  }

  const url = `https://translation.googleapis.com/language/translate/v2?key=${config.googleApiKey}`;
  const res = await fetch(url, {
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
    throw new Error(`Google Translation API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.data.translations[0].translatedText;
}
