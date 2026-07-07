import { readdirSync, statSync, existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, extname, relative, dirname } from 'path';
import * as yaml from 'js-yaml';
import { processFile } from './pipeline.js';
import { translateString, walkStrings, setValueAtPath, isSkippableValue, isSkippableKey } from './lib/data-translator.js';
import * as cache from './lib/cache.js';
import config from './config.js';

function walkMdFiles(dir, baseDir = dir) {
  const results = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.')) results.push(...walkMdFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

function walkDataFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isFile() && (entry.name.endsWith('.yml') || entry.name.endsWith('.yaml'))) {
      results.push(fullPath);
    }
  }
  return results;
}

function getDstPath(srcPath, srcBase, dstBase) {
  const rel = relative(srcBase, srcPath);
  return join(dstBase, rel);
}

async function processDataFile(srcPath, dstPath) {
  const raw = readFileSync(srcPath, 'utf-8');
  const data = yaml.load(raw);
  if (!data) return { status: 'empty', dstPath };

  const strings = walkStrings(data);
  console.log(`    Found ${strings.length} translatable strings`);

  for (const item of strings) {
    if (item.isArray) {
      const lines = item.value.split('\n').filter(Boolean);
      const translated = [];
      for (const line of lines) {
        const t = await translateString(line);
        translated.push(t);
      }
      setValueAtPath(data, item.path, translated.join('\n'), true);
    } else {
      const translated = await translateString(item.value);
      setValueAtPath(data, item.path, translated, false);
    }
  }

  const dstDir = dirname(dstPath);
  if (!existsSync(dstDir)) mkdirSync(dstDir, { recursive: true });
  writeFileSync(dstPath, yaml.dump(data, { indent: 2, lineWidth: -1 }), 'utf-8');
  return { status: 'translated', dstPath };
}

async function main() {
  console.log(`\n[translate] Pipeline starting`);
  console.log(`  Source: ${config.srcDir}`);
  console.log(`  Dest:   ${config.dstDir}`);
  console.log(`  Engine: ${config.engine}`);
  console.log(`  Thresholds: preserve > ${config.preserveThreshold}, translate < ${config.translateThreshold}\n`);

  if (!existsSync(config.srcDir)) {
    console.error(`[translate] Source directory "${config.srcDir}" not found`);
    process.exit(1);
  }

  cache.load();

  /* ─── Translate markdown files ─── */
  const srcFiles = walkMdFiles(config.srcDir);
  console.log(`[translate] Found ${srcFiles.length} markdown source files`);

  let translated = 0;
  let cached = 0;
  let errors = 0;

  for (let i = 0; i < srcFiles.length; i++) {
    const srcPath = srcFiles[i];
    const dstPath = getDstPath(srcPath, config.srcDir, config.dstDir);

    if (dstPath === srcPath) continue;

    process.stdout.write(`  [${i + 1}/${srcFiles.length}] ${relative(config.srcDir, srcPath)} ... `);

    try {
      const result = await processFile(srcPath, dstPath);
      if (result.status === 'cached') { cached++; process.stdout.write(`cached\n`); }
      else { translated++; process.stdout.write(`✓\n`); }
    } catch (err) {
      errors++;
      process.stdout.write(`✗ ${err.message}\n`);
    }
  }

  /* ─── Translate data files ─── */
  const dataSrcDir = 'data';
  const dataDstDir = 'data/bn';
  const dataFiles = walkDataFiles(dataSrcDir);

  if (dataFiles.length > 0) {
    console.log(`\n[translate] Found ${dataFiles.length} data files`);
    for (let i = 0; i < dataFiles.length; i++) {
      const srcPath = dataFiles[i];
      const dstPath = join(dataDstDir, relative(dataSrcDir, srcPath));

      process.stdout.write(`  [${i + 1}/${dataFiles.length}] data/${relative(dataSrcDir, srcPath)} ... `);

      try {
        const result = await processDataFile(srcPath, dstPath);
        process.stdout.write(`✓\n`);
        translated++;
      } catch (err) {
        errors++;
        process.stdout.write(`✗ ${err.message}\n`);
      }
    }
  }

  cache.save();

  console.log(`\n[translate] Complete: ${translated} translated, ${cached} cached, ${errors} errors\n`);
}

main().catch(err => {
  console.error('[translate] Fatal error:', err);
  process.exit(1);
});
