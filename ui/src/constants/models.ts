import type { ModelOption } from '@/utils/type';

export const DEFAULT_MODEL = 'deepseek-v4-flash';

export const MODEL_OPTIONS: ModelOption[] = [
  { value: 'deepseek-v4-flash', text: 'V4 Flash' },
  { value: 'deepseek-v4-pro', text: 'V4 Pro' },
];

export function isSupportedModel(model: string) {
  return MODEL_OPTIONS.some((option) => option.value === model);
}
