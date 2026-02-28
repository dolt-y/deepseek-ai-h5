import {
  chat,
  chatMock,
  getSessions,
  getSessionMessagesById,
  deleteSessionById,
  listModels,
  toggleMessageLike,
  regenerateMessage,
  speechToText
} from '../services/aiService.js';
import { normalizeMessages } from '../services/messageService.js';
import { setupSSEResponse, writeSSE } from '../utils/sse.js';
import { sendError } from '../utils/error.js';
import { isAppError } from '../errors/AppError.js';

export async function chatController(req, res) {
  const { messages: rawMessages, model, stream, sessionId: clientSessionId, lang } = req.body;
  const openid = req.user.openid;
  let messages = rawMessages;
  if (typeof rawMessages === 'string') {
    try {
      messages = JSON.parse(rawMessages);
    } catch (err) {
      return res.status(400).json({ msg: 'messages格式不正确' });
    }
  }

  try {
    messages = await normalizeMessages(messages, { file: req.file, lang });

    if (!messages || !Array.isArray(messages) || !messages.every(msg => msg.role && msg.content && typeof msg.content === 'string')) {
      return res.status(400).json({ msg: 'messages格式不正确' });
    }

    const streamEnabled = stream === true || stream === 'true';
    if (streamEnabled) {
      setupSSEResponse(res);
      let isClientConnected = true;
      req.on('close', () => {
        isClientConnected = false;
      });

      const emit = async (evt) => {
        if (!isClientConnected) return;
        writeSSE(res, evt);
      };

      const result = await chat({ openid, messages, model, stream: true, sessionId: clientSessionId, emit });
      writeSSE(res, { type: 'done', sessionId: result.sessionId });
      res.end();
      return;
    }

    const result = await chat({ openid, messages, model, stream: false, sessionId: clientSessionId });
    res.json({ sessionId: result.sessionId, reply: result.reply });
  } catch (err) {
    sendError(res, err, 'AI服务调用失败');
  }
}

export async function chatMockController(req, res) {
  const { stream, sessionId: clientSessionId } = req.body;

  if (!stream) {
    const result = await chatMock({ stream: false, sessionId: clientSessionId });
    return res.json(result);
  }

  setupSSEResponse(res);
  let isClientConnected = true;
  req.on('close', () => { isClientConnected = false; });

  const emit = async (evt) => {
    if (!isClientConnected) return;
    writeSSE(res, evt);
  };

  try {
    const result = await chatMock({ stream: true, sessionId: clientSessionId, emit });
    writeSSE(res, { type: 'done', sessionId: result.sessionId });
  } catch (err) {
    console.error('mock SSE 错误:', err);
  }
  res.end();
}

export async function getSessionsController(req, res) {
  const openid = req.user.openid;
  try {
    const sessions = await getSessions(openid);
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ msg: '获取会话失败', err: err.message });
  }
}

export async function getSessionMessagesController(req, res) {
  const sessionId = req.params.id;
  try {
    const messages = await getSessionMessagesById(sessionId);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ msg: '获取会话消息失败', err: err.message });
  }
}

export async function deleteSessionController(req, res) {
  const sessionId = req.params.id;
  const openid = req.user.openid;

  try {
    const result = await deleteSessionById(sessionId, openid);
    res.json({ msg: '删除成功', sessionId: result.sessionId });
  } catch (err) {
    if (isAppError(err)) {
      return res.status(err.status).json({ msg: err.message });
    }
    res.status(500).json({ msg: '删除失败', err: err.message });
  }
}

export async function getModelsController(req, res) {
  try {
    const models = await listModels();
    res.json({ models });
  } catch (err) {
    res.status(500).json({ msg: '获取模型失败', err: err.message });
  }
}

export async function likeMessageController(req, res) {
  const messageId = req.params.id;
  try {
    const result = await toggleMessageLike(messageId);
    res.json({ msg: '操作成功', messageId: result.messageId, liked: result.liked });
  } catch (err) {
    if (isAppError(err)) {
      return res.status(err.status).json({ msg: err.message });
    }
    res.status(500).json({ msg: '点赞操作失败', err: err.message });
  }
}

export async function regenerateMessageController(req, res) {
  const messageId = req.params.id;
  const { stream, model } = req.body;
  const openid = req.user.openid;

  try {
    if (stream) {
      setupSSEResponse(res);
      let isClientConnected = true;
      req.on('close', () => { isClientConnected = false; });

      const emit = async (evt) => {
        if (!isClientConnected) return;
        writeSSE(res, evt);
      };

      const result = await regenerateMessage({ messageId, openid, stream: true, model, emit });
      writeSSE(res, { type: 'done', sessionId: result.sessionId });
      res.end();
      return;
    }

    const result = await regenerateMessage({ messageId, openid, stream: false, model });
    res.json({ messageId: result.messageId, newContent: result.newContent });
  } catch (err) {
    if (isAppError(err)) {
      return res.status(err.status).json({ msg: err.message });
    }
    res.status(500).json({ msg: '重新生成失败', err: err.message });
  }
}

export async function speechToTextController(req, res) {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ msg: '未提供音频文件或文件为空' });
    }

    const tempFilePath = process.env.WHISPER_SAMPLE_PATH || undefined;
    const text = await speechToText(tempFilePath);

    return res.json({
      msg: '语音识别成功',
      text
    });
  } catch (err) {
    console.error('语音识别失败:', err);
    res.status(500).json({ msg: '语音识别失败', err: err.message });
  }
}
