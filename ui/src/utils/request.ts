// request.ts
import api from '@/utils/api';

type Method = "GET" | "POST";

interface RequestOptions {
    method?: Method;
    data?: any;
    params?: Record<string, any>;
    skipAuthRefresh?: boolean;
}

export interface AuthTokenResponse {
    accessToken?: string;
    access_token?: string;
    refreshToken?: string;
    refresh_token?: string;
    token?: string;
    data?: AuthTokenResponse;
}

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const LEGACY_TOKEN_KEY = "token";
const TOKEN_REFRESH_THRESHOLD_SECONDS = 5 * 60;

let refreshingPromise: Promise<string> | null = null;

export const getAccessToken = () =>
    localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY) || "";

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY) || "";

export function clearAuthTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function setAccessToken(accessToken: string) {
    if (!accessToken) return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    // 保留旧 key，避免仍读取 localStorage.token 的页面逻辑立即失效。
    localStorage.setItem(LEGACY_TOKEN_KEY, accessToken);
}

function pickAccessToken(payload?: AuthTokenResponse): string {
    return (
        payload?.accessToken ||
        payload?.access_token ||
        payload?.token ||
        payload?.data?.accessToken ||
        payload?.data?.access_token ||
        payload?.data?.token ||
        ""
    );
}

function pickRefreshToken(payload?: AuthTokenResponse): string {
    return (
        payload?.refreshToken ||
        payload?.refresh_token ||
        payload?.data?.refreshToken ||
        payload?.data?.refresh_token ||
        ""
    );
}

export function saveAuthTokens(payload?: AuthTokenResponse) {
    const accessToken = pickAccessToken(payload);
    const refreshToken = pickRefreshToken(payload);

    if (accessToken) {
        setAccessToken(accessToken);
    }
    if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    return { accessToken, refreshToken };
}

function decodeJwtPayload(tokenValue: string): { exp?: number } | null {
    try {
        const payload = tokenValue.split(".")[1];
        if (!payload) return null;
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
        const json = decodeURIComponent(
            atob(paddedBase64)
                .split("")
                .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
                .join("")
        );
        return JSON.parse(json);
    } catch (err) {
        return null;
    }
}

export function isJwtExpiring(tokenValue: string, thresholdSeconds = TOKEN_REFRESH_THRESHOLD_SECONDS) {
    const payload = decodeJwtPayload(tokenValue);
    if (!payload?.exp) return true;
    const nowSeconds = Math.floor(Date.now() / 1000);
    return payload.exp - nowSeconds <= thresholdSeconds;
}

function buildURL(url: string, params?: Record<string, any>) {
    if (!params) return url;
    const query = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
    return query ? `${url}?${query}` : url;
}

function isAuthEndpoint(url: string) {
    return url.includes("/api/user/login") || url.includes("/api/user/refresh");
}

async function readErrorMessage(res: Response) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        const errorBody = await res.json().catch(() => null);
        return errorBody?.msg || `HTTP ${res.status}: ${res.statusText}`;
    }
    const text = await res.text().catch(() => "");
    return text || `HTTP ${res.status}: ${res.statusText}`;
}

async function readJson<T>(res: Response): Promise<T> {
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
        return undefined as T;
    }
    return res.json() as Promise<T>;
}

async function fetchWithAccessToken(url: string, options: RequestOptions, accessToken: string) {
    const { method = "GET", data, params } = options;
    const fullURL = buildURL(url, params);
    const isFormData = data instanceof FormData;
    const headers: Record<string, string> = {
        "Cache-Control": "no-cache",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    if (!isFormData) {
        headers["content-type"] = "application/json";
    }

    return fetch(fullURL, {
        method,
        headers,
        body: method === "POST"
            ? isFormData
                ? data
                : JSON.stringify(data)
            : undefined,
    });
}

async function requestNewAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        clearAuthTokens();
        throw new Error("未找到 refreshToken");
    }

    const res = await fetch(api.refreshToken, {
        method: "POST",
        headers: {
            "Cache-Control": "no-cache",
            "content-type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
        const message = await readErrorMessage(res);
        clearAuthTokens();
        throw new Error(message);
    }

    const payload = await readJson<AuthTokenResponse>(res);
    const { accessToken } = saveAuthTokens(payload);
    if (!accessToken) {
        clearAuthTokens();
        throw new Error("刷新登录态失败");
    }
    return accessToken;
}

export async function refreshAccessToken() {
    if (!refreshingPromise) {
        refreshingPromise = requestNewAccessToken().finally(() => {
            refreshingPromise = null;
        });
    }
    return refreshingPromise;
}

export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const fullURL = buildURL(url, options.params);
    const canRefreshAuth = !options.skipAuthRefresh && !isAuthEndpoint(fullURL);
    const accessToken = isAuthEndpoint(fullURL) ? "" : getAccessToken();

    let res = await fetchWithAccessToken(url, options, accessToken);

    if (res.status === 401 && canRefreshAuth && getRefreshToken()) {
        try {
            const nextAccessToken = await refreshAccessToken();
            res = await fetchWithAccessToken(url, options, nextAccessToken);
        } catch (err) {
            clearAuthTokens();
        }
    }

    if (!res.ok) {
        throw new Error(await readErrorMessage(res));
    }

    return readJson<T>(res);
}

export const get = <T>(url: string, params?: Record<string, any>) =>
    request<T>(url, { method: "GET", params });

export const post = <T>(url: string, data?: any, options: Omit<RequestOptions, "method" | "data"> = {}) =>
    request<T>(url, { ...options, method: "POST", data });
