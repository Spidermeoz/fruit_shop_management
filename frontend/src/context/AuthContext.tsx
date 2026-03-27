import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { http } from "../services/http";

export interface AdminBranch {
  id: number;
  name: string | null;
  code: string | null;
  status?: string | null;
  is_primary?: boolean;
}

export interface AdminUser {
  id: number;
  email?: string;
  full_name?: string | null;
  avatar?: string | null;
  role_id?: number | null;
  branch_ids?: number[];
  primary_branch_id?: number | null;
  branches?: AdminBranch[];
}

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: Record<string, string[]>;
  branches: AdminBranch[];
  currentBranchId: number | null;
  currentBranch: AdminBranch | null;
  setCurrentBranchId: (branchId: number | null) => void;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const CURRENT_USER_KEY = "currentUser";
const PERMISSIONS_KEY = "permissions";
const CURRENT_BRANCH_ID_KEY = "currentBranchId";

const safeJsonParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const getStoredUser = (): AdminUser | null => {
  return safeJsonParse<AdminUser | null>(
    localStorage.getItem(CURRENT_USER_KEY),
    null,
  );
};

const getStoredPermissions = (): Record<string, string[]> => {
  return safeJsonParse<Record<string, string[]>>(
    localStorage.getItem(PERMISSIONS_KEY),
    {},
  );
};

const normalizeUser = (raw: any): AdminUser | null => {
  if (!raw) return null;

  return {
    id: Number(raw.id),
    email: raw.email,
    full_name: raw.full_name ?? raw.fullName ?? null,
    avatar: raw.avatar ?? null,
    role_id:
      raw.role_id !== undefined && raw.role_id !== null
        ? Number(raw.role_id)
        : null,
    branch_ids: Array.isArray(raw.branch_ids)
      ? raw.branch_ids
          .map((x: any) => Number(x))
          .filter((x: number) => Number.isFinite(x) && x > 0)
      : [],
    primary_branch_id:
      raw.primary_branch_id !== undefined && raw.primary_branch_id !== null
        ? Number(raw.primary_branch_id)
        : null,
    branches: Array.isArray(raw.branches)
      ? raw.branches.map((b: any) => ({
          id: Number(b.id),
          name: b.name ?? null,
          code: b.code ?? null,
          status: b.status ?? null,
          is_primary: !!b.is_primary,
        }))
      : [],
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AdminUser | null>(() => getStoredUser());
  const [permissions, setPermissions] = useState<Record<string, string[]>>(() =>
    getStoredPermissions(),
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentBranchId, setCurrentBranchIdState] = useState<number | null>(
    () => {
      const raw = localStorage.getItem(CURRENT_BRANCH_ID_KEY);
      return raw ? Number(raw) : null;
    },
  );

  const persistUser = (nextUser: AdminUser | null) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  };

  const persistPermissions = (nextPermissions: Record<string, string[]>) => {
    setPermissions(nextPermissions);
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(nextPermissions));
  };

  const setCurrentBranchId = (branchId: number | null) => {
    setCurrentBranchIdState(branchId);
    if (branchId && Number.isFinite(branchId)) {
      localStorage.setItem(CURRENT_BRANCH_ID_KEY, String(branchId));
    } else {
      localStorage.removeItem(CURRENT_BRANCH_ID_KEY);
    }
  };

  const refreshMe = async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      persistUser(null);
      persistPermissions({});
      setCurrentBranchId(null);
      return;
    }

    const res = await http<any>("GET", "/api/v1/admin/auth/me");
    const nextUser = normalizeUser(res?.data?.user ?? res?.data ?? null);
    const nextPermissions = (res?.data?.permissions ?? {}) as Record<
      string,
      string[]
    >;

    persistUser(nextUser);
    persistPermissions(nextPermissions);

    const availableBranchIds = Array.isArray(nextUser?.branch_ids)
      ? nextUser!.branch_ids!
      : [];

    const primaryBranchId =
      nextUser?.primary_branch_id ??
      nextUser?.branches?.find((x) => x.is_primary)?.id ??
      null;

    if (
      currentBranchId &&
      availableBranchIds.length > 0 &&
      availableBranchIds.includes(currentBranchId)
    ) {
      setCurrentBranchId(currentBranchId);
    } else {
      setCurrentBranchId(primaryBranchId);
    }
  };

  const logout = async () => {
    try {
      await http("POST", "/api/v1/admin/auth/logout");
    } catch {
      // ignore
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(PERMISSIONS_KEY);
      localStorage.removeItem(CURRENT_BRANCH_ID_KEY);
      persistUser(null);
      persistPermissions({});
      setCurrentBranchIdState(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (!accessToken) {
          persistUser(null);
          persistPermissions({});
          setCurrentBranchId(null);
          return;
        }

        await refreshMe();
      } catch (err) {
        console.warn("Admin auto-auth failed:", err);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.removeItem(PERMISSIONS_KEY);
        localStorage.removeItem(CURRENT_BRANCH_ID_KEY);
        persistUser(null);
        persistPermissions({});
        setCurrentBranchIdState(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const branches = useMemo(() => user?.branches ?? [], [user]);

  const currentBranch = useMemo(() => {
    if (!branches.length) return null;
    if (currentBranchId) {
      return branches.find((b) => b.id === currentBranchId) ?? null;
    }
    const primary =
      branches.find((b) => b.is_primary) ??
      (user?.primary_branch_id
        ? branches.find((b) => b.id === user.primary_branch_id)
        : null);

    return primary ?? branches[0] ?? null;
  }, [branches, currentBranchId, user?.primary_branch_id]);

  useEffect(() => {
    if (!user) return;

    const availableBranchIds = branches.map((b) => b.id);
    if (!availableBranchIds.length) {
      setCurrentBranchId(null);
      return;
    }

    if (currentBranchId && availableBranchIds.includes(currentBranchId)) return;

    const fallback =
      user.primary_branch_id ??
      branches.find((b) => b.is_primary)?.id ??
      branches[0]?.id ??
      null;

    setCurrentBranchId(fallback);
  }, [user, branches]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        permissions,
        branches,
        currentBranchId: currentBranch?.id ?? null,
        currentBranch,
        setCurrentBranchId,
        refreshMe,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
