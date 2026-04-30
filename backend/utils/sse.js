export function setupSSEResponse(res) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
}

export function writeSSE(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}
