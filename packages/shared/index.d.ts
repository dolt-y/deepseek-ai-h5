export const apiBases: {
  user: string;
  ai: string;
};

export const apiPaths: {
  user: {
    login: string;
    loginH5: string;
    info: string;
    refresh: string;
  };
  ai: {
    chat: string;
    chatMock: string;
    sessions: string;
    sessionMessages: (id: string | number) => string;
    deleteSession: (id: string | number) => string;
    messageLike: (id: string | number) => string;
    messageRegenerate: (id: string | number) => string;
    speechToText: string;
    models: string;
  };
};
