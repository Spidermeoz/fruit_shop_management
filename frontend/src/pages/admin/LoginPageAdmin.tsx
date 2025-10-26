import React, { useState } from "react";
import { useLocation, useNavigate, type Location } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

interface LocationState {
  from?: {
    pathname?: string;
  };
}

const LoginPageAdmin: React.FC = () => {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as Location<LocationState>;
  const from = loc.state?.from?.pathname || "/admin/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      await login(form.email, form.password);
      nav(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fruit Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Apples */}
        <div className="absolute top-10 left-10 opacity-20 transform rotate-12">
          <svg
            width="120"
            height="120"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="55" r="35" fill="#ef4444" />
            <path
              d="M50 20 C50 10, 55 5, 60 10 C65 5, 70 10, 70 20"
              fill="#16a34a"
            />
            <ellipse cx="45" cy="40" rx="8" ry="12" fill="#fca5a5" />
          </svg>
        </div>

        {/* Orange */}
        <div className="absolute top-20 right-20 opacity-20 transform -rotate-12">
          <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="50" r="40" fill="#fb923c" />
            <circle cx="40" cy="40" r="5" fill="#fed7aa" />
            <circle cx="60" cy="50" r="4" fill="#fed7aa" />
            <circle cx="45" cy="65" r="6" fill="#fed7aa" />
          </svg>
        </div>

        {/* Grapes */}
        <div className="absolute bottom-20 left-20 opacity-20">
          <svg
            width="100"
            height="120"
            viewBox="0 0 100 120"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="30" cy="40" r="15" fill="#9333ea" />
            <circle cx="50" cy="40" r="15" fill="#9333ea" />
            <circle cx="70" cy="40" r="15" fill="#9333ea" />
            <circle cx="40" cy="60" r="15" fill="#9333ea" />
            <circle cx="60" cy="60" r="15" fill="#9333ea" />
            <circle cx="50" cy="80" r="15" fill="#9333ea" />
            <path
              d="M50 20 C50 10, 55 5, 60 10 C65 5, 70 10, 70 20"
              fill="#16a34a"
            />
          </svg>
        </div>

        {/* Watermelon Slice */}
        <div className="absolute bottom-10 right-10 opacity-20 transform rotate-45">
          <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M50 10 L90 90 L10 90 Z" fill="#ef4444" />
            <path d="M50 10 L90 90 L10 90 Z" fill="#fbbf24" opacity="0.3" />
            <path d="M50 10 L50 90" stroke="#16a34a" strokeWidth="2" />
            <circle cx="50" cy="70" r="3" fill="#1e40af" />
            <circle cx="40" cy="60" r="3" fill="#1e40af" />
            <circle cx="60" cy="60" r="3" fill="#1e40af" />
            <circle cx="35" cy="75" r="3" fill="#1e40af" />
            <circle cx="65" cy="75" r="3" fill="#1e40af" />
          </svg>
        </div>

        {/* Strawberry */}
        <div className="absolute top-1/2 left-10 opacity-20 transform -rotate-12">
          <svg
            width="80"
            height="100"
            viewBox="0 0 80 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M40 20 C20 20, 10 40, 10 60 C10 80, 20 90, 40 90 C60 90, 70 80, 70 60 C70 40, 60 20, 40 20 Z"
              fill="#ef4444"
            />
            <path
              d="M40 20 C40 10, 45 5, 50 10 C55 5, 60 10, 60 20"
              fill="#16a34a"
            />
            <circle cx="25" cy="40" r="3" fill="#fbbf24" />
            <circle cx="35" cy="35" r="3" fill="#fbbf24" />
            <circle cx="45" cy="40" r="3" fill="#fbbf24" />
            <circle cx="55" cy="35" r="3" fill="#fbbf24" />
            <circle cx="30" cy="50" r="3" fill="#fbbf24" />
            <circle cx="40" cy="55" r="3" fill="#fbbf24" />
            <circle cx="50" cy="50" r="3" fill="#fbbf24" />
          </svg>
        </div>

        {/* Animated gradient blobs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-300 to-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-300 to-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-200 to-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Decorative pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-r from-purple-600 via-purple-500 to-green-500 p-8 text-center">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 shadow-lg">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  ></path>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                FruitShop Admin
              </h1>
              <p className="text-purple-100">
                Chào mừng trở lại! Vui lòng đăng nhập
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="group">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-purple-600"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      ></path>
                    </svg>
                  </div>
                  <input
                    id="email"
                    className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, email: e.target.value }))
                    }
                    required
                    placeholder="admin@fruitshop.com"
                  />
                </div>
              </div>

              <div className="group">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-purple-600"
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      ></path>
                    </svg>
                  </div>
                  <input
                    id="password"
                    className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-12 py-3.5 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, password: e.target.value }))
                    }
                    required
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"
                    }
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5 text-gray-400 hover:text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-gray-400 hover:text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        ></path>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        ></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <button
                  type="button"
                  className="font-medium text-purple-600 hover:text-purple-500 transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-green-500 text-white rounded-xl py-3.5 font-semibold hover:from-purple-700 hover:to-green-600 focus:outline-none focus:ring-4 focus:ring-purple-200 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
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
                  Đang đăng nhập...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-gray-500">
              © 2025 FruitShop Admin. Bảo lưu mọi quyền.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPageAdmin;
