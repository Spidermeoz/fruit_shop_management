import { Request, Response } from "express";
import { ResetPassword } from "../../../../../application/auth/usecases/ResetPassword";

export class ClientResetPasswordController {
  private readonly resetPassword: ResetPassword;

  constructor(deps: { resetPassword: ResetPassword }) {
    this.resetPassword = deps.resetPassword;
  }

  // ✅ POST /api/v1/client/forgot-password/reset
  reset = async (req: Request, res: Response) => {
    try {
      const { email, otp, newPassword } = req.body;
      const result = await this.resetPassword.execute(email, otp, newPassword);
      res.status(result.success ? 200 : 400).json(result);
    } catch (err: any) {
      console.error("Reset password error:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi máy chủ khi đặt lại mật khẩu.",
      });
    }
  };
}
