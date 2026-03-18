import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import { http } from "../../../services/http";
import Footer from "../../../components/client/layouts/Footer";

type Step = "request" | "verify" | "reset" | "success";

const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill("")); // 6 ô OTP
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ⏱️ Countdown timer
  useEffect(() => {
    let countdown: NodeJS.Timeout;
    if (timer > 0) countdown = setTimeout(() => setTimer(timer - 1), 1000);
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
        setTimer(60);
        setOtp(Array(6).fill(""));
      } else setError(res.message || "Không thể gửi OTP.");
    } catch {
      setError("Lỗi khi gửi yêu cầu, vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== STEP 2: VERIFY OTP =====================
  const otpValue = otp.join("");

  const handleOtpChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return; // chỉ cho nhập số
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) otpRefs.current[index + 1]?.focus(); // tự chuyển ô
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otpValue.length < 6) return setError("Vui lòng nhập đủ 6 số OTP.");

    setIsLoading(true);
    try {
      const res = await http("POST", "/api/v1/client/forgot-password/verify", {
        email,
        otp: otpValue,
      });
      if (res.success) setStep("reset");
      else setError(res.message || "Mã OTP không hợp lệ hoặc đã hết hạn.");
    } catch {
      setError("Lỗi khi xác thực OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // Gửi lại OTP
  const handleResendOtp = async () => {
    setError("");
    setIsLoading(true);
    try {
      const res = await http("POST", "/api/v1/client/forgot-password/request", {
        email,
      });
      if (res.success) setTimer(60);
      else setError(res.message || "Không thể gửi lại OTP.");
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
        otp: otpValue,
        newPassword,
      });
      if (res.success) setStep("success");
      else setError(res.message || "Không thể đặt lại mật khẩu.");
    } catch {
      setError("Lỗi khi đặt lại mật khẩu.");
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== UI COMPONENTS =====================
  const renderSpinner = () => (
    <svg
      className="animate-spin h-5 w-5 text-white"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  const renderOtpInputs = () => (
    <div className="flex justify-center gap-2 md:gap-3 mb-6">
      {otp.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => {
            otpRefs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleOtpChange(e.target.value, idx)}
          onKeyDown={(e) => handleOtpKeyDown(e, idx)}
          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-slate-50 text-slate-900 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white transition-all shadow-sm"
        />
      ))}
    </div>
  );

  const renderContent = () => {
    switch (step) {
      // STEP 1: GỬI OTP
      case "request":
        return (
          <>
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Quên mật khẩu?
              </h2>
              <p className="text-slate-500 font-medium text-sm md:text-base px-4">
                Đừng lo lắng! Vui lòng nhập email liên kết với tài khoản của
                bạn.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  Email của bạn
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-green-500 transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-11 pr-4 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all ${
                      error
                        ? "border-red-400 focus:border-red-400"
                        : "border-slate-100 focus:border-green-500 focus:bg-white"
                    }`}
                    placeholder="name@example.com"
                  />
                </div>
                {error && (
                  <p className="mt-2 text-xs text-red-500 font-medium ml-1">
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 hover:shadow-[0_15px_30px_rgba(34,197,94,0.3)] transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isLoading ? renderSpinner() : "Gửi mã xác nhận"}
              </button>
            </form>
          </>
        );

      // STEP 2: NHẬP OTP
      case "verify":
        return (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Kiểm tra email
              </h2>
              <p className="text-slate-500 font-medium text-sm md:text-base">
                Chúng tôi đã gửi mã gồm 6 chữ số đến <br />
                <span className="text-slate-900 font-bold">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {renderOtpInputs()}
              {error && (
                <p className="text-center text-sm font-medium text-red-500">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 hover:shadow-[0_15px_30px_rgba(34,197,94,0.3)] transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isLoading ? renderSpinner() : "Xác minh OTP"}
              </button>
            </form>

            <div className="text-center mt-8">
              {timer > 0 ? (
                <p className="text-slate-500 text-sm font-medium">
                  Gửi lại mã sau{" "}
                  <span className="text-green-600 font-bold">{timer}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-sm text-green-600 hover:text-green-700 font-bold underline-offset-4 hover:underline transition-all"
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
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Tạo mật khẩu mới
              </h2>
              <p className="text-slate-500 font-medium text-sm md:text-base">
                Mật khẩu mới của bạn phải khác với các mật khẩu đã sử dụng trước
                đó.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  Mật khẩu mới
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-green-500 transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  Xác nhận mật khẩu
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-green-500 transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm font-medium text-red-500 ml-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 hover:shadow-[0_15px_30px_rgba(34,197,94,0.3)] transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? renderSpinner() : "Lưu mật khẩu"}
              </button>
            </form>
          </>
        );

      // STEP 4: THÀNH CÔNG
      case "success":
        return (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Khôi phục thành công!
            </h2>
            <p className="text-slate-500 font-medium mb-10 px-4">
              Mật khẩu của bạn đã được thay đổi an toàn. Bạn có thể sử dụng mật
              khẩu mới để đăng nhập.
            </p>
            <Link
              to="/login"
              className="w-full block bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 hover:shadow-[0_15px_30px_rgba(34,197,94,0.3)] transition-all duration-300 transform active:scale-[0.98]"
            >
              Quay lại trang Đăng nhập
            </Link>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfc]">
      <Layout>
        {/* Banner Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-green-100/50 to-transparent py-12 text-center">
          <div className="container mx-auto relative z-10 px-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 mb-4 tracking-tight">
              Khôi phục tài khoản
            </h1>
            <div className="flex items-center justify-center text-slate-500 text-sm md:text-base font-medium">
              <Link to="/" className="hover:text-green-600 transition-colors">
                Trang chủ
              </Link>
              <span className="mx-3 opacity-30">/</span>
              <span className="text-green-700">Quên mật khẩu</span>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="pb-20 pt-4">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-xl mx-auto w-full">
              <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_30px_80px_rgba(0,0,0,0.06)] border border-slate-50 relative overflow-hidden">
                {renderContent()}

                {/* Return Link (Chỉ hiển thị nếu không phải bước Success) */}
                {step !== "success" && (
                  <div className="mt-8 text-center pt-8 border-t border-slate-50">
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                      </svg>
                      Quay lại Đăng nhập
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </Layout>
      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;
