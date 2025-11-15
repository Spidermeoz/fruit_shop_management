import React, { createContext, useContext, useEffect, useState } from "react";
import { http, tokenStore } from "../services/http";

interface User {
  avatar: any;
  id: number;
  fullName: string;
  email: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (data: { fullName: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Tự động đăng nhập lại nếu có refresh token
  useEffect(() => {
    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken) {
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await http<{ success: boolean; data: User }> ("GET", "/api/v1/client/auth/me");
        if (res?.success) setUser(res.data);
      } catch (err) {
        console.warn("Auto-login failed:", err);
        tokenStore.setAccess(null);
        tokenStore.setRefresh(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ✅ Đăng nhập
  const login = async (email: string, password: string, remember = false) => {
    const res = await http<any>("POST", "/api/v1/client/auth/login", { email, password });
    if (res?.success && res.data?.accessToken) {
      tokenStore.setAccess(res.data.accessToken);
      tokenStore.setRefresh(remember ? res.data.refreshToken : null);
      setUser(res.data.user);
    } else {
      throw new Error(res?.message || "Đăng nhập thất bại");
    }
  };

  // ✅ Đăng ký
  const register = async (data: { fullName: string; email: string; password: string; phone?: string }) => {
    const res = await http<any>("POST", "/api/v1/client/auth/register", data);
    if (res?.success) {
      await login(data.email, data.password);
    } else {
      throw new Error(res?.message || "Đăng ký thất bại");
    }
  };

  // ✅ Đăng xuất
  const logout = async () => {
    try {
      await http("POST", "/api/v1/client/auth/logout");
    } catch {}
    tokenStore.setAccess(null);
    tokenStore.setRefresh(null);
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
