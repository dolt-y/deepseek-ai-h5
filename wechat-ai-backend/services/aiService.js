import { openai, createChatCompletion } from '../clients/openaiClient.js';
import {
  createSession,
  listSessionsByOpenid,
  getSessionByIdAndOpenid,
  deleteSession
} from '../repositories/sessionRepository.js';
import {
  insertMessage,
  updateMessage,
  getSessionHistory,
  getSessionMessages,
  deleteMessagesBySession,
  getMessageLikeStatus,
  getMessageContentById,
  setMessageLikeStatus,
  getMessageWithSessionOwner
} from '../repositories/messageRepository.js';
import { handleBufferedStreamResponse } from '../utils/streamBuffer.js';
import { AppError } from '../errors/AppError.js';
import { transcribeSpeech, transcribeSpeechBuffer } from './speechService.js';

export async function chat({ openid, messages, model, stream, sessionId, emit }) {
  let currentSessionId = sessionId;
  if (!currentSessionId) {
    currentSessionId = await createSession(openid, messages[0].content);
  }

  const historyMessages = await getSessionHistory(currentSessionId);
  const aiMessages = messages.map((msg) => ({ role: msg.role, content: msg.content }));
  const allMessages = historyMessages.concat(aiMessages);

  for (const msg of messages) {
    await insertMessage(
      currentSessionId,
      msg.role,
      msg.content,
      null,
      msg.type || 'text',
      msg.media || null
    );
  }

  if (stream) {
    let lastReasoningContent = '';
    let hasStreamed = false;
    const completion = await createChatCompletion(allMessages, true, model);
    const assistantContent = await handleBufferedStreamResponse(
      completion,
      async (evt) => {
        if (!emit) return;
        if (evt && evt.type === 'delta') {
          hasStreamed = true;
          await emit({ type: 'delta', text: evt.text });
        } else if (evt && evt.type === 'thinking') {
          hasStreamed = true;
          lastReasoningContent += evt.thinking;
          await emit({ type: 'thinking', thinking: evt.thinking });
        }
      },
      { minChars: 60, maxWait: 180, emitThinking: true }
    );

    let finalContent = assistantContent;
    if (!hasStreamed) {
      const nonStream = await createChatCompletion(allMessages, false, model);
      finalContent = nonStream.choices[0].message?.content || '';
      if (finalContent && emit) {
        await emit({ type: 'delta', text: finalContent });
      }
    }

    if (finalContent) {
      await insertMessage(currentSessionId, 'assistant', finalContent, lastReasoningContent || null, 'text', null);
    }

    return { sessionId: currentSessionId, streamed: true };
  }

  const completion = await createChatCompletion(allMessages, false, model);
  const reply = completion.choices[0].message;
  await insertMessage(currentSessionId, 'assistant', reply.content, null, 'text', null);

  return { sessionId: currentSessionId, reply };
}

export async function chatMock({ stream, sessionId, emit }) {
  const currentSessionId = sessionId || Date.now();

  if (!stream) {
    return {
      sessionId: currentSessionId,
      reply: {
        role: 'assistant',
        content: '这是 mock 的非流式回复，用于 UI 测试。'
      }
    };
  }

  const mockRow = await getMessageContentById(100).catch(() => null);
  const mockText = (mockRow && mockRow.content) ? mockRow.content : '这是 mock 的非流式回复，用于 UI 测试。';
  const chunks = mockText.match(/.{3,8}/g) || [];

  async function* mockCompletion() {
    for (const chunk of chunks) {
      yield { choices: [{ delta: { content: chunk } }] };
      await new Promise(r => setTimeout(r, 40 + Math.random() * 80));
    }
  }

  try {
    await handleBufferedStreamResponse(
      mockCompletion(),
      async (evt) => {
        if (!emit) return;
        if (evt && evt.type === 'delta') {
          await emit({ type: 'delta', text: evt.text });
        } else if (evt && evt.type === 'thinking') {
          await emit({ type: 'thinking', thinking: evt.thinking });
        }
      },
      { minChars: 60, maxWait: 180 }
    );
  } catch (err) {
    console.error('mock buffered SSE 错误:', err);
    try {
      for (const c of chunks) {
        if (!emit) break;
        await emit({ type: 'delta', text: c });
        await new Promise(r => setTimeout(r, 40 + Math.random() * 80));
      }
    } catch (err2) {
      console.error('mock fallback SSE 错误:', err2);
    }
  }

  return { sessionId: currentSessionId, streamed: true };
}

