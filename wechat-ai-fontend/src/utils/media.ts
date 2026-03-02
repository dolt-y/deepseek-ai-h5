const API_BASE = import.meta.env.VITE_OPENAI_BASE_URL || '';

function normalizeBaseUrl(baseUrl: string) {
  if (!baseUrl) return '';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

export function resolveMediaUrl(url?: string | null) {
  if (!url) return '';

  const raw = String(url).trim();
  if (!raw) return '';
  if (/^(https?:)?\/\//i.test(raw)) return raw;
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;

  const normalizedBase = normalizeBaseUrl(API_BASE);
  if (!normalizedBase) return raw;

  if (raw.startsWith('/')) {
    return `${normalizedBase}${raw}`;
  }
  return `${normalizedBase}/${raw}`;
}
