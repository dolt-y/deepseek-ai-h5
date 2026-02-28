import { nextTick, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { get, post } from '@/utils/request';
import api from '@/utils/api';
import type { ChatMessage, Session, ModelOption, HistoryMessage } from '@/utils/type';
import { useChatScroll } from './useChatScroll';
import { useChatStream } from './useChatStream';

export function useChatConversation() {
  const { scrollToBottom, bottomAnchorId } = useChatScroll();
  const { isAssistantTyping, streamAssistantReply } = useChatStream(scrollToBottom);

  const messages = ref<ChatMessage[]>([]);
  const messageIdSeed = ref<number>(0);
  const nextMessageId = () => ++messageIdSeed.value;

  const inputValue = ref<string>('');
  const sessionId = ref<number | string>();
  const historySessionsVisible = ref<boolean>(false);

  const selectedModel = ref<string>('deepseek-chat');
  const modelOptions = ref<ModelOption[]>([
    { value: 'deepseek-chat', text: '快速问答' },
    { value: 'deepseek-reasoner', text: '深度思考' }
  ]);

  const initializeConversation = () => {
    messageIdSeed.value = 0;
    messages.value = [createAssistantGreeting()];
    scrollToBottom();
  };

  function createAssistantGreeting(): ChatMessage {
    return {
      id: nextMessageId(),
      role: 'assistant',
      type: 'text',
      content: '你好，我是你的 AI 助手小梦。随时告诉我你的想法，我会帮你整理、发散并给出下一步建议。',
      status: 'done',
      timestamp: Date.now(),
      quoted: null
    };
  }

  initializeConversation();

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
      quoted: null
    };

    messages.value.push(userMessage);
    inputValue.value = '';
    scrollToBottom(`message-${userMessage.id}`);

    userMessage.status = 'success';
    const userIndex = messages.value.findIndex(m => m.id === userMessage.id);
    if (userIndex !== -1) {
      messages.value[userIndex] = { ...userMessage };
    }

    await streamAssistantReply(
      messages.value,
      nextMessageId,
      content,
      sessionId.value,
      selectedModel.value
    );
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
    const parsedMessages = rawMessages.map((item) => ({
      id: nextMessageId(),
      role: item.role,
      type: 'text' as const,
      content: item.content,
      reasoning_content: item.reasoning_content,
      status: 'done' as const,
      timestamp: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
      quoted: null
    }));

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
      applyHistoryMessages(historyMessages);
      sessionId.value = typeof session.id === 'string' ? session.id : Number(session.id);
      historySessionsVisible.value = false;
    } catch (error) {
      ElMessage.error('加载历史会话失败');
    }
  }

  function handleRegenerate(messageId: number) {
    const assistantMsgIndex = messages.value.findIndex(m => m.id === messageId);
    if (assistantMsgIndex === -1) return;
    const userMsgIndex = assistantMsgIndex - 1;
    if (userMsgIndex < 0 || messages.value[userMsgIndex].role !== 'user') return;
    const userMsg = messages.value[userMsgIndex];
    messages.value.splice(assistantMsgIndex, 1);
    streamAssistantReply(messages.value, nextMessageId, userMsg.content, sessionId.value, selectedModel.value);
  }

  function handleLike(data: { messageId: number; liked: boolean }) {
    console.log('消息点赞:', data);
    const res: any = post(api.like(data.messageId));
    console.log('点赞结果:', res);
  }

  function handleSettings() {
    console.log('打开设置');
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
    sessionId,
    historySessionsVisible,
    bottomAnchorId,
    handleSendMessage,
    handleNewSession,
    handleSelectSession,
    handleRegenerate,
    handleLike,
    handleSettings,
    handelDelete
  };
}
