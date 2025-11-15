import nodemailer from "nodemailer";

export const sendOtpEmail = async (to: string, otp: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // hoặc SMTP riêng của bạn
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"FreshFruits Support" <${process.env.SMTP_USER}>`,
    to,
    subject: "Mã OTP khôi phục mật khẩu",
    html: `
      <div style="font-family:sans-serif;">
        <h2>Mã OTP khôi phục mật khẩu</h2>
        <p>Xin chào,</p>
        <p>Mã OTP của bạn là: <b style="font-size:18px;">${otp}</b></p>
        <p>Hiệu lực trong <b>5 phút</b>.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
