// src/domain/auth/types.ts

// payload minimal để nhúng vào Access Token
export type AccessTokenPayload = {
  sub: number;         // user id
  email: string;
  roleId: number | null;
  iat?: number;        // issued-at (do jwt thêm)
  exp?: number;        // expiry (do jwt thêm)
};

// Kết quả trả về cho FE khi đăng nhập / me
export type AuthUserView = {
  // giữ đúng phong cách snake_case như UsersController.toLegacy
  id: number;
  role_id: number | null;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar: string | null;
  status: "active" | "inactive" | "banned";
  deleted: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  role: { id: number; title: string } | null;
};

// Quyền theo ma trận roles.permissions
export type Permissions = Record<string, string[]>; // { [moduleKey]: ["view","edit",...] }
