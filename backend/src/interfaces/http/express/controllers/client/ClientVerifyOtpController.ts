import { Request, Response } from "express";
import { VerifyResetOtp } from "../../../../../application/auth/usecases/VerifyResetOtp";

export class ClientVerifyOtpController {
  private readonly verifyOtp: VerifyResetOtp;

  constructor(deps: { verifyOtp: VerifyResetOtp }) {
    this.verifyOtp = deps.verifyOtp;
  }

  // ✅ POST /api/v1/client/forgot-password/verify
  verify = async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      const result = await this.verifyOtp.execute(email, otp);
      res.status(result.success ? 200 : 400).json(result);
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi máy chủ khi xác minh OTP.",
      });
    }
  };
}
