import { Request, Response, NextFunction } from "express";
import type { Login } from "../../../../application/auth/usecases/Login";
import type { Logout } from "../../../../application/auth/usecases/Logout";
import type { RefreshToken } from "../../../../application/auth/usecases/RefreshToken";
import type { GetMe } from "../../../../application/auth/usecases/GetMe";

const ok = (res: Response, data: any, status = 200) =>
  res
    .status(status)
    .json({ success: true, data, meta: { total: 0, page: 1, limit: 10 } });

const fail = (res: Response, message: string, status = 400) =>
  res.status(status).json({ success: false, message });

export const makeAuthController = (uc: {
  login: Login;
  logout: Logout;
  refresh: RefreshToken;
  me: GetMe;
}) => {
  return {
    // POST /api/v1/auth/login
    login: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, password } = req.body || {};
        if (!email || !password) {
          return fail(res, "Email and password are required", 400);
        }
        const out = await uc.login.execute({ email, password });
        return ok(res, out);
      } catch (e: any) {
        const msg = String(e?.message || "Invalid credentials");
        const isAuthErr = /invalid credentials|account is not active/i.test(
          msg
        );
        return fail(
          res,
          isAuthErr ? "Invalid credentials" : msg,
          isAuthErr ? 401 : 500
        );
      }
    },

    // POST /api/v1/auth/logout  (require auth)
    logout: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user;
        if (!user) return fail(res, "Unauthorized", 401);
        await uc.logout.execute(user.id);
        return ok(res, { ok: true });
      } catch (e) {
        next(e);
      }
    },

    // POST /api/v1/auth/refresh
    refresh: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { refreshToken } = req.body || {};
        if (!refreshToken) return fail(res, "refreshToken is required", 400);
        const out = await uc.refresh.execute({ refreshToken });
        return ok(res, out);
      } catch (e: any) {
        const msg = String(e?.message || "Invalid refresh token");
        return fail(res, "Invalid refresh token", 401);
      }
    },

    // GET /api/v1/auth/me  (require auth)
    me: async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) return fail(res, "Unauthorized", 401);
        const out = await uc.me.execute(req.user.id);
        return ok(res, out);
      } catch (e: any) {
        return fail(res, "Internal server error", 500);
      }
    },
  };
};

export type AuthController = ReturnType<typeof makeAuthController>;
