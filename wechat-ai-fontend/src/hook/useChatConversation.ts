import { nextTick, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { get, post } from '@/utils/request';
import api from '@/utils/api';
import type {
  ChatMessage,
  Session,
  ModelOption,
  HistoryMessage,
} from '@/utils/type';
import { resolveMediaUrl } from '@/utils/media';
import { useChatScroll } from './useChatScroll';
import { useChatStream } from './useChatStream';

export function useChatConversation() {
  const { scrollToBottom, bottomAnchorId } = useChatScroll();
  const { isAssistantTyping, streamAssistantReply } =
    useChatStream(scrollToBottom);

  const messages = ref<ChatMessage[]>([]);
  const messageIdSeed = ref<number>(0);
  const nextMessageId = () => ++messageIdSeed.value;

  const inputValue = ref<string>('');
  const sessionId = ref<number | string>();
  const historySessionsVisible = ref<boolean>(false);

  const selectedModel = ref<string>('deepseek-chat');
  const modelOptions = ref<ModelOption[]>([
    { value: 'deepseek-chat', text: '快速问答' },
    { value: 'deepseek-reasoner', text: '深度思考' },
  ]);

  function revokeBlobUrls(targetMessages: ChatMessage[]) {
    for (const message of targetMessages) {
      const url = message.media || message.content;
      if (typeof url === 'string' && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    }
  }

  const initializeConversation = () => {
    revokeBlobUrls(messages.value);
    messageIdSeed.value = 0;
    messages.value = [createAssistantGreeting()];
    scrollToBottom();
  };

  function createAssistantGreeting(): ChatMessage {
    return {
      id: nextMessageId(),
      role: 'assistant',
      type: 'text',
      content:
        '你好，我是你的 AI 助手小梦。随时告诉我你的想法，我会帮你整理、发散并给出下一步建议。',
      status: 'done',
      timestamp: Date.now(),
      quoted: null,
    };
  }

  initializeConversation();

  function updateSessionId(nextSessionId?: string | number) {
    if (
      nextSessionId === undefined ||
      nextSessionId === null ||
      nextSessionId === ''
    ) {
      return;
    }
    if (typeof nextSessionId === 'number') {
      sessionId.value = nextSessionId;
      return;
    }

    const parsed = Number(nextSessionId);
    if (!Number.isNaN(parsed) && String(parsed) === String(nextSessionId)) {
      sessionId.value = parsed;
      return;
    }

    sessionId.value = nextSessionId;
  }

  function setUserMessageStatus(
    messageId: number,
    status: ChatMessage['status']
  ) {
    const userIndex = messages.value.findIndex((item) => item.id === messageId);
    if (userIndex === -1) return;
    messages.value[userIndex] = {
      ...messages.value[userIndex],
      status,
    };
  }

  function resolveHistoryImageSource(item: HistoryMessage) {
    const mediaValue = item.media ? resolveMediaUrl(item.media) : '';
    if (mediaValue) return mediaValue;

    const content = String(item.content || '');
    if (/^(https?:)?\/\//i.test(content)) return resolveMediaUrl(content);
    if (content.startsWith('data:image/') || content.startsWith('blob:'))
      return content;
    if (content.startsWith('/uploads/')) return resolveMediaUrl(content);
    return '';
  }

  async function handleSendMessage(rawContent?: string) {
    const content = (rawContent ?? inputValue.value).trim();
    if (!content) {
      return;
    }
    if (isAssistantTyping.value) {
      return;
    }

    const userMessage: ChatMessage = {
      id: nextMessageId(),
      role: 'user',
      type: 'text',
      content,
      status: 'pending',
      timestamp: Date.now(),
      quoted: null,
    };

    messages.value.push(userMessage);
    inputValue.value = '';
    scrollToBottom(`message-${userMessage.id}`);

    setUserMessageStatus(userMessage.id, 'success');

    await streamAssistantReply(messages.value, nextMessageId, {
      requestMessages: [{ role: 'user', type: 'text', content }],
      sessionId: sessionId.value,
      selectedModel: selectedModel.value,
      onDoneSession: updateSessionId,
    });
  }

  async function handleUploadImage(file: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      ElMessage.warning('请选择图片文件');
      return;
    }
    if (isAssistantTyping.value) {
      ElMessage.info('AI 正在回复，请稍后再上传图片');
      return;
    }

    const prompt = inputValue.value.trim();
    const previewUrl = URL.createObjectURL(file);
    const userMessage: ChatMessage = {
      id: nextMessageId(),
      role: 'user',
      type: 'image',
      content: previewUrl,
      media: previewUrl,
      status: 'pending',
      timestamp: Date.now(),
      quoted: null,
    };

    messages.value.push(userMessage);
    inputValue.value = '';
    scrollToBottom(`message-${userMessage.id}`);
    setUserMessageStatus(userMessage.id, 'success');

    await streamAssistantReply(messages.value, nextMessageId, {
      requestMessages: [{ role: 'user', type: 'image', content: prompt }],
      sessionId: sessionId.value,
      selectedModel: selectedModel.value,
      imageFile: file,
      onDoneSession: updateSessionId,
    });
  }

  async function handleNewSession() {
    if (isAssistantTyping.value) {
      return;
    }
    sessionId.value = undefined;
    initializeConversation();
  }

  async function applyHistoryMessages(rawMessages: HistoryMessage[]) {
    if (!rawMessages.length) {
      initializeConversation();
      return;
    }

    messageIdSeed.value = 0;
    const parsedMessages = rawMessages.map((item) => {
      const imageSource =
        item.type === 'image' ? resolveHistoryImageSource(item) : '';
      const isImageMessage = Boolean(imageSource);
      return {
        id: nextMessageId(),
        role: item.role,
        type: isImageMessage ? ('image' as const) : ('text' as const),
        content: isImageMessage ? imageSource : item.content,
        media: isImageMessage ? imageSource : null,
        reasoning_content: item.reasoning_content,
        status: 'done' as const,
        timestamp: item.created_at
          ? new Date(item.created_at).getTime()
          : Date.now(),
        quoted: null,
      };
    });

    revokeBlobUrls(messages.value);
    messages.value = [...parsedMessages];
    await nextTick();
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    const chatBody = document.querySelector('.chat-body') as HTMLElement | null;
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight;
    } else {
      scrollToBottom();
    }
  }

  async function handleSelectSession(session: Session) {
    if (!session?.id) {
      ElMessage.error('没有找到该会话');
      return;
    }
    if (isAssistantTyping.value) {
      ElMessage.info('AI正在回复，请稍后再切换会话');
      return;
    }
    try {
      const res: any = await get(api.selectSession(session.id));
      const historyMessages = Array.isArray(res?.messages) ? res.messages : [];
      await applyHistoryMessages(historyMessages);
      sessionId.value =
        typeof session.id === 'string' ? session.id : Number(session.id);
      historySessionsVisible.value = false;
    } catch (error) {
      ElMessage.error('加载历史会话失败');
    }
  }

  function handleRegenerate(messageId: number) {
    const assistantMsgIndex = messages.value.findIndex(
      (m) => m.id === messageId
    );
    if (assistantMsgIndex === -1) return;
    const userMsgIndex = assistantMsgIndex - 1;
    if (userMsgIndex < 0 || messages.value[userMsgIndex].role !== 'user')
      return;
    const userMsg = messages.value[userMsgIndex];
    if (userMsg.type !== 'text') {
      ElMessage.info('图片消息暂不支持前端重新生成，请使用会话继续提问');
      return;
    }
    messages.value.splice(assistantMsgIndex, 1);
    streamAssistantReply(messages.value, nextMessageId, {
      requestMessages: [
        { role: 'user', type: 'text', content: userMsg.content },
      ],
      sessionId: sessionId.value,
      selectedModel: selectedModel.value,
      onDoneSession: updateSessionId,
    });
  }

  async function handleLike(data: { messageId: number }) {
    try {
      await post(api.like(data.messageId));
    } catch (error) {
      ElMessage.error('点赞失败，请稍后重试');
    }
  }

  function handelDelete(sessionIdValue: number | string) {
    ElMessage.success('会话已删除');
    if (sessionId.value === sessionIdValue) {
      initializeConversation();
      sessionId.value = undefined;
      historySessionsVisible.value = false;
    }
  }

  return {
    messages,
    inputValue,
    selectedModel,
    modelOptions,
    isAssistantTyping,
    sessionId,
    historySessionsVisible,
    bottomAnchorId,
    handleSendMessage,
    handleUploadImage,
    handleNewSession,
    handleSelectSession,
    handleRegenerate,
    handleLike,
    handelDelete,
  };
}
