import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';

const CLEANUP_ROOTS = [
  path.resolve('./uploads'),
  path.resolve('./temp/speech-jobs')
];

async function readEntries(dirPath) {
  try {
    return await fs.readdir(dirPath, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function cleanupDir(dirPath, rootPath, maxAgeMs, now, result) {
  const entries = await readEntries(dirPath);

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await cleanupDir(entryPath, rootPath, maxAgeMs, now, result);
      if (entryPath !== rootPath) {
        await fs.rmdir(entryPath).catch(() => {});
      }
      continue;
    }

    if (!entry.isFile()) continue;

    const stat = await fs.stat(entryPath);
    if (now - stat.mtimeMs >= maxAgeMs) {
      await fs.unlink(entryPath);
      result.deletedFiles += 1;
    }
  }
}

export async function cleanupGeneratedFiles({
  maxAgeMs = config.jobs.cleanup.maxAgeMs,
  now = Date.now()
} = {}) {
  const result = {
    checkedRoots: CLEANUP_ROOTS,
    deletedFiles: 0
  };

  for (const root of CLEANUP_ROOTS) {
    await cleanupDir(root, root, maxAgeMs, now, result);
  }

  return result;
}
