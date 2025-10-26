import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { http, tokenStore } from "../services/http";

type Permissions = Record<string, string[]>;

type AuthUser = {
  id: number;
  role_id: number | null;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar: string | null;
  status: "active" | "inactive" | "banned";
  deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  role: { id: number; title: string } | null;
};

type LoginResp = {
  success: true;
  data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    permissions: Permissions;
  };
  meta: { total: number; page: number; limit: number };
};

type MeResp = {
  success: true;
  data: { user: AuthUser; permissions: Permissions };
  meta: any;
};

type RefreshResp = {
  success: true;
  data: { accessToken: string };
  meta: any;
};

type AuthState = {
  loading: boolean;
  user: AuthUser | null;
  permissions: Permissions;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (moduleKey: string, actionKey: string) => boolean;
  refreshSession: () => Promise<void>;
};

const Ctx = createContext<AuthState>({} as any);
export const useAuth = () => useContext(Ctx);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permissions, setPermissions] = useState<Permissions>({});

  const isAuthenticated = !!user;

  const hasPermission = (moduleKey: string, actionKey: string) => {
    const arr = permissions?.[moduleKey] || [];
    return Array.isArray(arr) && arr.includes(actionKey);
  };

  const login = async (email: string, password: string) => {
    const res = await http<LoginResp>("POST", "/api/v1/auth/login", { email, password });
    tokenStore.setAccess(res.data.accessToken);
    tokenStore.setRefresh(res.data.refreshToken);
    setUser(res.data.user);
    setPermissions(res.data.permissions || {});
  };

  const logout = async () => {
    try {
      await http("POST", "/api/v1/auth/logout");
    } catch (_) { /* ignore */ }
    tokenStore.setAccess(null);
    tokenStore.setRefresh(null);
    setUser(null);
    setPermissions({});
  };

  const refreshSession = async () => {
    const rt = tokenStore.getRefresh();
    if (!rt) throw new Error("No refresh token");
    const res = await http<RefreshResp>("POST", "/api/v1/auth/refresh", { refreshToken: rt });
    tokenStore.setAccess(res.data.accessToken);
  };

  // Khi app mount → cố gắng refresh + getMe
  useEffect(() => {
    (async () => {
      try {
        const rt = tokenStore.getRefresh();
        if (!rt) return;
        await refreshSession();
        const me = await http<MeResp>("GET", "/api/v1/auth/me");
        setUser(me.data.user);
        setPermissions(me.data.permissions || {});
      } catch (_) {
        tokenStore.setAccess(null);
        // giữ refresh để user reload vẫn có thể login silent; nếu muốn sạch hẳn: tokenStore.setRefresh(null)
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value = useMemo<AuthState>(() => ({
    loading,
    user,
    permissions,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    refreshSession,
  }), [loading, user, permissions, isAuthenticated]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
