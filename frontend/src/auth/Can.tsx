import React from "react";
import { useAuth } from "./AuthContext";

const Can: React.FC<{ module: string; action: string; children: React.ReactNode }> = ({ module, action, children }) => {
  const { hasPermission } = useAuth();
  if (!hasPermission(module, action)) return null;
  return <>{children}</>;
};
export default Can;
