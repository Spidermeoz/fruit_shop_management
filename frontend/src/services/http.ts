// src/services/http.ts
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
const BASE = import.meta.env.VITE_API_BASE_URL;

// ─────────────────────────────────────────────
// Migration: chuyển old keys sang new prefixed keys
// Chạy 1 lần khi app load, sau đó xóa old keys
// ─────────────────────────────────────────────
const MIGRATION_KEY = "tokenStore.migrated.v2";
if (!localStorage.getItem(MIGRATION_KEY)) {
  // Old client refresh token (không có prefix)
  const oldClientRt = localStorage.getItem("refreshToken");
  if (oldClientRt) {
    localStorage.setItem("client.refreshToken", oldClientRt);
    localStorage.removeItem("refreshToken");
  }
  // Old admin refresh token (có thể cũng là "refreshToken" – chỉ 1 portal dùng tại 1 thời điểm)
  // Không cần migrate admin vì admin và client không cùng login 1 browser thông thường
  localStorage.setItem(MIGRATION_KEY, "1");
}


// ─────────────────────────────────────────────
// Token Stores – tách riêng client / admin
// để 2 portal không dùng chung bộ nhớ
// ─────────────────────────────────────────────
const makeTokenStore = (prefix: "client" | "admin") => {
  // Access token: lưu localStorage (sống qua reload)
  const AT_KEY = `${prefix}.accessToken`;
  // Refresh token: lưu localStorage
  const RT_KEY = `${prefix}.refreshToken`;

  return {
    setAccess(t: string | null) {
      if (!t) localStorage.removeItem(AT_KEY);
      else localStorage.setItem(AT_KEY, t);
    },
    getAccess(): string | null {
      return localStorage.getItem(AT_KEY);
    },
    setRefresh(t: string | null) {
      if (!t) localStorage.removeItem(RT_KEY);
      else localStorage.setItem(RT_KEY, t);
    },
    getRefresh(): string | null {
      return localStorage.getItem(RT_KEY);
    },
  };
};

export const clientTokenStore = makeTokenStore("client");
export const adminTokenStore = makeTokenStore("admin");

// Legacy alias – giữ nguyên để không break code cũ đang import tokenStore
// Trỏ vào clientTokenStore (dùng cho client auth context)
export const tokenStore = clientTokenStore;

// ─────────────────────────────────────────────
// ApiError
// ─────────────────────────────────────────────
export class ApiError extends Error {
  status: number;
  code?: string;
  data?: any;
  payload?: any;

  constructor(
    message: string,
    options?: {
      status?: number;
      code?: string;
      data?: any;
      payload?: any;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options?.status ?? 0;
    this.code = options?.code;
    this.data = options?.data;
    this.payload = options?.payload;
  }
}

// ─────────────────────────────────────────────
// Auth-error events – AuthContext lắng nghe
// để tự logout khi refresh token fail
// ─────────────────────────────────────────────
export const AUTH_ERROR_CLIENT = "auth:error:client";
export const AUTH_ERROR_ADMIN = "auth:error:admin";

// ─────────────────────────────────────────────
// HTTP Client Factory
// ─────────────────────────────────────────────
interface HttpClientConfig {
  store: ReturnType<typeof makeTokenStore>;
  refreshUrl: string; // endpoint refresh riêng của portal
  authErrorEvent: string; // event name để dispatch khi fail
}

function createHttpClient(config: HttpClientConfig) {
  const { store, refreshUrl, authErrorEvent } = config;

  // Một lần refresh tại một thời điểm – tránh race condition
  let refreshPromise: Promise<string | null> | null = null;

  async function doRefresh(): Promise<string | null> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      try {
        const rt = store.getRefresh();
        if (!rt) return null;

        const r = await fetch(BASE + refreshUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ refreshToken: rt }),
        });

        const j = await r.json().catch(() => ({}));

        if (!r.ok || !j?.success || !j?.data?.accessToken) {
          // Refresh thất bại → xóa token, thông báo logout
          store.setAccess(null);
          store.setRefresh(null);
          window.dispatchEvent(new CustomEvent(authErrorEvent));
          return null;
        }

        const newAt: string = j.data.accessToken;
        store.setAccess(newAt);
        return newAt;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  }

  async function coreFetch(url: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers || {});
    if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    init.credentials = "include";

    const at = store.getAccess();
    if (at) headers.set("Authorization", `Bearer ${at}`);

    const res = await fetch(BASE + url, { ...init, headers });
    if (res.status !== 401) return res;

    // 401 → thử refresh 1 lần
    const newAt = await doRefresh();
    if (!newAt) return res; // refresh fail → trả về response 401 gốc

    // Retry với access token mới
    const headers2 = new Headers(init.headers || {});
    if (!headers2.has("Content-Type") && !(init.body instanceof FormData)) {
      headers2.set("Content-Type", "application/json");
    }
    headers2.set("Authorization", `Bearer ${newAt}`);
    return fetch(BASE + url, { ...init, headers: headers2, credentials: "include" });
  }

  async function http<T = any>(
    method: HttpMethod,
    url: string,
    body?: any,
  ): Promise<T> {
    const init: RequestInit = { method };

    if (body !== undefined && !(body instanceof FormData)) {
      init.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      init.body = body;
    }

    const res = await coreFetch(url, init);
    const json = await res.json().catch(() => ({}));

    if (!res.ok || json?.success === false) {
      const message = json?.message || res.statusText || "Request failed";
      throw new ApiError(message, {
        status: res.status,
        code: json?.code,
        data: json?.data ?? null,
        payload: json,
      });
    }

    return json as T;
  }

  return { http, coreFetch };
}

// ─────────────────────────────────────────────
// Client HTTP instance
// ─────────────────────────────────────────────
const clientClient = createHttpClient({
  store: clientTokenStore,
  refreshUrl: "/api/v1/client/auth/refresh",
  authErrorEvent: AUTH_ERROR_CLIENT,
});

export const clientHttp = clientClient.http;

// ─────────────────────────────────────────────
// Admin HTTP instance
// ─────────────────────────────────────────────
const adminClient = createHttpClient({
  store: adminTokenStore,
  refreshUrl: "/api/v1/auth/refresh",
  authErrorEvent: AUTH_ERROR_ADMIN,
});

export const adminHttp = adminClient.http;

// ─────────────────────────────────────────────
// Legacy default export – giữ tương thích với
// các file admin import { http } from "../services/http"
// ─────────────────────────────────────────────
export const http = adminHttp;

// ─────────────────────────────────────────────
// Misc APIs (giữ nguyên)
// ─────────────────────────────────────────────
export const forgotPasswordApi = {
  request: (email: string) =>
    clientHttp("POST", "/api/v1/client/forgot-password/request", { email }),
  verify: (email: string, otp: string) =>
    clientHttp("POST", "/api/v1/client/forgot-password/verify", { email, otp }),
  reset: (email: string, otp: string, password: string) =>
    clientHttp("POST", "/api/v1/client/forgot-password/reset", {
      email,
      otp,
      password,
    }),
};
