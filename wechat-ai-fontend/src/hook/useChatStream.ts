// src/hooks/chat/useChatStream.ts
// 聊天请求部分的hook逻辑 (已优化平滑输出和滚动)
import { ref } from 'vue';
import { renderMarkdown } from '@/utils/markdown';
import { streamFetch } from '@/utils/streamRequest';
import api from '@/utils/api';
import type { ChatMessage } from '@/utils/type';
import type { ScrollToBottomFn } from './useChatScroll';

interface StreamAssistantParams {
  requestMessages: Array<Record<string, any>>;
  sessionId: string | number | undefined;
  selectedModel: string;
  imageFile?: File | null;
  onDoneSession?: (sessionId?: string | number) => void;
}

export function useChatStream(scrollToBottom: ScrollToBottomFn) {
  const isAssistantTyping = ref(false); // AI是否在回复中

  function createAssistantMessage(id: number): ChatMessage {
    return {
      id,
      role: 'assistant',
      type: 'text',
      content: '',
      reasoning_content: '',
      status: 'pending',
      timestamp: Date.now(),
    };
  }

  /**
   * * @param messages 消息列表
   * @param nextMessageId 获取下一条消息ID的函数
   * @param params 请求参数
   * @returns
   */
  async function streamAssistantReply(
    messages: ChatMessage[],
    nextMessageId: () => number,
    params: StreamAssistantParams
  ) {
    const {
      requestMessages,
      sessionId,
      selectedModel,
      imageFile,
      onDoneSession,
    } = params;
    isAssistantTyping.value = true;
    const assistantMsg = createAssistantMessage(nextMessageId());
    messages.push(assistantMsg);
    scrollToBottom(`message-${assistantMsg.id}`);

    const queue: string[] = []; // 待渲染字符队列
    let isAnimating = false; // 动画锁
    let displayBuffer = ''; // 当前已显示的纯文本缓冲区
    let hasThinkingUpdate = false; // 思考内容是否有更新的标记

    // 消费队列的渲染循环
    const flushQueue = () => {
      // 只要队列有内容或思考内容有更新，就认为需要滚动
      const shouldScroll = queue.length > 0 || hasThinkingUpdate;
      if (queue.length === 0 && !hasThinkingUpdate) {
        isAnimating = false;
        return;
      }

      if (queue.length > 0) {
        // 自适应步长：队列堆积越多，消费速度越快，平衡流畅度与实时性
        const step = queue.length > 50 ? 5 : queue.length > 20 ? 2 : 1;
        const chunk = queue.splice(0, step).join('');

        displayBuffer += chunk;
        assistantMsg.content = renderMarkdown(displayBuffer);
      }
      // 思考内容有更新，更新标记并刷新视图
      if (hasThinkingUpdate) {
        hasThinkingUpdate = false;
      }

      const index = messages.findIndex((m) => m.id === assistantMsg.id);
      if (index !== -1) {
        messages[index] = { ...assistantMsg };
      }

      if (shouldScroll) {
        scrollToBottom(`message-${assistantMsg.id}`);
      }
      requestAnimationFrame(flushQueue);
    };

    return new Promise<void>((resolve) => {
      let gotFirst = false;
      const requestData = imageFile
        ? (() => {
            const formData = new FormData();
            formData.append('messages', JSON.stringify(requestMessages));
            formData.append('stream', 'true');
            formData.append('model', selectedModel);
            formData.append('image', imageFile);
            if (
              sessionId !== undefined &&
              sessionId !== null &&
              sessionId !== ''
            ) {
              formData.append('sessionId', String(sessionId));
            }
            return formData;
          })()
        : {
            messages: requestMessages,
            sessionId,
            stream: true,
            model: selectedModel,
          };

      streamFetch({
        url: api.chat,
        data: requestData,

        onMessage: (chunk: string) => {
          if (!chunk) return;
          if (!gotFirst) {
            gotFirst = true;
            assistantMsg.status = 'success';
          }
          // 流式返回的数据不要立刻渲染，先放入队列等待消费，保持后续渲染的平滑度
          queue.push(...chunk.split(''));

          if (!isAnimating) {
            isAnimating = true;
            flushQueue();
          }
        },

        onThinking: (thinking) => {
          if (!gotFirst) {
            gotFirst = true;
            assistantMsg.status = 'success';
          }
          assistantMsg.reasoning_content += thinking;
          hasThinkingUpdate = true;

          if (!isAnimating) {
            isAnimating = true;
            flushQueue();
          }
        },

        onDone: (doneSessionId) => {
          // 网络请求结束，等待队列消费完毕
          onDoneSession?.(doneSessionId ?? sessionId);
          assistantMsg.status = 'done';
          const checkDone = setInterval(() => {
            if (queue.length === 0) {
              clearInterval(checkDone);
              isAssistantTyping.value = false;
              assistantMsg.status = 'done';
              resolve();
            }
          }, 50);
        },

        onError: (err) => {
          assistantMsg.status = 'error';
          isAssistantTyping.value = false;
          console.error('流式请求出错:', err);
          resolve();
        },
      });
    });
  }

  return {
    isAssistantTyping,
    streamAssistantReply,
  };
}
