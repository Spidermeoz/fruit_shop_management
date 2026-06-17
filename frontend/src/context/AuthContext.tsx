import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clientHttp,
  clientTokenStore,
  AUTH_ERROR_CLIENT,
} from "../services/http";

type ClientUser = {
  id: number;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar: string | null;
};

type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
};

type AuthState = {
  loading: boolean;
  user: ClientUser | null;
  isAuthenticated: boolean;
  register: (input: RegisterInput) => Promise<void>;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const Ctx = createContext<AuthState | undefined>(undefined);

const CLIENT_USER_KEY = "client.currentUser";

const safeJsonParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const normalizeUser = (raw: any): ClientUser | null => {
  if (!raw) return null;
  return {
    id: Number(raw.id),
    full_name: raw.full_name ?? raw.fullName ?? null,
    email: String(raw.email ?? ""),
    phone: raw.phone ?? null,
    avatar: raw.avatar ?? null,
  };
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useAuth must be used within client AuthProvider");
  }
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<ClientUser | null>(() =>
    safeJsonParse<ClientUser | null>(
      localStorage.getItem(CLIENT_USER_KEY),
      null,
    ),
  );

  const isAuthenticated = !!user;

  const persistUser = useCallback((nextUser: ClientUser | null) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem(CLIENT_USER_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(CLIENT_USER_KEY);
    }
  }, []);

  // Xử lý khi refresh token hết hạn / fail → force logout
  const forceLogout = useCallback(() => {
    clientTokenStore.setAccess(null);
    clientTokenStore.setRefresh(null);
    persistUser(null);
  }, [persistUser]);

  // Lắng nghe auth error event từ http interceptor
  useEffect(() => {
    const handler = () => forceLogout();
    window.addEventListener(AUTH_ERROR_CLIENT, handler);
    return () => window.removeEventListener(AUTH_ERROR_CLIENT, handler);
  }, [forceLogout]);

  const register = async (input: RegisterInput) => {
    const res = await clientHttp<any>("POST", "/api/v1/client/auth/register", {
      fullName: input.fullName,
      email: input.email,
      password: input.password,
      phone: input.phone,
    });

    const accessToken = res?.data?.accessToken;
    const refreshToken = res?.data?.refreshToken;
    const nextUser = normalizeUser(res?.data?.user ?? null);

    if (!accessToken || !refreshToken || !nextUser) {
      throw new Error("Đăng ký không thành công. Vui lòng thử lại.");
    }

    clientTokenStore.setAccess(accessToken);
    clientTokenStore.setRefresh(refreshToken);
    persistUser(nextUser);
  };

  const login = async (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => {
    const res = await clientHttp<any>("POST", "/api/v1/client/auth/login", {
      email,
      password,
      rememberMe: !!rememberMe,
    });

    const accessToken = res?.data?.accessToken;
    const refreshToken = res?.data?.refreshToken;
    const nextUser = normalizeUser(res?.data?.user ?? null);

    if (!accessToken || !refreshToken || !nextUser) {
      throw new Error("Dữ liệu đăng nhập client không hợp lệ");
    }

    clientTokenStore.setAccess(accessToken);
    clientTokenStore.setRefresh(refreshToken);
    persistUser(nextUser);
  };

  const logout = async () => {
    try {
      await clientHttp("POST", "/api/v1/client/auth/logout");
    } catch {
      // ignore
    } finally {
      clientTokenStore.setAccess(null);
      clientTokenStore.setRefresh(null);
      persistUser(null);
    }
  };

  const refreshSession = async () => {
    const rt = clientTokenStore.getRefresh();
    if (!rt) throw new Error("No refresh token");

    const res = await clientHttp<any>("POST", "/api/v1/client/auth/refresh", {
      refreshToken: rt,
    });

    const accessToken = res?.data?.accessToken;
    if (!accessToken) {
      throw new Error("Invalid refresh response");
    }
    clientTokenStore.setAccess(accessToken);
  };

  // Khởi tạo session khi app mount
  useEffect(() => {
    (async () => {
      try {
        const rt = clientTokenStore.getRefresh();
        const at = clientTokenStore.getAccess();

        // Có refresh token nhưng không có access token → refresh
        if (!at && rt) {
          await refreshSession();
        }

        if (clientTokenStore.getAccess()) {
          const me = await clientHttp<any>("GET", "/api/v1/client/auth/me");
          persistUser(normalizeUser(me?.data?.user ?? me?.data ?? null));
        } else {
          persistUser(null);
        }
      } catch {
        clientTokenStore.setAccess(null);
        clientTokenStore.setRefresh(null);
        persistUser(null);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      user,
      isAuthenticated,
      register,
      login,
      logout,
      refreshSession,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, user, isAuthenticated],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
