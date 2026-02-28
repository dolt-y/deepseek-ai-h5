// 智能缓冲：合并小片段再 emit，减少前端收到的碎片化文本
// emitFn 接受一个事件对象
export async function handleBufferedStreamResponse(completion, emitFn, options = {}) {
  const minChars = options.minChars || 40;
  const maxWait = options.maxWait || 200;
  const boundaryRegex = options.boundaryRegex || /\n\n|[。！？.!?]\s*$/;
  const emitThinking = options.emitThinking !== false;

  let buffer = '';
  let lastEmit = Date.now();
  let full = '';
  try {
    for await (const event of completion) {
      const delta = event.choices?.[0]?.delta || {};

      if (typeof delta.content === 'string' && delta.content.length > 0) {
        buffer += delta.content;
        full += delta.content;
      }

      if (emitThinking && delta.reasoning_content) {
        if (buffer.length > 0) {
          await emitFn({ type: 'delta', text: buffer });
          buffer = '';
          lastEmit = Date.now();
        }

        try {
          await emitFn({ type: 'thinking', thinking: delta.reasoning_content });
        } catch (e) {
          console.error('发送 thinking 事件失败:', e);
        }
      }

      const now = Date.now();
      const shouldByLength = buffer.length >= minChars;
      const shouldByBoundary = boundaryRegex.test(buffer);
      const shouldByTime = (now - lastEmit) >= maxWait && buffer.length > 0;

      if (shouldByBoundary || shouldByLength || shouldByTime) {
        await emitFn({ type: 'delta', text: buffer });
        buffer = '';
        lastEmit = Date.now();
      }
    }
  } catch (err) {
    console.error('缓冲流式响应处理异常:', err);
  }

  if (buffer.length > 0) {
    await emitFn({ type: 'delta', text: buffer });
  }
  return full;
}
