// src/infrastructure/auth/CryptoRefreshTokenService.ts
import crypto from "crypto";
import type { RefreshTokenService } from "../../application/auth/services/RefreshTokenService";

function toBase64Url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export class CryptoRefreshTokenService implements RefreshTokenService {
  generate(): { raw: string; hash: string } {
    // 32 bytes ~ 256-bit → đủ mạnh cho refresh token
    const raw = toBase64Url(crypto.randomBytes(32));
    const hash = this.hash(raw);
    return { raw, hash };
  }

  hash(raw: string): string {
    return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
  }
}
