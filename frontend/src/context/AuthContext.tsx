import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { http, tokenStore } from "../services/http";

type ClientUser = {
  id: number;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar: string | null;
};

type AuthState = {
  loading: boolean;
  user: ClientUser | null;
  isAuthenticated: boolean;
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

  const persistUser = (nextUser: ClientUser | null) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem(CLIENT_USER_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(CLIENT_USER_KEY);
    }
  };

  const login = async (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => {
    const res = await http<any>("POST", "/api/v1/client/auth/login", {
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

    tokenStore.setAccess(accessToken);
    tokenStore.setRefresh(refreshToken);
    persistUser(nextUser);
  };

  const logout = async () => {
    try {
      await http("POST", "/api/v1/client/auth/logout");
    } catch {
      // ignore
    } finally {
      tokenStore.setAccess(null);
      tokenStore.setRefresh(null);
      persistUser(null);
    }
  };

  const refreshSession = async () => {
    const rt = tokenStore.getRefresh();
    if (!rt) throw new Error("No refresh token");

    const res = await http<any>("POST", "/api/v1/client/auth/refresh", {
      refreshToken: rt,
    });

    const accessToken = res?.data?.accessToken;
    if (!accessToken) {
      throw new Error("Invalid refresh response");
    }
    tokenStore.setAccess(accessToken);
  };

  useEffect(() => {
    (async () => {
      try {
        const rt = tokenStore.getRefresh();
        const at = tokenStore.getAccess();

        if (!at && rt) {
          await refreshSession();
        }

        if (tokenStore.getAccess()) {
          const me = await http<any>("GET", "/api/v1/client/auth/me");
          persistUser(normalizeUser(me?.data?.user ?? me?.data ?? null));
        } else {
          persistUser(null);
        }
      } catch {
        tokenStore.setAccess(null);
        tokenStore.setRefresh(null);
        persistUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      user,
      isAuthenticated,
      login,
      logout,
      refreshSession,
    }),
    [loading, user, isAuthenticated],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
