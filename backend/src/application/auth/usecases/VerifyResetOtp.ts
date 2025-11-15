import { Op, QueryTypes } from "sequelize";
import db from "../../../infrastructure/db/sequelize"; // import Sequelize instance
import { Request, Response } from "express";

interface VerifyResetOtpResult {
  success: boolean;
  message: string;
}

/**
 * ✅ VerifyResetOtp usecase
 * Kiểm tra xem OTP có hợp lệ và còn hạn không
 */
export class VerifyResetOtp {
  async execute(email: string, otp: string): Promise<VerifyResetOtpResult> {
    if (!email || !otp) {
      return {
        success: false,
        message: "Thiếu thông tin email hoặc mã OTP.",
      };
    }

    try {
      const [rows] = await db.query(
        `SELECT * FROM forgot_password 
         WHERE email = :email 
           AND otp = :otp 
           AND expire_at > NOW() 
         ORDER BY created_at DESC 
         LIMIT 1`,
        {
          replacements: { email, otp },
          type: QueryTypes.SELECT,
        }
      );

      if (!rows) {
        return {
          success: false,
          message: "Mã OTP không hợp lệ hoặc đã hết hạn.",
        };
      }

      return {
        success: true,
        message: "Xác thực mã OTP thành công.",
      };
    } catch (err) {
      console.error("Lỗi xác thực OTP:", err);
      return {
        success: false,
        message: "Đã xảy ra lỗi trong quá trình xác thực.",
      };
    }
  }
}
