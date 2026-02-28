interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  type: 'text' | 'image';
  content: string;
  reasoning_content?: string;
  status?: 'pending' | 'success' | 'done' | 'error';
  timestamp: number;
  quoted?: {
    id: number;
    role: 'assistant' | 'user';
    content: string;
  } | null;
}
interface Session {
  id: number | string;
  title?: string;
  summary?: string;
  created_at?: string;
}
interface ModelOption {
  value: string;
  text: string;
}
interface user {
  openid: string;
  nickname: string;
  avatarUrl: string;
}
type ToastExpose = {
  showToast: (options: { message: string; type?: 'success' | 'error' | 'warning' | 'info'; duration?: number }) => void;
  hideToast: () => void;
  clearTimer: () => void;
};
type HistoryMessage = {
  role: 'assistant' | 'user';
  reasoning_content?: string;
  content: string;
  created_at?: string;
};
export type { ChatMessage, Session, ModelOption, user, ToastExpose, HistoryMessage };