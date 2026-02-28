export const apiBases = {
  user: '/api/user',
  ai: '/api/ai'
};

const sessionPath = (id) => `/sessions/${id}`;
const messagePath = (id) => `/messages/${id}`;

export const apiPaths = {
  user: {
    login: '/login',
    loginH5: '/login/h5',
    info: '/info',
    refresh: '/refresh'
  },
  ai: {
    chat: '/chat',
    chatMock: '/chat-mock',
    sessions: '/sessions',
    sessionMessages: (id) => `${sessionPath(id)}/messages`,
    deleteSession: (id) => `${sessionPath(id)}/delete`,
    messageLike: (id) => `${messagePath(id)}/like`,
    messageRegenerate: (id) => `${messagePath(id)}/regenerate`,
    speechToText: '/speech-to-text',
    models: '/models'
  }
};
