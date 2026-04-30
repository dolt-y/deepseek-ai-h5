interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  type: 'text' | 'image';
  content: string;
  media?: string | null;
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
  id?: number;
  role: 'assistant' | 'user';
  type?: 'text' | 'image' | 'audio';
  media?: string | null;
  liked?: number;
  reasoning_content?: string;
  content: string;
  created_at?: string;
};
export type { ChatMessage, Session, ModelOption, user, ToastExpose, HistoryMessage };
