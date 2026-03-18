import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import { useAuth } from "../../../context/AuthContext";
import Footer from "../../../components/client/layouts/Footer";

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth(); // ✅ Dùng useAuth để gọi API
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterFormData, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Xử lý thay đổi input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Xóa lỗi khi user gõ lại
    if (errors[name as keyof RegisterFormData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterFormData, string>> = {};

    if (!formData.firstName) newErrors.firstName = "Vui lòng nhập họ";
    if (!formData.lastName) newErrors.lastName = "Vui lòng nhập tên";

    if (!formData.email) newErrors.email = "Vui lòng nhập email";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email không hợp lệ";

    if (!formData.phone) newErrors.phone = "Vui lòng nhập số điện thoại";
    else if (!/^[0-9]{10,11}$/.test(formData.phone))
      newErrors.phone = "Số điện thoại không hợp lệ";

    if (!formData.password) newErrors.password = "Vui lòng nhập mật khẩu";
    else if (formData.password.length < 6)
      newErrors.password = "Mật khẩu tối thiểu 6 ký tự";

    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Mật khẩu không khớp";

    if (!formData.agreeToTerms)
      newErrors.agreeToTerms = "Vui lòng đồng ý với điều khoản sử dụng";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit - Gọi API thật
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register({
        fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });

      alert("Đăng ký thành công! Bạn đã được đăng nhập tự động.");
      navigate("/");
    } catch (err: any) {
      alert(err.message || "Đăng ký thất bại, vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfc]">
      <Layout>
        {/* Banner Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-green-100/50 to-transparent py-12 text-center">
          <div className="container mx-auto relative z-10 px-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 mb-4 tracking-tight">
              Đăng ký tài khoản
            </h1>
            <div className="flex items-center justify-center text-slate-500 text-sm md:text-base font-medium">
              <Link to="/" className="hover:text-green-600 transition-colors">
                Trang chủ
              </Link>
              <span className="mx-3 opacity-30">/</span>
              <span className="text-green-700">Đăng ký</span>
            </div>
          </div>
        </section>

        {/* Main Form Section */}
        <section className="pb-20 pt-4">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-xl mx-auto w-full">
              <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_30px_80px_rgba(0,0,0,0.06)] border border-slate-50 relative overflow-hidden">
                <div className="mb-10 text-center">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    Gia nhập FreshFruits
                  </h2>
                  <p className="text-slate-500 font-medium text-sm md:text-base">
                    Tạo tài khoản để nhận ưu đãi và quản lý đơn hàng tốt hơn.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Row: Họ & Tên */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Họ */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">
                        Họ <span className="text-red-500">*</span>
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
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </span>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={`w-full pl-11 pr-4 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all ${
                            errors.firstName
                              ? "border-red-400 focus:border-red-400"
                              : "border-slate-100 focus:border-green-500 focus:bg-white"
                          }`}
                          placeholder="Nguyễn Văn"
                        />
                      </div>
                      {errors.firstName && (
                        <p className="text-xs text-red-500 font-medium ml-1">
                          {errors.firstName}
                        </p>
                      )}
                    </div>

                    {/* Tên */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">
                        Tên <span className="text-red-500">*</span>
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
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </span>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={`w-full pl-11 pr-4 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all ${
                            errors.lastName
                              ? "border-red-400 focus:border-red-400"
                              : "border-slate-100 focus:border-green-500 focus:bg-white"
                          }`}
                          placeholder="A"
                        />
                      </div>
                      {errors.lastName && (
                        <p className="text-xs text-red-500 font-medium ml-1">
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">
                      Email <span className="text-red-500">*</span>
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
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-11 pr-4 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all ${
                          errors.email
                            ? "border-red-400 focus:border-red-400"
                            : "border-slate-100 focus:border-green-500 focus:bg-white"
                        }`}
                        placeholder="name@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-500 font-medium ml-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Số điện thoại */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">
                      Số điện thoại <span className="text-red-500">*</span>
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
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </span>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`w-full pl-11 pr-4 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all ${
                          errors.phone
                            ? "border-red-400 focus:border-red-400"
                            : "border-slate-100 focus:border-green-500 focus:bg-white"
                        }`}
                        placeholder="0912345678"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-xs text-red-500 font-medium ml-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Mật khẩu */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">
                      Mật khẩu <span className="text-red-500">*</span>
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
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full pl-11 pr-12 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all ${
                          errors.password
                            ? "border-red-400 focus:border-red-400"
                            : "border-slate-100 focus:border-green-500 focus:bg-white"
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-green-600 transition-colors"
                      >
                        {showPassword ? (
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-500 font-medium ml-1">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Xác nhận mật khẩu */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">
                      Xác nhận mật khẩu <span className="text-red-500">*</span>
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
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full pl-11 pr-12 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all ${
                          errors.confirmPassword
                            ? "border-red-400 focus:border-red-400"
                            : "border-slate-100 focus:border-green-500 focus:bg-white"
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-green-600 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500 font-medium ml-1">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Điều khoản */}
                  <div className="pt-2">
                    <label className="flex items-start cursor-pointer group">
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleChange}
                        className="mt-1 flex-shrink-0 w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500 transition-colors"
                      />
                      <span className="ml-3 text-slate-600 text-sm font-medium leading-relaxed group-hover:text-slate-900 transition-colors">
                        Tôi đồng ý với{" "}
                        <Link
                          to="/terms"
                          className="text-green-600 hover:text-green-700 hover:underline underline-offset-4"
                        >
                          điều khoản sử dụng
                        </Link>{" "}
                        và{" "}
                        <Link
                          to="/privacy"
                          className="text-green-600 hover:text-green-700 hover:underline underline-offset-4"
                        >
                          chính sách bảo mật
                        </Link>
                        .
                      </span>
                    </label>
                    {errors.agreeToTerms && (
                      <p className="mt-2 text-xs text-red-500 font-medium ml-1">
                        {errors.agreeToTerms}
                      </p>
                    )}
                  </div>

                  {/* Nút Đăng ký */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 hover:shadow-[0_15px_30px_rgba(34,197,94,0.3)] transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 mt-4"
                  >
                    {isLoading ? renderSpinner() : "Tạo tài khoản"}
                  </button>
                </form>

                {/* Link đăng nhập */}
                <div className="mt-10 pt-8 border-t border-slate-50 text-center">
                  <p className="text-slate-500 font-medium">
                    Bạn đã có tài khoản?{" "}
                    <Link
                      to="/login"
                      className="text-green-600 hover:text-green-700 font-bold ml-1 hover:underline underline-offset-4"
                    >
                      Đăng nhập ngay
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layout>
      <Footer />
    </div>
  );
};

export default RegisterPage;
