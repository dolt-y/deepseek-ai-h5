// src/utils/api.ts
// 所有接口列表
const API_BASE = import.meta.env.VITE_OPENAI_BASE_URL

export const fixedApi = {
    getSessionList: "/api/ai/sessions",
    chat: "/api/ai/chat",
    recording:'/api/ai/speech-to-text',
    h5Login: "/api/user/login/h5",
} as const;

// 动态接口，需传入参数
export const dynamicApi = {
    deleteSession: (id: string | number) => `/api/ai/sessions/${id}/delete`,
    selectSession: (id: string | number) => `/api/ai/sessions/${id}/messages`,
    like: (id: string | number) => `/api/ai/messages/${id}/like`,
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
