import fs from 'fs/promises';
import path from 'path';
import { Whisper } from '../middleware/whisper.js';

const TEMP_DIR = path.resolve('./temp');
const WHISPER_ROOT = process.env.WHISPER_ROOT || path.resolve('./whisper.cpp');
const DEFAULT_AUDIO_PATH = process.env.WHISPER_SAMPLE_PATH || path.resolve('./sample-6s.wav');

export async function transcribeSpeech(filePath, language = 'zh') {
  await fs.mkdir(TEMP_DIR, { recursive: true });
  const targetPath = filePath || DEFAULT_AUDIO_PATH;
  const whisper = new Whisper(WHISPER_ROOT, 'ggml-tiny.bin');
  return whisper.transcribe(targetPath, language);
}
