import { readdirSync, statSync, existsSync } from 'fs';
import { join, extname, relative } from 'path';
import { processFile } from './pipeline.js';
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

function getDstPath(srcPath, srcBase, dstBase) {
  const rel = relative(srcBase, srcPath);
  return join(dstBase, rel);
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

  const srcFiles = walkMdFiles(config.srcDir);
  console.log(`[translate] Found ${srcFiles.length} source files`);

  let translated = 0;
  let cached = 0;
  let errors = 0;

  for (let i = 0; i < srcFiles.length; i++) {
    const srcPath = srcFiles[i];
    const dstPath = getDstPath(srcPath, config.srcDir, config.dstDir);

    if (dstPath === srcPath) {
      continue;
    }

    process.stdout.write(`  [${i + 1}/${srcFiles.length}] ${relative(config.srcDir, srcPath)} ... `);

    try {
      const result = await processFile(srcPath, dstPath);
      if (result.status === 'cached') {
        cached++;
        process.stdout.write(`cached\n`);
      } else {
        translated++;
        process.stdout.write(`✓\n`);
      }
    } catch (err) {
      errors++;
      process.stdout.write(`✗ ${err.message}\n`);
    }
  }

  cache.save();

  console.log(`\n[translate] Complete: ${translated} translated, ${cached} cached, ${errors} errors\n`);
}

main().catch(err => {
  console.error('[translate] Fatal error:', err);
  process.exit(1);
});