export function getSessions(openid) {
  return listSessionsByOpenid(openid);
}

export function getSessionMessagesById(sessionId) {
  return getSessionMessages(sessionId);
}

export async function deleteSessionById(sessionId, openid) {
  const session = await getSessionByIdAndOpenid(sessionId, openid);
  if (!session) {
    throw new AppError('会话不存在或无权限删除', 404);
  }

  await deleteMessagesBySession(sessionId);
  await deleteSession(sessionId);
  return { sessionId };
}

export async function listModels() {
  const models = await openai.models.list();
  return models;
}

export async function toggleMessageLike(messageId) {
  const message = await getMessageLikeStatus(messageId);
  if (!message) {
    throw new AppError('消息不存在', 500);
  }
  const newLikedStatus = message.liked ? 0 : 1;
  await setMessageLikeStatus(messageId, newLikedStatus);
  return { messageId, liked: newLikedStatus };
}

export async function regenerateMessage({ messageId, openid, stream, model, emit }) {
  const message = await getMessageWithSessionOwner(messageId);

  if (!message) throw new AppError('消息不存在', 404);
  if (message.role !== 'assistant') throw new AppError('仅可重新生成AI消息', 400);
  if (message.openid !== openid) throw new AppError('无权限操作此消息', 403);

  const sessionId = message.session_id;
  const historyMessages = await getSessionHistory(sessionId, message.created_at);

  let userMessage = null;
  for (let i = historyMessages.length - 1; i >= 0; i--) {
    if (historyMessages[i].role === 'user') {
      userMessage = historyMessages[i].content;
      break;
    }
  }
  if (!userMessage) throw new AppError('无法找到用户消息用于重新生成', 400);

  const messages = [...historyMessages, { role: 'user', content: userMessage }];

  if (stream) {
    const completion = await createChatCompletion(messages, true, model);
    let lastReasoningContent = null;
    let hasStreamed = false;
    const assistantContent = await handleBufferedStreamResponse(
      completion,
      async (evt) => {
        if (!emit) return;
        if (evt && evt.type === 'delta') {
          hasStreamed = true;
          await emit({ type: 'delta', text: evt.text });
        } else if (evt && evt.type === 'thinking') {
          hasStreamed = true;
          lastReasoningContent = evt.thinking;
          await emit({ type: 'thinking', thinking: evt.thinking });
        }
      },
      { minChars: 60, maxWait: 180, emitThinking: true }
    );

    let finalContent = assistantContent;
    if (!hasStreamed) {
      const nonStream = await createChatCompletion(messages, false, model);
      finalContent = nonStream.choices[0].message?.content || '';
      if (finalContent && emit) {
        await emit({ type: 'delta', text: finalContent });
      }
    }

    if (finalContent) {
      await updateMessage(messageId, finalContent, lastReasoningContent);
    }

    return { sessionId, streamed: true };
  }

  const completion = await createChatCompletion(messages, false, model);
  const reply = completion.choices[0].message;
  await updateMessage(messageId, reply.content, null);
  return { messageId, newContent: reply.content };
}

export async function speechToText({ buffer, mimetype, filePath, language = 'zh' } = {}) {
  if (buffer) {
    return transcribeSpeechBuffer(buffer, mimetype, language);
  }
  return transcribeSpeech(filePath, language);
}
