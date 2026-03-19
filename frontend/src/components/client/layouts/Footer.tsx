import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Kiểu dữ liệu API trả về (Bổ sung thêm mxh nếu API có trả về)
interface SettingGeneral {
  website_name?: string | null;
  logo?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  copyright?: string | null;
  facebook?: string | null;
  zalo?: string | null;
}

const Footer: React.FC = () => {
  const [settings, setSettings] = useState<SettingGeneral | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/v1/client/settings/general");
        const json = await res.json();

        if (json.success) {
          setSettings(json.data);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    })();
  }, []);

  // Các giá trị fallback
  const websiteName = settings?.website_name || "FreshFruits";
  const phone = settings?.phone || "0123 456 789";
  const email = settings?.email || "cskh@freshfruits.vn";
  const address =
    settings?.address || "Đại học Thăng Long, Nghiêm Xuân Yêm, Hà Nội";
  const copyright =
    settings?.copyright ||
    `© ${new Date().getFullYear()} FreshFruits. All rights reserved.`;

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative overflow-hidden bg-slate-900 pt-20 pb-10 text-slate-300 mt-auto border-t-[8px] border-green-600">
      {/* Background Decor - Hiệu ứng ánh sáng mờ */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none translate-x-1/3 translate-y-1/3"></div>

      <div className="container relative z-10 mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Cột 1: Thông tin thương hiệu (Chiếm 4 cột trên Desktop) */}
          <div className="lg:col-span-4 space-y-6">
            <Link to="/" onClick={handleScrollTop} className="inline-block">
              {settings?.logo ? (
                <img
                  src={settings.logo}
                  alt={websiteName}
                  className="h-12 object-contain"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-2xl font-black tracking-tight text-white">
                    {websiteName}
                  </span>
                </div>
              )}
            </Link>

            <p className="text-slate-400 leading-relaxed max-w-sm">
              Tự hào mang đến nguồn thực phẩm sạch, rau củ quả tươi ngon đạt
              chuẩn organic, bảo vệ sức khỏe cho gia đình bạn mỗi ngày.
            </p>

            <div className="flex items-center gap-4 pt-2">
              {/* Dummy Social Icons (Có thể gắn link từ API nếu có) */}
              <a
                href={settings?.facebook || "#"}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-all hover:bg-[#1877F2] hover:text-white"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href={settings?.zalo || "#"}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-all hover:bg-[#0068FF] hover:text-white"
              >
                <span className="text-[10px] font-black">Zalo</span>
              </a>
            </div>
          </div>

          {/* Cột 2: Liên kết nhanh (Chiếm 2 cột) */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h4 className="text-lg font-bold text-white mb-6">
              Liên kết nhanh
            </h4>
            <ul className="space-y-4">
              {[
                { name: "Trang chủ", path: "/" },
                { name: "Sản phẩm", path: "/products" },
                { name: "Giỏ hàng", path: "/cart" },
                { name: "Khuyến mãi", path: "/offers" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    onClick={handleScrollTop}
                    className="group flex items-center text-slate-400 transition-colors hover:text-green-400"
                  >
                    <span className="h-1 w-1 rounded-full bg-green-500 opacity-0 transition-all group-hover:mr-2 group-hover:opacity-100"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 3: Hỗ trợ khách hàng (Chiếm 2 cột) */}
          <div className="lg:col-span-2">
            <h4 className="text-lg font-bold text-white mb-6">Hỗ trợ</h4>
            <ul className="space-y-4">
              {[
                { name: "Liên hệ", path: "/contact" },
                { name: "Chính sách bảo mật", path: "/privacy-policy" },
                { name: "Chính sách đổi trả", path: "/return-policy" },
                { name: "Chính sách giao hàng", path: "/shipping-policy" },
                { name: "Điều khoản sử dụng", path: "/terms" },
                { name: "Câu hỏi thường gặp", path: "/faq" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    onClick={handleScrollTop}
                    className="group flex items-center text-slate-400 transition-colors hover:text-green-400"
                  >
                    <span className="h-1 w-1 rounded-full bg-green-500 opacity-0 transition-all group-hover:mr-2 group-hover:opacity-100"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 4: Thông tin liên hệ (Chiếm 4 cột) */}
          <div className="lg:col-span-4">
            <h4 className="text-lg font-bold text-white mb-6">
              Thông tin liên hệ
            </h4>
            <ul className="space-y-5">
              <li className="flex items-start gap-4 text-slate-400">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-green-500">
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <span className="leading-relaxed">{address}</span>
              </li>

              <li className="flex items-center gap-4 text-slate-400">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-green-500">
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
                </div>
                <a
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="font-bold hover:text-green-400 transition-colors"
                >
                  {phone}
                </a>
              </li>

              <li className="flex items-center gap-4 text-slate-400">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-green-500">
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <a
                  href={`mailto:${email}`}
                  className="hover:text-green-400 transition-colors"
                >
                  {email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm font-medium text-center md:text-left">
            {copyright}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-slate-500 text-sm font-medium">
              Chấp nhận thanh toán:
            </span>
            {/* Payment Dummy Icons */}
            <div className="flex gap-2 opacity-50 grayscale">
              <div className="h-6 w-10 bg-slate-200 rounded flex items-center justify-center text-[8px] font-bold text-slate-800">
                VISA
              </div>
              <div className="h-6 w-10 bg-slate-200 rounded flex items-center justify-center text-[8px] font-bold text-slate-800">
                CASH
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
