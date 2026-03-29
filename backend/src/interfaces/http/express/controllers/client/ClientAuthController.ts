import { Request, Response, NextFunction } from "express";
import { RegisterClient } from "../../../../../application/auth/usecases/RegisterClient";
import { Login } from "../../../../../application/auth/usecases/Login";
import { Logout } from "../../../../../application/auth/usecases/Logout";
import { GetMe } from "../../../../../application/auth/usecases/GetMe";
import { RefreshToken } from "../../../../../application/auth/usecases/RefreshToken";
import { ChangePassword } from "../../../../../application/auth/usecases/ChangePassword";
import { UpdateMyProfile } from "../../../../../application/auth/usecases/UpdateMyProfile";

export const makeClientAuthController = (uc: {
  register: RegisterClient;
  login: Login;
  logout: Logout;
  me: GetMe;
  refresh: RefreshToken;
  changePassword: ChangePassword;
  updateMyProfile: UpdateMyProfile;
}) => {
  return {
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
        return res.status(400).json({
          success: false,
          message: err.message || "Không thể đăng ký tài khoản.",
        });
      }
    },

    login: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({
            success: false,
            message: "Vui lòng nhập email và mật khẩu.",
          });
        }

        const result = await uc.login.execute({
          email,
          password,
          portal: "client",
        });

        return res.json({
          success: true,
          message: "Đăng nhập thành công.",
          data: result,
        });
      } catch (err: any) {
        console.error("Login client error:", err);

        const msg = String(err?.message || "Email hoặc mật khẩu không đúng.");

        if (/trang quản trị/i.test(msg)) {
          return res.status(401).json({
            success: false,
            message: msg,
          });
        }

        if (/invalid credentials/i.test(msg)) {
          return res.status(401).json({
            success: false,
            message: "Email hoặc mật khẩu không đúng.",
          });
        }

        if (/account is not active/i.test(msg)) {
          return res.status(403).json({
            success: false,
            message: "Tài khoản hiện không hoạt động.",
          });
        }

        return res.status(401).json({
          success: false,
          message: msg || "Đăng nhập thất bại.",
        });
      }
    },

    me: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({
            success: false,
            message: "Unauthorized.",
          });
        }

        const user = await uc.me.execute(userId, "client");
        return res.json({
          success: true,
          data: user,
        });
      } catch (err: any) {
        console.error("Client me error:", err);
        return res.status(401).json({
          success: false,
          message: err?.message || "Unauthorized.",
        });
      }
    },

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
        return res.json({
          success: true,
          message: "Làm mới token thành công.",
          data,
        });
      } catch (err: any) {
        console.error("Refresh token error:", err);
        return res.status(401).json({
          success: false,
          message: err.message || "Refresh token không hợp lệ.",
        });
      }
    },

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
        return res.json({
          success: true,
          message: "Đăng xuất thành công.",
        });
      } catch (err) {
        next(err);
      }
    },

    changePassword: async (req: Request, res: Response) => {
      try {
        const userId = req.user!.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
          return res.status(400).json({
            success: false,
            message: "Vui lòng nhập đủ mật khẩu cũ và mật khẩu mới",
          });
        }

        await uc.changePassword.execute(userId, currentPassword, newPassword);

        return res.json({
          success: true,
          message: "Đổi mật khẩu thành công",
        });
      } catch (err: any) {
        return res.status(400).json({
          success: false,
          message: err.message || "Không thể đổi mật khẩu",
        });
      }
    },

    updateProfile: async (req: Request, res: Response) => {
      try {
        const userId = req.user!.id;
        const { full_name, phone, avatar } = req.body;

        const updated = await uc.updateMyProfile.execute(userId, {
          full_name,
          phone,
          avatar,
        });

        return res.json({
          success: true,
          message: "Cập nhật thông tin thành công",
          data: updated,
        });
      } catch (err: any) {
        return res.status(400).json({
          success: false,
          message: err.message || "Không thể cập nhật thông tin",
        });
      }
    },
  };
};

export type ClientAuthController = ReturnType<typeof makeClientAuthController>;
