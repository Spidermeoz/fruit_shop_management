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
    <div className="min-h-screen bg-[#f5fbf4] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-green-200/40 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-lime-200/40 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #166534 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
        {/* LEFT SHOWCASE */}
        <section className="relative hidden lg:flex flex-col justify-between px-10 xl:px-16 py-10">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 text-white shadow-lg shadow-green-200">
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 11c0-2.761 2.239-5 5-5 1.58 0 2.988.733 3.904 1.876M7 11c0 3.866 2.91 7 6.5 7S20 14.866 20 11c0-1.898-.702-3.62-1.86-4.93M7 11H4m16 0h-3M12 6V3"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-green-900">
                FreshFruits Admin
              </h1>
              <p className="text-sm text-green-700/80">
                Hệ thống quản lý cửa hàng hoa quả
              </p>
            </div>
          </div>

          {/* Main showcase */}
          <div className="grid grid-cols-12 items-center gap-6 xl:gap-8">
            {/* Text block */}
            <div className="col-span-5 self-end pb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-white/80 px-4 py-2 text-sm font-medium text-green-700 shadow-sm backdrop-blur">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                Quản trị thông minh cho FreshFruits
              </div>

              <h2 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight text-slate-900 xl:text-6xl">
                Quản lý
                <br />
                cửa hàng
                <br />
                <span className="text-green-600">hoa quả</span>
                <br />
                thật trực quan.
              </h2>

              <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
                Theo dõi sản phẩm, đơn hàng và hoạt động kinh doanh trong một
                không gian quản trị hiện đại, rõ ràng và đậm chất FreshFruits.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="rounded-2xl bg-white/85 px-4 py-3 shadow-md ring-1 ring-green-100 backdrop-blur">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sản phẩm
                  </div>
                  <div className="mt-1 text-lg font-bold text-green-700">
                    Tươi ngon mỗi ngày
                  </div>
                </div>

                <div className="rounded-2xl bg-white/85 px-4 py-3 shadow-md ring-1 ring-green-100 backdrop-blur">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Quản trị
                  </div>
                  <div className="mt-1 text-lg font-bold text-green-700">
                    Nhanh gọn, dễ dùng
                  </div>
                </div>
              </div>
            </div>

            {/* Visual collage */}
            <div className="col-span-7 relative h-[620px]">
              {/* Main hero card */}
              <div className="absolute left-24 top-4 h-[390px] w-[310px] overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-2xl shadow-green-200/70">
                <img
                  src="https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=900&q=80"
                  alt="Trái cây tươi"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10" />

                <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
                  <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-green-700 shadow">
                    Fresh Selection
                  </div>
                  <div className="rounded-full bg-green-500/90 px-3 py-1 text-xs font-semibold text-white shadow">
                    24/7
                  </div>
                </div>

                <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/90 p-4 backdrop-blur">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Danh mục nổi bật
                  </div>
                  <div className="mt-1 text-lg font-bold text-slate-900">
                    Táo, cam, kiwi, dâu, nho
                  </div>
                </div>
              </div>

              {/* Top left card */}
              <div className="absolute left-0 top-120 top-[130px] h-[250px] w-[220px] overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-xl shadow-green-100">
                <img
                  src="https://images.unsplash.com/photo-1571575173700-afb9492e6a50?auto=format&fit=crop&w=700&q=80"
                  alt="Cam và trái cây họ cam quýt"
                  className="h-full w-full object-cover"
                />
                <div className="absolute left-4 top-4 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-green-700 shadow">
                  Cam tươi
                </div>
              </div>

              {/* Bottom center card */}
              <div className="absolute bottom-10 left-14 w-[280px] rounded-[28px] border border-white/80 bg-white p-4 shadow-2xl shadow-green-100">
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=700&q=80"
                    alt="Các loại quả mọng"
                    className="h-[170px] w-full object-cover"
                  />
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">
                      Kho hàng hôm nay
                    </span>
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                      Ổn định
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 w-[72%] rounded-full bg-gradient-to-r from-green-500 to-emerald-400" />
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Trạng thái sản phẩm</span>
                    <span className="font-semibold text-slate-700">72%</span>
                  </div>
                </div>
              </div>

              {/* Floating circular image */}
              <div className="absolute bottom-0 right-10 h-[150px] w-[150px] overflow-hidden rounded-full border-4 border-white bg-white shadow-2xl shadow-green-200">
                <img
                  src="https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=500&q=80"
                  alt="Táo xanh"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Floating badges */}
              <div className="absolute left-10 top-16 rounded-2xl bg-white px-4 py-3 shadow-xl">
                <div className="text-3xl">🍊</div>
              </div>

              <div className="absolute right-6 top-28 rounded-2xl bg-green-500 px-4 py-3 text-white shadow-xl">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3"
                    />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                  <span className="text-sm font-semibold">Fresh every day</span>
                </div>
              </div>

              <div className="absolute right-0 bottom-36 rounded-full bg-white px-5 py-4 shadow-xl">
                <div className="text-4xl">🍓</div>
              </div>
            </div>
          </div>

          {/* Bottom helper row */}
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            Giao diện quản trị dành riêng cho cửa hàng hoa quả FreshFruits
          </div>
        </section>

        {/* RIGHT FORM */}
        <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            {/* Mobile brand / hero */}
            <div className="mb-6 lg:hidden">
              <div className="rounded-[28px] border border-green-100 bg-white/90 p-5 shadow-xl shadow-green-100 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 text-white shadow-md">
                    <svg
                      className="h-7 w-7"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 11c0-2.761 2.239-5 5-5 1.58 0 2.988.733 3.904 1.876M7 11c0 3.866 2.91 7 6.5 7S20 14.866 20 11c0-1.898-.702-3.62-1.86-4.93M7 11H4m16 0h-3M12 6V3"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold text-green-900">
                      FreshFruits Admin
                    </h1>
                    <p className="text-sm text-slate-600">
                      Đăng nhập hệ thống quản trị
                    </p>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1200&q=80"
                    alt="Fresh fruits"
                    className="h-40 w-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[32px] border border-green-100 bg-white/92 shadow-2xl shadow-green-100 backdrop-blur-xl">
              {/* Header */}
              <div className="border-b border-green-50 bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 px-7 py-7 text-white sm:px-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-50/90">
                      Chào mừng trở lại
                    </p>
                    <h2 className="mt-1 text-3xl font-extrabold tracking-tight">
                      Đăng nhập Admin
                    </h2>
                    <p className="mt-2 text-sm text-green-50/90">
                      Truy cập khu vực quản lý đơn hàng, sản phẩm và khách hàng.
                    </p>
                  </div>

                  <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                    <svg
                      className="h-7 w-7"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 7h16M7 4v6m10-6v6M6 11h12l-1 8H7l-1-8z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={onSubmit} className="px-7 py-7 sm:px-8 sm:py-8">
                {error && (
                  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                )}

                <div className="space-y-5">
                  <div className="group">
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Email quản trị
                    </label>

                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <svg
                          className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-green-600"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 6h16v12H4z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 8l8 6 8-6"
                          />
                        </svg>
                      </div>

                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, email: e.target.value }))
                        }
                        required
                        placeholder="admin@freshfruits.com"
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-12 pr-4 text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Mật khẩu
                    </label>

                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <svg
                          className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-green-600"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            x="4"
                            y="11"
                            width="16"
                            height="9"
                            rx="2"
                            ry="2"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 11V8a4 4 0 118 0v3"
                          />
                        </svg>
                      </div>

                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, password: e.target.value }))
                        }
                        required
                        placeholder="••••••••"
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-12 pr-14 text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"
                        }
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition hover:text-slate-600"
                      >
                        {showPassword ? (
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 3l18 18"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M10.58 10.58a2 2 0 102.83 2.83"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9.88 5.09A9.77 9.77 0 0112 4.8c5 0 9.27 3.11 11 7.2a11.83 11.83 0 01-4.04 4.97M6.61 6.61A11.84 11.84 0 001 12c1.73 4.09 6 7.2 11 7.2 1.67 0 3.25-.35 4.68-.98"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
                            />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                    <span className="text-sm">🥝</span>
                    Khu vực quản trị nội bộ
                  </div>

                  <button
                    type="button"
                    className="text-sm font-semibold text-green-700 transition hover:text-green-800"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                <button
                  disabled={loading}
                  className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-green-700 to-emerald-500 px-4 text-base font-bold text-white shadow-lg shadow-green-200 transition hover:scale-[1.01] hover:from-green-800 hover:to-emerald-600 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {loading ? (
                    <span className="flex items-center gap-3">
                      <svg
                        className="h-5 w-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          className="opacity-25"
                        />
                        <path
                          d="M22 12a10 10 0 00-10-10"
                          stroke="currentColor"
                          strokeWidth="4"
                          className="opacity-90"
                        />
                      </svg>
                      Đang đăng nhập...
                    </span>
                  ) : (
                    "Đăng nhập vào hệ thống"
                  )}
                </button>

                <div className="mt-6 rounded-2xl border border-green-100 bg-green-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-lg">🍏</div>
                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        FreshFruits Management
                      </p>
                      <p className="mt-1 text-sm leading-6 text-green-700/80">
                        Giao diện được thiết kế để gợi rõ tinh thần tươi mới,
                        sạch sẽ và chuyên nghiệp của một thương hiệu hoa quả.
                      </p>
                    </div>
                  </div>
                </div>
              </form>

              <div className="border-t border-slate-100 px-7 py-5 text-center text-xs text-slate-500 sm:px-8">
                © 2025 FreshFruits Admin. Bảo lưu mọi quyền.
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPageAdmin;
