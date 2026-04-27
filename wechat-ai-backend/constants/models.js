export const DEFAULT_MODEL = 'deepseek-v4-flash';

export const AVAILABLE_MODELS = [
  {
    id: 'deepseek-v4-flash',
    object: 'model',
    owned_by: 'deepseek',
  },
  {
    id: 'deepseek-v4-pro',
    object: 'model',
    owned_by: 'deepseek',
  },
];

const LEGACY_MODEL_MAP = new Map([
  ['deepseek-chat', 'deepseek-v4-flash'],
  ['deepseek-reasoner', 'deepseek-v4-pro'],
]);

const SUPPORTED_MODEL_IDS = new Set(AVAILABLE_MODELS.map((model) => model.id));

export function normalizeModel(model) {
  if (!model) return DEFAULT_MODEL;
  const normalized = LEGACY_MODEL_MAP.get(model) || model;
  return SUPPORTED_MODEL_IDS.has(normalized) ? normalized : DEFAULT_MODEL;
}

export function getModelListResponse() {
  const data = AVAILABLE_MODELS.map((model) => ({ ...model }));
  return {
    options: {
      method: 'get',
      path: '/models',
    },
    response: {},
    body: {
      object: 'list',
      data,
    },
    data,
    object: 'list',
  };
}
