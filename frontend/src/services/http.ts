// src/services/http.ts
type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";
const BASE = "https://backend-fruit-shop.onrender.com"; // Set base URL for backend

let accessToken: string | null = null;

export const tokenStore = {
  setAccess(t: string | null) {
    accessToken = t;
  },
  getAccess() {
    return accessToken;
  },
  // refresh token để sống qua reload → lưu localStorage
  setRefresh(t: string | null) {
    if (!t) localStorage.removeItem("refreshToken");
    else localStorage.setItem("refreshToken", t);
  },
  getRefresh() {
    return localStorage.getItem("refreshToken");
  },
};

export const forgotPasswordApi = {
  request: (email: string) =>
    http("POST", "/api/v1/client/forgot-password/request", { email }),
  verify: (email: string, otp: string) =>
    http("POST", "/api/v1/client/forgot-password/verify", { email, otp }),
  reset: (email: string, otp: string, password: string) =>
    http("POST", "/api/v1/client/forgot-password/reset", {
      email,
      otp,
      password,
    }),
};

async function coreFetch(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  // Add CORS credentials
  init.credentials = "include";

  const at = tokenStore.getAccess();
  if (at) headers.set("Authorization", `Bearer ${at}`);

  const res = await fetch(BASE + url, { ...init, headers });
  if (res.status !== 401) return res;

  // 401 → thử refresh 1 lần
  const rt = tokenStore.getRefresh();
  if (!rt) return res; // không có refresh → fail luôn

  const r = await fetch(BASE + "/api/v1/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: rt }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j?.success || !j?.data?.accessToken) {
    // refresh fail → clear token
    tokenStore.setAccess(null);
    tokenStore.setRefresh(null);
    return res;
  }
  tokenStore.setAccess(j.data.accessToken);

  // retry request gốc với access mới
  const headers2 = new Headers(init.headers || {});
  if (!headers2.has("Content-Type") && !(init.body instanceof FormData)) {
    headers2.set("Content-Type", "application/json");
  }
  headers2.set("Authorization", `Bearer ${j.data.accessToken}`);
  return fetch(BASE + url, { ...init, headers: headers2 });
}

export async function http<T = any>(
  method: HttpMethod,
  url: string,
  body?: any
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
    throw new Error(message);
  }
  return json as T;
}
