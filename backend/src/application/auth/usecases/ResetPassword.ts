import { QueryTypes } from "sequelize";
import db from "../../../infrastructure/db/sequelize";
import { BcryptPasswordService } from "../../../infrastructure/auth/BcryptPasswordService";

export class ResetPassword {
  private passwordService: BcryptPasswordService;

  constructor(passwordService: BcryptPasswordService) {
    this.passwordService = passwordService;
  }

  async execute(email: string, otp: string, newPassword: string) {
    if (!email || !otp || !newPassword) {
      return { success: false, message: "Thiếu thông tin cần thiết." };
    }

    try {
      // 1️⃣ Kiểm tra OTP còn hạn và đúng
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
        return { success: false, message: "Mã OTP không hợp lệ hoặc đã hết hạn." };
      }

      // 2️⃣ Hash mật khẩu mới
      const hashedPassword = await this.passwordService.hash(newPassword);

      // 3️⃣ Cập nhật mật khẩu user
      await db.query(
        `UPDATE users SET password = :password WHERE email = :email LIMIT 1`,
        {
          replacements: { password: hashedPassword, email },
          type: QueryTypes.UPDATE,
        }
      );

      // 4️⃣ Xóa OTP để tránh dùng lại
      await db.query(
        `DELETE FROM forgot_password WHERE email = :email`,
        {
          replacements: { email },
          type: QueryTypes.DELETE,
        }
      );

      return {
        success: true,
        message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.",
      };
    } catch (err) {
      console.error("Lỗi đặt lại mật khẩu:", err);
      return { success: false, message: "Đã xảy ra lỗi khi đặt lại mật khẩu." };
    }
  }
}
