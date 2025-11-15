import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layout/Layout";
import { http } from "../../../services/http";

type Step = "request" | "verify" | "reset" | "success";

const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0); // ⏱️ thời gian đếm ngược resend OTP

  // ⏱️ Giảm thời gian mỗi giây khi đang đếm ngược
  useEffect(() => {
    let countdown: NodeJS.Timeout;
    if (timer > 0) {
      countdown = setTimeout(() => setTimer(timer - 1), 1000);
    }
    return () => clearTimeout(countdown);
  }, [timer]);

  // ===================== STEP 1: REQUEST OTP =====================
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) return setError("Vui lòng nhập email.");
    if (!/\S+@\S+\.\S+/.test(email)) return setError("Email không hợp lệ.");

    setIsLoading(true);
    try {
      const res = await http("POST", "/api/v1/client/forgot-password/request", {
        email,
      });
      if (res.success) {
        setStep("verify");
        setTimer(30); // ⏱️ bắt đầu đếm 30s khi gửi thành công
      } else {
        setError(res.message || "Không thể gửi OTP.");
      }
    } catch {
      setError("Lỗi khi gửi yêu cầu, vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== STEP 2: VERIFY OTP =====================
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp) return setError("Vui lòng nhập mã OTP.");

    setIsLoading(true);
    try {
      const res = await http("POST", "/api/v1/client/forgot-password/verify", {
        email,
        otp,
      });
      if (res.success) {
        setStep("reset");
      } else {
        setError(res.message || "Mã OTP không hợp lệ hoặc đã hết hạn.");
      }
    } catch {
      setError("Lỗi khi xác thực OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔁 Gửi lại OTP
  const handleResendOtp = async () => {
    setError("");
    setIsLoading(true);
    try {
      const res = await http("POST", "/api/v1/client/forgot-password/request", {
        email,
      });
      if (res.success) {
        setTimer(60); // Reset lại đếm ngược
      } else {
        setError(res.message || "Không thể gửi lại OTP.");
      }
    } catch {
      setError("Lỗi khi gửi lại OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== STEP 3: RESET PASSWORD =====================
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword)
      return setError("Vui lòng nhập đầy đủ mật khẩu.");
    if (newPassword.length < 6)
      return setError("Mật khẩu phải có ít nhất 6 ký tự.");
    if (newPassword !== confirmPassword)
      return setError("Xác nhận mật khẩu không khớp.");

    setIsLoading(true);
    try {
      const res = await http("POST", "/api/v1/client/forgot-password/reset", {
        email,
        otp,
        newPassword,
      });
      if (res.success) {
        setStep("success");
      } else {
        setError(res.message || "Không thể đặt lại mật khẩu.");
      }
    } catch {
      setError("Lỗi khi đặt lại mật khẩu.");
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== UI =====================
  const renderContent = () => {
    switch (step) {
      // STEP 1: GỬI OTP
      case "request":
        return (
          <>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-green-800 mb-2">
                Quên mật khẩu?
              </h2>
              <p className="text-gray-600">
                Nhập email của bạn để nhận mã OTP khôi phục mật khẩu
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    error ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Nhập email của bạn"
                />
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
              </button>
            </form>
          </>
        );

      // STEP 2: XÁC THỰC OTP
      case "verify":
        return (
          <>
            <h2 className="text-2xl font-semibold text-green-800 mb-4 text-center">
              Nhập mã OTP
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Mã OTP đã được gửi đến{" "}
              <span className="font-medium">{email}</span>
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Mã OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    error ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Nhập mã OTP 6 chữ số"
                />
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center"
              >
                {isLoading ? "Đang xác minh..." : "Xác minh OTP"}
              </button>
            </form>

            <div className="text-center mt-6">
              {timer > 0 ? (
                <p className="text-gray-500 text-sm">
                  Gửi lại OTP sau <span className="font-medium">{timer}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-sm text-green-600 hover:text-green-700 font-medium transition"
                >
                  Gửi lại mã OTP
                </button>
              )}
            </div>
          </>
        );

      // STEP 3: ĐẶT LẠI MẬT KHẨU
      case "reset":
        return (
          <>
            <h2 className="text-2xl font-semibold text-green-800 mb-4 text-center">
              Tạo mật khẩu mới
            </h2>
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
                  placeholder="Nhập mật khẩu mới"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
                  placeholder="Nhập lại mật khẩu"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
              >
                {isLoading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
              </button>
            </form>
          </>
        );

      // STEP 4: THÀNH CÔNG
      case "success":
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-green-800 mb-2">
              Đặt lại mật khẩu thành công!
            </h2>
            <p className="text-gray-600 mb-6">
              Bạn có thể đăng nhập bằng mật khẩu mới.
            </p>
            <Link
              to="/login"
              className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Đăng nhập ngay
            </Link>
          </div>
        );
    }
  };

  return (
    <Layout>
      <section className="bg-gradient-to-r from-green-100 to-yellow-100 py-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-10 w-16 h-16 bg-yellow-300 rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 right-10 w-12 h-12 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            Quên mật khẩu
          </h1>
          <p className="text-gray-700">Khôi phục mật khẩu tài khoản của bạn</p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-10">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="p-8">{renderContent()}</div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPasswordPage;
