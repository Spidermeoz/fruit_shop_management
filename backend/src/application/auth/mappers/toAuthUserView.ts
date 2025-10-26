// src/application/auth/mappers/toAuthUserView.ts
import type { User } from "../../../domain/users/User";
import type { AuthUserView } from "../../../domain/auth/types";

// Domain User -> AuthUserView (snake_case) để trả cho FE ở controller
export const toAuthUserView = (u: User): AuthUserView => ({
  id: u.props.id!,
  role_id: u.props.roleId ?? null,
  full_name: u.props.fullName ?? null,
  email: u.props.email,
  phone: u.props.phone ?? null,
  avatar: u.props.avatar ?? null,
  status: u.props.status!,
  deleted: !!u.props.deleted,
  deleted_at: u.props.deletedAt ?? null,
  created_at: u.props.createdAt!,
  updated_at: u.props.updatedAt!,
  role: u.props.role ? { id: u.props.role.id, title: u.props.role.title } : null,
});
