import { ForgotPasswordModel } from "../../../infrastructure/db/sequelize/models/ForgotPasswordModel";
import { sendOtpEmail } from "../../../infrastructure/email/EmailService";
import UserModel from "../../../infrastructure/db/sequelize/models/UserModel";
import { Op } from "sequelize";

export class RequestPasswordReset {
  async execute(email: string) {
    // 1️⃣ Kiểm tra email tồn tại trong hệ thống
    const user = await UserModel.findOne({
      where: { email: email.trim().toLowerCase(), deleted: 0 },
      attributes: ["id", "email", "full_name"],
    });

    if (!user) {
      throw new Error("Email không tồn tại trong hệ thống");
    }

    // 2️⃣ Sinh OTP ngẫu nhiên 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3️⃣ Đặt thời gian hết hạn (5 phút)
    const expireAt = new Date(Date.now() + 5 * 60 * 1000);

    // 4️⃣ Ghi vào DB (xóa OTP cũ cùng email nếu có)
    await ForgotPasswordModel.destroy({
      where: { email },
    });

    await ForgotPasswordModel.create({
      email,
      otp,
      expire_at: expireAt,
    });

    // 5️⃣ Gửi email OTP
    try {
      await sendOtpEmail(email, otp);
    } catch (err) {
      console.error("Gửi email OTP thất bại:", err);
      throw new Error("Không thể gửi email OTP, vui lòng thử lại sau.");
    }

    // 6️⃣ Trả về phản hồi
    return {
      success: true,
      message: "Mã OTP đã được gửi đến email của bạn.",
      expireAt,
    };
  }
}
