import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import Footer from "../../../components/client/layouts/Footer";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { showSuccessToast, showErrorToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name as keyof LoginFormData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};
    if (!formData.email) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await login(formData.email, formData.password, formData.rememberMe);
      showSuccessToast({
        title: "Thành công",
        message: "Đăng nhập thành công!",
      });
      navigate("/");
    } catch (err: any) {
      showErrorToast(err.message || "Đăng nhập thất bại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfc]">
      <Layout>
        {/* Banner Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-green-100/50 to-transparent py-12 text-center">
          <div className="container mx-auto relative z-10 px-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 mb-4 tracking-tight">
              Đăng nhập
            </h1>
            <div className="flex items-center justify-center text-slate-500 text-sm md:text-base font-medium">
              <Link to="/" className="hover:text-green-600 transition-colors">
                Trang chủ
              </Link>
              <span className="mx-3 opacity-30">/</span>
              <span className="text-green-700">Tài khoản</span>
            </div>
          </div>
        </section>

        {/* Main Section */}
        <section className="pb-20 pt-4">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* --- LEFT VISUAL AREA (Vùng đã được sửa đẹp hơn) --- */}
              <div className="hidden lg:block relative">
                {/* Background Blobs */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-green-200 rounded-full blur-[100px] opacity-60"></div>
                <div className="absolute -bottom-20 right-0 w-72 h-72 bg-yellow-100 rounded-full blur-[100px] opacity-60"></div>

                <div className="relative z-10 space-y-8">
                  {/* Headline Group */}
                  <div>
                    <span className="inline-block bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                      Sức khỏe từ thiên nhiên
                    </span>
                    <h2 className="text-5xl font-black text-slate-900 leading-[1.1]">
                      Trải nghiệm <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                        Vị ngon nguyên bản
                      </span>
                    </h2>
                    <p className="mt-6 text-slate-600 text-lg leading-relaxed max-w-md">
                      Tham gia cùng cộng đồng FreshFruits để nhận ưu đãi lên đến
                      30% cho đơn hàng đầu tiên.
                    </p>
                  </div>

                  {/* Image Showcase (Bố cục khoa học hơn) */}
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-7 overflow-hidden rounded-[2.5rem] shadow-2xl border-8 border-white">
                      <img
                        src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80"
                        alt="Fruit"
                        className="h-[320px] w-full object-cover transform hover:scale-105 transition duration-700"
                      />
                    </div>
                    <div className="col-span-5 space-y-4">
                      <div className="overflow-hidden rounded-[2rem] shadow-xl border-4 border-white rotate-3">
                        <img
                          src="https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTZ8fGZydWl0c3xlbnwwfHwwfHx8MA%3D%3D"
                          alt="Fruit Mini"
                          className="h-32 w-full object-cover"
                        />
                      </div>
                      <div className="bg-emerald-600 p-5 rounded-[2rem] text-white shadow-lg -rotate-3">
                        <p className="text-2xl font-bold">100%</p>
                        <p className="text-xs opacity-90 uppercase tracking-tighter font-semibold">
                          Organic Certified
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Feature Pills */}
                  <div className="flex flex-wrap gap-3">
                    {[
                      "Giao hàng 2h",
                      "Đổi trả miễn phí",
                      "Tích điểm thưởng",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-slate-100 px-5 py-2.5 rounded-2xl shadow-sm text-slate-700 text-sm font-semibold"
                      >
                        <svg
                          className="w-4 h-4 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Form Area */}
              <div className="w-full">
                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_30px_80px_rgba(0,0,0,0.06)] border border-slate-50 relative overflow-hidden">
                  {/* Form Header */}
                  <div className="mb-10 text-center lg:text-left">
                    <h3 className="text-3xl font-bold text-slate-900 mb-2">
                      Mừng bạn quay lại!
                    </h3>
                    <p className="text-slate-500 font-medium text-sm md:text-base">
                      Đăng nhập để quản lý đơn hàng & thông tin của bạn
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Input */}
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

                    {/* Password Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">
                        Mật khẩu
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
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
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

                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center group cursor-pointer">
                        <input
                          type="checkbox"
                          name="rememberMe"
                          checked={formData.rememberMe}
                          onChange={handleChange}
                          className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500 transition-colors"
                        />
                        <span className="ml-2 text-slate-600 group-hover:text-slate-900 transition-colors font-medium">
                          Ghi nhớ tôi
                        </span>
                      </label>
                      <Link
                        to="/forgot-password"
                        size-sm
                        className="text-green-600 hover:text-green-700 font-bold underline-offset-4 hover:underline"
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 hover:shadow-[0_15px_30px_rgba(34,197,94,0.3)] transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
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
                      ) : (
                        "Đăng nhập ngay"
                      )}
                    </button>
                  </form>

                  <div className="mt-10 pt-8 border-t border-slate-50 text-center">
                    <p className="text-slate-500 font-medium">
                      Bạn chưa có tài khoản?{" "}
                      <Link
                        to="/register"
                        className="text-green-600 hover:text-green-700 font-bold ml-1 hover:underline underline-offset-4"
                      >
                        Tạo tài khoản mới
                      </Link>
                    </p>
                  </div>
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

export default LoginPage;
