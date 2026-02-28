interface StreamOptions {
  url: string | ((...args: any[]) => string);
  data: any;
  onMessage: (chunk: string) => void;
  onThinking?: (thinking: any) => void;
  onDone?: (sessionId?: string) => void;
  onError?: (err: any) => void;
}

const getToken = () => localStorage.getItem('token') || '';

export async function streamFetch({
  url,
  data,
  onMessage,
  onThinking,
  onDone,
  onError
}: StreamOptions) {
  try {
    const realUrl =
      typeof url === 'function' ? url(data?.sessionId) : url;
    const token = getToken();
    const res = await fetch(realUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    });

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
      } catch (e) {
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
