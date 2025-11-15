import { Request, Response, NextFunction } from "express";
import { RegisterClient } from "../../../../../application/auth/usecases/RegisterClient";
import { Login } from "../../../../../application/auth/usecases/Login";
import { Logout } from "../../../../../application/auth/usecases/Logout";
import { GetMe } from "../../../../../application/auth/usecases/GetMe";
import { RefreshToken } from "../../../../../application/auth/usecases/RefreshToken";

export const makeClientAuthController = (uc: {
  register: RegisterClient;
  login: Login;
  logout: Logout;
  me: GetMe;
  refresh: RefreshToken;
}) => {
  return {
    // ✅ POST /api/v1/client/auth/register
    register: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { fullName, email, password, phone } = req.body;

        if (!fullName || !email || !password) {
          return res.status(400).json({
            success: false,
            message: "Thiếu thông tin đăng ký bắt buộc.",
          });
        }

        const result = await uc.register.execute({
          fullName,
          email,
          password,
          phone,
        });

        return res.status(201).json({
          success: true,
          message: "Đăng ký tài khoản thành công.",
          data: result,
        });
      } catch (err: any) {
        console.error("Register client error:", err);
        res.status(400).json({
          success: false,
          message: err.message || "Không thể đăng ký tài khoản.",
        });
      }
    },

    // ✅ POST /api/v1/client/auth/login
    login: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({
            success: false,
            message: "Vui lòng nhập email và mật khẩu.",
          });
        }

        const result = await uc.login.execute({ email, password });

        return res.json({
          success: true,
          message: "Đăng nhập thành công.",
          data: result,
        });
      } catch (err: any) {
        console.error("Login client error:", err);
        res.status(401).json({
          success: false,
          message: err.message || "Email hoặc mật khẩu không đúng.",
        });
      }
    },

    // ✅ GET /api/v1/client/auth/me
    me: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({
            success: false,
            message: "Unauthorized.",
          });
        }

        const user = await uc.me.execute(userId);
        res.json({
          success: true,
          data: user,
        });
      } catch (err) {
        next(err);
      }
    },

    // ✅ POST /api/v1/client/auth/refresh
    refresh: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
          return res.status(400).json({
            success: false,
            message: "Thiếu refresh token.",
          });
        }

        const data = await uc.refresh.execute({ refreshToken });
        res.json({
          success: true,
          message: "Làm mới token thành công.",
          data,
        });
      } catch (err: any) {
        console.error("Refresh token error:", err);
        res.status(401).json({
          success: false,
          message: err.message || "Refresh token không hợp lệ.",
        });
      }
    },

    // ✅ POST /api/v1/client/auth/logout
    logout: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({
            success: false,
            message: "Unauthorized.",
          });
        }

        await uc.logout.execute(userId);
        res.json({
          success: true,
          message: "Đăng xuất thành công.",
        });
      } catch (err) {
        next(err);
      }
    },
  };
};

export type ClientAuthController = ReturnType<typeof makeClientAuthController>;
