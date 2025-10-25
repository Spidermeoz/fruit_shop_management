// src/domain/roles/types.ts

// Quy ước permissions: { [moduleKey]: string[] } .
// Ví dụ: { product: ["view","create"], role: ["permissions"] }
export type Permissions = Record<string, string[]>;

export type RoleListFilter = {
  includeDeleted?: boolean; // default false
  q?: string;
};
