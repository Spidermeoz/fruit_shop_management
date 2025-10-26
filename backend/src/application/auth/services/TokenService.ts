// src/application/auth/services/TokenService.ts
import type { AccessTokenPayload } from "../../../domain/auth/types";

export interface TokenService {
  signAccessToken(payload: AccessTokenPayload, expiresIn?: string): string; // default: 30m
  verifyAccessToken(token: string): AccessTokenPayload;                     // throws nếu invalid/expired
}
