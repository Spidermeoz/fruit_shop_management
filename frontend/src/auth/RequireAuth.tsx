import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const loc = useLocation();

  if (loading) return null; // hoặc spinner global

  if (!isAuthenticated) {
    // ✅ redirect đúng trang login admin
    return <Navigate to="/admin/auth/login" replace state={{ from: loc }} />;
  }
  return <>{children}</>;
};

export default RequireAuth;
