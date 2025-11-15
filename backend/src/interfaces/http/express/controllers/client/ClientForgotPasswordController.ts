import { Request, Response } from "express";
import { RequestPasswordReset } from "../../../../../application/auth/usecases/RequestPasswordReset";

export class ClientForgotPasswordController {
  private readonly requestPasswordReset: RequestPasswordReset;

  constructor(deps: { requestPasswordReset: RequestPasswordReset }) {
    this.requestPasswordReset = deps.requestPasswordReset;
  }

  // ✅ POST /api/v1/client/forgot-password/request
  request = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập email.",
        });
      }

      const result = await this.requestPasswordReset.execute(email);
      res.json(result);
    } catch (err: any) {
      console.error("ForgotPassword request error:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Không thể gửi mã OTP, vui lòng thử lại.",
      });
    }
  };
}
