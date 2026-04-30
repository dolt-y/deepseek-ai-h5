import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch (err) {
    return false;
  }
}

export async function assembleChunks(resumableDir, fileId, totalChunks) {
  const dir = path.join(resumableDir, fileId);
  await ensureDir(dir);
  const outputPath = path.join(dir, `${fileId}.wav`);

  if (await pathExists(outputPath)) {
    return outputPath;
  }

  const writeStream = createWriteStream(outputPath);

  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(dir, `${i}.chunk`);
    const buffer = await fs.readFile(chunkPath);
    await new Promise((resolve, reject) => {
      writeStream.write(buffer, (err) => (err ? reject(err) : resolve()));
    });
  }

  await new Promise((resolve, reject) => {
    writeStream.end((err) => (err ? reject(err) : resolve()));
  });

  return outputPath;
}
