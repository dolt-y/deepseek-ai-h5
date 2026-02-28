import OpenAI from 'openai';
import { config } from '../config.js';

export const openai = new OpenAI({
  apiKey: config.openaiApiKey,
  baseURL: config.openaiBaseUrl
});

export async function createChatCompletion(messages, stream = false, model = 'deepseek-chat') {
  return openai.chat.completions.create(
    {
      model,
      messages,
      stream
    },
    stream ? { responseType: 'stream' } : {}
  );
}
