// src/application/auth/services/RefreshTokenService.ts

export interface RefreshTokenService {
  // Tạo refresh token dạng opaque (raw) + hash để lưu DB
  generate(): { raw: string; hash: string };
  // Hash lại raw để so với DB (khi refresh/logout)
  hash(raw: string): string;
}
