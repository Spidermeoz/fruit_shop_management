// src/interfaces/http/express/middlewares/auth.ts
import type { Request, Response, NextFunction } from "express";
import type { TokenService } from "../../../../application/auth/services/TokenService";
import type { UserRepository } from "../../../../domain/users/UserRepository";
import type { AccessTokenPayload } from "../../../../domain/auth/types";

type Opts = {
  header?: string;     // header name chứa Bearer token (mặc định "authorization")
  cookie?: string;     // nếu muốn đọc từ cookie (ví dụ "access_token")
  enforceActive?: boolean; // check user.active mỗi request (mặc định true nếu có userRepo)
};

export const makeAuthMiddleware = (
  tokenService: TokenService,
  userRepo?: UserRepository,
  opts: Opts = {}
) => {
  const headerName = (opts.header || "authorization").toLowerCase();
  const useCookie = opts.cookie;
  const enforceActive = opts.enforceActive ?? !!userRepo;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let raw = "";
      // 1) Header: Authorization: Bearer xxx
      const h = (req.headers as any)[headerName];
      if (h && typeof h === "string" && h.toLowerCase().startsWith("bearer ")) {
        raw = h.slice(7).trim();
      }
      // 2) Cookie fallback (optional)
      if (!raw && useCookie && (req as any).cookies) {
        raw = (req as any).cookies[useCookie] || "";
      }
      if (!raw) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const payload = tokenService.verifyAccessToken(raw) as AccessTokenPayload;
      if (!payload?.sub) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      // (Khuyến nghị) kiểm tra user active + not deleted
      if (enforceActive && userRepo) {
        const u = await userRepo.findById(Number(payload.sub), false);
        if (!u || u.props.status !== "active") {
          return res.status(401).json({ success: false, message: "Unauthorized" });
        }
      }

      req.user = {
        id: Number(payload.sub),
        email: payload.email,
        roleId: payload.roleId ?? null,
        payload,
      };
      next();
    } catch {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  };
};
