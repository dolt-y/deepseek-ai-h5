import OpenAI from 'openai';
import { config } from '../config.js';
import { DEFAULT_MODEL, normalizeModel } from '../constants/models.js';

export const openai = new OpenAI({
  apiKey: config.openaiApiKey,
  baseURL: config.openaiBaseUrl
});

export async function createChatCompletion(messages, stream = false, model = DEFAULT_MODEL) {
  return openai.chat.completions.create(
    {
      model: normalizeModel(model),
      messages,
      stream
    },
    stream ? { responseType: 'stream' } : {}
  );
}
