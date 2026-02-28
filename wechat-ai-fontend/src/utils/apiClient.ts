import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from '@/types/openapi';

const baseUrl = import.meta.env.VITE_OPENAI_BASE_URL;

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const token = localStorage.getItem('token');
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    return request;
  },
};

export const apiClient = createClient<paths>({ baseUrl });
apiClient.use(authMiddleware);
