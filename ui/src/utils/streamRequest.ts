import { getAccessToken, getRefreshToken, refreshAccessToken } from '@/utils/request';

interface StreamOptions {
  url: string | ((...args: any[]) => string);
  data: any;
  onMessage: (chunk: string) => void;
  onThinking?: (thinking: any) => void;
  onDone?: (sessionId?: string | number) => void;
  onError?: (err: any) => void;
}

function buildStreamRequest(realUrl: string, data: any, accessToken: string) {
  const isFormData = data instanceof FormData;
  const headers: Record<string, string> = {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(realUrl, {
    method: 'POST',
    headers,
    body: isFormData ? data : JSON.stringify(data)
  });
}

export async function streamFetch({
  url,
  data,
  onMessage,
  onThinking,
  onDone,
  onError
}: StreamOptions) {
  try {
    const isFormData = data instanceof FormData;
    const realUrl =
      typeof url === 'function' ? url(isFormData ? undefined : data?.sessionId) : url;

    let res = await buildStreamRequest(realUrl, data, getAccessToken());

    if (res.status === 401 && getRefreshToken()) {
      try {
        const nextAccessToken = await refreshAccessToken();
        res = await buildStreamRequest(realUrl, data, nextAccessToken);
      } catch (err) {
        // 保留原 401 响应，让下面的错误解析给调用方统一展示。
      }
    }

    if (!res.ok) {
      const contentType = res.headers.get('content-type') || '';
      let errorMsg = `HTTP ${res.status}: ${res.statusText}`;

      if (contentType.includes('application/json')) {
        const errorBody = await res.json().catch(() => null);
        if (errorBody?.msg) errorMsg = errorBody.msg;
      } else {
        const text = await res.text().catch(() => '');
        if (text) errorMsg = text;
      }

      throw new Error(errorMsg);
    }

    if (!res.body) throw new Error('No response body');

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    const processEventBlock = (block: string) => {
      const lines = block.split(/\r?\n/);
      const dataLines: string[] = [];
      for (const line of lines) {
        if (line.startsWith('data:')) {
          dataLines.push(line.replace(/^data:\s*/, ''));
        }
      }
      if (dataLines.length === 0) return;
      const dataStr = dataLines.join('').trim();

      try {
        const obj = JSON.parse(dataStr);
        if (obj?.type === 'delta' && typeof obj.text === 'string') {
          onMessage(obj.text);
        } else if (obj?.type === 'thinking') {
          // thinking 可能是结构化数据：传回给调用者自行处理
          onThinking?.(obj.thinking);
        } else if (obj?.type === 'done') {
          onDone?.(obj.sessionId);
        } else {
          onMessage(dataStr);
        }
      } catch {
        onMessage(dataStr);
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const trimmed = rawEvent.trim();
        if (trimmed) processEventBlock(trimmed);
      }

      if (done) {
        buffer += decoder.decode();
        if (buffer.trim()) {
          const parts = buffer.split(/\n\n/);
          for (const part of parts) {
            const t = part.trim();
            if (t) processEventBlock(t);
          }
        }
        break;
      }
    }
  } catch (err) {
    onError?.(err);
  }
}
