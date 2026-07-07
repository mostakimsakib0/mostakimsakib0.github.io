import config from '../config.js';

export async function translate(text, source = 'en', target = 'bn') {
  if (!text || text.trim().length === 0) return '';

  switch (config.engine) {
    case 'google':
      const { googleTranslate } = await import('./engines/google.js');
      return googleTranslate(text, source, target);
    case 'libretranslate':
      const { libreTranslate } = await import('./engines/libretranslate.js');
      return libreTranslate(text, source, target);
    default:
      const { libreTranslate } = await import('./engines/libretranslate.js');
      return libreTranslate(text, source, target);
  }
}

export async function translateBatch(texts, source = 'en', target = 'bn') {
  const results = await Promise.allSettled(
    texts.map(t => translate(t, source, target))
  );
  return results.map(r => r.status === 'fulfilled' ? r.value : '');
}
