import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function load() {
  const defaults = {
    srcDir: 'content',
    dstDir: 'content/bn',
    engine: process.env.TRANSLATE_ENGINE || 'libretranslate',
    libreTranslateUrl: process.env.LIBRE_TRANSLATE_URL || 'http://localhost:5000',
    googleProjectId: process.env.GOOGLE_PROJECT_ID || '',
    googleApiKey: process.env.GOOGLE_API_KEY || '',
    preserveThreshold: 0.65,
    translateThreshold: 0.35,
    cacheDir: '.translate-cache',
    batchSize: 10,
    concurrency: 3,
  };

  const configPath = join(process.cwd(), 'translate.config.json');
  if (existsSync(configPath)) {
    const userConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
    Object.assign(defaults, userConfig);
  }

  return defaults;
}

export default load();
