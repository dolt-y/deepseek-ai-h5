import { createWorker } from 'tesseract.js';
import { AppError } from '../errors/AppError.js';

export async function recognizeImage(buffer, lang = 'chi_sim') {
  if (!buffer) {
    throw new AppError('未提供图片文件或文件为空', 400);
  }

  const worker = await createWorker();
  await worker.load();
  await worker.loadLanguage(lang);
  await worker.initialize(lang);
  const { data } = await worker.recognize(buffer);
  await worker.terminate();
  return (data?.text || '').trim();
}
