// src/utils/api.ts
// 所有接口列表
import { apiBases, apiPaths } from '@ai-h5/shared';

const API_BASE = import.meta.env.VITE_OPENAI_BASE_URL;

export const fixedApi = {
    getSessionList: `${apiBases.ai}${apiPaths.ai.sessions}`,
    chat: `${apiBases.ai}${apiPaths.ai.chat}`,
    recording: `${apiBases.ai}${apiPaths.ai.speechToText}`,
    h5Login: `${apiBases.user}${apiPaths.user.loginH5}`,
} as const;

// 动态接口，需传入参数
export const dynamicApi = {
    deleteSession: (id: string | number) => `${apiBases.ai}${apiPaths.ai.deleteSession(id)}`,
    selectSession: (id: string | number) => `${apiBases.ai}${apiPaths.ai.sessionMessages(id)}`,
    like: (id: string | number) => `${apiBases.ai}${apiPaths.ai.messageLike(id)}`,
} as const;

type FixedKeys = keyof typeof fixedApi;
type DynamicKeys = keyof typeof dynamicApi;

const api = {} as {
    [K in FixedKeys]: string;
} & {
    [K in DynamicKeys]: (id: string | number) => string;
};

for (const k in fixedApi) {
    const key = k as FixedKeys;
    api[key] = API_BASE + fixedApi[key];
}

for (const k in dynamicApi) {
    const key = k as DynamicKeys;
    api[key] = (id: string | number) => API_BASE + dynamicApi[key](id);
}

export default api;
