import React, { useState } from "react";
import { useLocation, useNavigate, type Location } from "react-router-dom";
import { useAuth } from "../../context/AuthContextAdmin";

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
    <div className="min-h-screen bg-[#fcfdfc] text-slate-800 font-sans selection:bg-blue-200 selection:text-blue-900 relative overflow-hidden">
      {/* Background decorations - Chỉ hiển thị ở phần bên trái */}
      <div className="absolute inset-0 pointer-events-none lg:w-[60%]">
        <div className="absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full bg-blue-200/30 blur-[100px]" />
        <div className="absolute top-1/3 right-0 h-[600px] w-[600px] rounded-full bg-sky-100/30 blur-[120px]" />
        <div className="absolute -bottom-24 left-1/4 h-[500px] w-[500px] rounded-full bg-cyan-100/40 blur-[100px]" />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #1d4ed8 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Main Grid: Chia tỷ lệ 1.3fr (Trái) và 0.9fr (Phải) */}
      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr]">
        {/* ================= LEFT SHOWCASE (Giữ nguyên) ================= */}
        <section className="relative hidden lg:flex flex-col justify-between px-10 xl:px-16 py-10">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-blue-500 to-sky-600 text-white shadow-lg shadow-blue-200/50">
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
                  d="M7 11c0-2.761 2.239-5 5-5 1.58 0 2.988.733 3.904 1.876M7 11c0 3.866 2.91 7 6.5 7S20 14.866 20 11c0-1.898-.702-3.62-1.86-4.93M7 11H4m16 0h-3M12 6V3"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                FreshFruits <span className="text-blue-600">Admin</span>
              </h1>
              <p className="text-sm font-medium text-slate-500">
                Hệ thống quản lý cửa hàng
              </p>
            </div>
          </div>

          {/* Main showcase */}
          <div className="grid grid-cols-12 items-center gap-6 xl:gap-8">
            {/* Text block */}
            <div className="col-span-5 self-end pb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm backdrop-blur-md">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                Quản trị thông minh
              </div>

              <h2 className="mt-6 text-5xl font-black leading-[1.1] tracking-tight text-slate-900 xl:text-6xl">
                Quản lý
                <br />
                cửa hàng
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">
                  hoa quả
                </span>
                <br />
                trực quan.
              </h2>

              <p className="mt-5 max-w-md text-[15px] font-medium leading-relaxed text-slate-500">
                Theo dõi sản phẩm, đơn hàng và hoạt động kinh doanh trong một
                không gian quản trị hiện đại, rõ ràng và đậm chất FreshFruits.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <div className="rounded-[1.5rem] bg-white/80 px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-50 backdrop-blur-md">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Sản phẩm
                  </div>
                  <div className="mt-1 text-lg font-black text-blue-700">
                    Tươi ngon mỗi ngày
                  </div>
                </div>
                <div className="rounded-[1.5rem] bg-white/80 px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-50 backdrop-blur-md">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Hệ thống
                  </div>
                  <div className="mt-1 text-lg font-black text-blue-700">
                    Nhanh gọn, bảo mật
                  </div>
                </div>
              </div>
            </div>

            {/* Visual collage */}
            <div className="col-span-7 relative h-[620px]">
              {/* Main hero card */}
              <div className="absolute left-24 top-4 h-[390px] w-[310px] overflow-hidden rounded-[2.5rem] border border-white bg-white shadow-[0_20px_50px_rgba(59,130,246,0.15)]">
                <img
                  src="https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=900&q=80"
                  alt="Trái cây tươi"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-white/10" />
                <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
                  <div className="rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold text-blue-700 shadow-sm backdrop-blur">
                    Fresh Selection
                  </div>
                  <div className="rounded-full bg-blue-500/95 px-4 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur">
                    24/7
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 right-5 rounded-[1.5rem] bg-white/95 p-4 shadow-lg backdrop-blur">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Danh mục nổi bật
                  </div>
                  <div className="mt-1 text-lg font-black text-slate-900">
                    Táo, cam, kiwi, dâu...
                  </div>
                </div>
              </div>

              {/* Top left card */}
              <div className="absolute left-0 top-[130px] h-[250px] w-[220px] overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
                <img
                  src="https://images.unsplash.com/photo-1571575173700-afb9492e6a50?auto=format&fit=crop&w=700&q=80"
                  alt="Cam"
                  className="h-full w-full object-cover"
                />
                <div className="absolute left-4 top-4 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm backdrop-blur">
                  Cam tươi
                </div>
              </div>

              {/* Bottom center card */}
              <div className="absolute bottom-10 left-14 w-[280px] rounded-[2rem] border border-white bg-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                <div className="overflow-hidden rounded-[1.5rem]">
                  <img
                    src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=700&q=80"
                    alt="Quả mọng"
                    className="h-[170px] w-full object-cover"
                  />
                </div>
                <div className="mt-4 space-y-3 px-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-bold text-slate-800">
                      Kho hàng hôm nay
                    </span>
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                      Ổn định
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-blue-500 to-sky-400" />
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium text-slate-500">
                    <span>Trạng thái sản phẩm</span>
                    <span className="font-bold text-slate-700">72%</span>
                  </div>
                </div>
              </div>

              {/* Floating circular image */}
              <div className="absolute bottom-0 right-10 h-[150px] w-[150px] overflow-hidden rounded-full border-[6px] border-white bg-white shadow-[0_15px_35px_rgba(59,130,246,0.2)]">
                <img
                  src="https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=500&q=80"
                  alt="Táo xanh"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Floating badges */}
              <div className="absolute left-10 top-16 rounded-[1.5rem] bg-white p-4 shadow-xl border border-slate-50">
                <div className="text-3xl">🍊</div>
              </div>
              <div className="absolute right-6 top-28 rounded-[1.5rem] bg-blue-500 px-4 py-3 text-white shadow-xl shadow-blue-500/30">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3"
                    />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                  <span className="text-sm font-bold">Fresh every day</span>
                </div>
              </div>
              <div className="absolute right-0 bottom-36 rounded-full bg-white p-5 shadow-xl border border-slate-50">
                <div className="text-4xl">🍓</div>
              </div>
            </div>
          </div>

          {/* Bottom helper row */}
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
            Giao diện quản trị đồng bộ, bảo mật và thân thiện.
          </div>
        </section>

        {/* ================= RIGHT FORM ================= */}
        <section className="flex flex-col justify-center bg-white lg:border-l lg:border-slate-200 z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] px-6 py-10 sm:px-10 lg:px-14 xl:px-20 min-h-screen">
          <div className="w-full max-w-[420px] mx-auto">
            {/* Mobile brand */}
            <div className="mb-10 flex flex-col items-center text-center lg:hidden">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-sky-600 text-white shadow-lg shadow-blue-200 mb-4">
                <svg
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 11c0-2.761 2.239-5 5-5 1.58 0 2.988.733 3.904 1.876M7 11c0 3.866 2.91 7 6.5 7S20 14.866 20 11c0-1.898-.702-3.62-1.86-4.93M7 11H4m16 0h-3M12 6V3"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-black text-slate-900">
                FreshFruits Admin
              </h1>
            </div>

            {/* Tiêu đề Form */}
            <div className="mb-8">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Đăng nhập
              </h2>
              <p className="mt-2 text-[15px] font-medium text-slate-500">
                Vui lòng nhập email và mật khẩu để vào khu vực quản trị.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit}>
              {error && (
                <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 flex items-start gap-2">
                  <svg
                    className="w-5 h-5 shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Input Email */}
                <div className="group">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <svg
                        className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500"
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
                      placeholder="Email quản trị"
                      className="h-14 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-slate-800 font-medium outline-none transition-all placeholder:text-slate-400 placeholder:font-normal focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:border-slate-400"
                    />
                  </div>
                </div>

                {/* Input Password */}
                <div className="group">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <svg
                        className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500"
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
                      placeholder="Mật khẩu"
                      className="h-14 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-12 text-slate-800 font-medium outline-none transition-all placeholder:text-slate-400 placeholder:font-normal focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:border-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition hover:text-blue-600 focus:outline-none"
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

              {/* Tùy chọn nhớ mật khẩu & Quên mật khẩu */}
              <div className="mt-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium text-slate-600 cursor-pointer"
                  >
                    Ghi nhớ tôi
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline transition"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Nút Đăng nhập */}
              <button
                disabled={loading}
                className="mt-6 flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 text-[16px] font-bold text-white shadow-[0_8px_20px_rgba(59,130,246,0.2)] transition-all hover:from-blue-700 hover:to-blue-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
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
                  "Đăng nhập"
                )}
              </button>

              {/* Divider */}
              <div className="my-8 flex items-center justify-center gap-4">
                <div className="h-px flex-1 bg-slate-200"></div>
                <span className="text-[13px] font-semibold text-slate-400 uppercase tracking-wide">
                  Hỗ trợ
                </span>
                <div className="h-px flex-1 bg-slate-200"></div>
              </div>

              {/* Nút Phụ */}
              <button
                type="button"
                className="flex h-14 w-full items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-4 text-[15px] font-bold text-slate-600 transition-all hover:border-blue-500 hover:text-blue-600 active:scale-[0.98]"
              >
                Liên hệ kỹ thuật viên
              </button>
            </form>

            <div className="mt-10 text-center text-xs font-medium text-slate-400">
              © {new Date().getFullYear()} FreshFruits Admin. Bảo mật nội bộ.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPageAdmin;
