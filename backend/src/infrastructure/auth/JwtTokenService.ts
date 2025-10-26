// src/infrastructure/auth/JwtTokenService.ts
import * as jwt from "jsonwebtoken";
import type { TokenService } from "../../application/auth/services/TokenService";
import type { AccessTokenPayload } from "../../domain/auth/types";

const SECRET: jwt.Secret = (process.env.JWT_SECRET ?? "") as jwt.Secret;
const DEFAULT_EXPIRES_IN =
  (process.env.JWT_EXPIRES_IN ?? "30m") as jwt.SignOptions["expiresIn"];

if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET env");
}

export class JwtTokenService implements TokenService {
  signAccessToken(payload: AccessTokenPayload, expiresIn?: string): string {
    const opts: jwt.SignOptions = {
      algorithm: "HS256",
      // v9 đòi kiểu StringValue → ép kiểu nhẹ
      expiresIn: (expiresIn ?? DEFAULT_EXPIRES_IN) as jwt.SignOptions["expiresIn"],
    };

    // Đặt sub là string để khớp JwtPayload
    const p: jwt.JwtPayload = {
      sub: String(payload.sub),
      email: payload.email,
      roleId: payload.roleId ?? null,
    };

    return jwt.sign(p, SECRET, opts);
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const decoded = jwt.verify(token, SECRET, { algorithms: ["HS256"] }) as
      | jwt.JwtPayload
      | string;

    if (typeof decoded === "string") {
      throw new Error("Invalid token payload");
    }

    const subNum =
      decoded.sub !== undefined ? Number(decoded.sub) : Number.NaN;
    if (!Number.isFinite(subNum)) {
      throw new Error("Invalid token payload");
    }

    return {
      sub: subNum,
      email: (decoded as any).email,
      roleId: (decoded as any).roleId ?? null,
      iat: decoded.iat,
      exp: decoded.exp,
    };
  }
}
