import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import Footer from "../../../components/client/layouts/Footer";
import { http } from "../../../services/http";

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

const ContactPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingGeneral | null>(null);
  // Đổi nhẹ tên biến để tái sử dụng làm hiệu ứng Loading Skeleton mượt mà
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await http<any>("GET", "/api/v1/client/settings/general");
        if (res?.success) {
          setSettings(res.data || null);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const websiteName = settings?.website_name || "FreshFruits";
  const email = settings?.email || "test@gmail.com";
  const phone = settings?.phone || "01234 567 890";
  const facebook = settings?.facebook?.trim() || "";
  const zalo = settings?.zalo?.trim() || "";

  // --- TRẠNG THÁI LOADING ---
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#fcfdfc]">
        <Layout>
          <div className="container mx-auto px-4 py-20 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-green-100 border-t-green-600 rounded-full animate-spin mb-6"></div>
            <p className="text-slate-500 font-medium animate-pulse">
              Đang tải thông tin liên hệ...
            </p>
          </div>
        </Layout>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfc] font-sans selection:bg-green-200 selection:text-green-900">
      <Layout>
        {/* ==================== 1. HERO / BANNER ==================== */}
        <section className="relative overflow-hidden bg-gradient-to-b from-green-50 via-yellow-50/30 to-transparent pt-16 pb-20 text-center">
          {/* Decorative Blobs */}
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-green-200/20 rounded-full blur-[100px] pointer-events-none -z-10"></div>
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-yellow-200/20 rounded-full blur-[100px] pointer-events-none -z-10"></div>

          <div className="container mx-auto relative z-10 px-4 max-w-3xl">
            {/* Breadcrumb */}
            <div className="flex items-center justify-center text-slate-500 text-sm md:text-base font-medium mb-8">
              <Link to="/" className="hover:text-green-600 transition-colors">
                Trang chủ
              </Link>
              <span className="mx-3 opacity-30">/</span>
              <span className="text-green-700 font-bold">Liên hệ</span>
            </div>

            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-green-100 flex items-center justify-center mx-auto mb-6 text-green-600">
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
              Chúng tôi luôn ở đây <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                để lắng nghe bạn
              </span>
            </h1>
            <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
              FreshFruits sẵn sàng hỗ trợ bạn qua nhiều kênh liên hệ khác nhau.
              Đừng ngần ngại chọn cách thức thuận tiện nhất để kết nối với chúng
              tôi!
            </p>
          </div>
        </section>

        {/* ==================== 2. KHU VỰC GIỚI THIỆU CHÍNH ==================== */}
        <section className="pb-20 relative z-20 -mt-6">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
              {/* --- 2.1. Cột trái (Thông điệp chính) --- */}
              <div className="lg:col-span-7">
                <div className="h-full bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-slate-50 relative overflow-hidden flex flex-col justify-center">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-3 mb-8">
                    <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-green-700 border border-green-100">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
                      </span>
                      Hỗ trợ nhanh chóng
                    </span>
                    <span className="inline-flex rounded-full bg-orange-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-orange-700 border border-orange-100">
                      Thân thiện & Tận tâm
                    </span>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-6">
                    Kết nối với {websiteName} <br />
                    theo cách thuận tiện nhất
                  </h2>

                  <p className="text-lg leading-relaxed text-slate-500 mb-10 font-medium">
                    Dù bạn cần tư vấn chọn trái cây theo mùa, hỗ trợ xử lý đơn
                    hàng hay đơn giản là muốn chia sẻ trải nghiệm mua sắm, đội
                    ngũ của chúng tôi luôn túc trực để phản hồi bạn sớm nhất.
                  </p>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
                    <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 transition-colors hover:bg-green-50 hover:border-green-100 group">
                      <svg
                        className="w-8 h-8 text-green-500 mb-3 group-hover:scale-110 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Tư vấn
                      </p>
                      <p className="font-bold text-slate-800 text-sm">
                        Sản phẩm & Đơn hàng
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 transition-colors hover:bg-yellow-50 hover:border-yellow-100 group">
                      <svg
                        className="w-8 h-8 text-yellow-500 mb-3 group-hover:scale-110 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Phản hồi
                      </p>
                      <p className="font-bold text-slate-800 text-sm">
                        Nhanh chóng & Rõ ràng
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 transition-colors hover:bg-blue-50 hover:border-blue-100 group">
                      <svg
                        className="w-8 h-8 text-blue-500 mb-3 group-hover:scale-110 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                        />
                      </svg>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Đa kênh
                      </p>
                      <p className="font-bold text-slate-800 text-sm">
                        Facebook, Zalo, Email
                      </p>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                    <Link
                      to="/products"
                      className="inline-flex items-center justify-center rounded-2xl bg-green-600 px-8 py-4 font-bold text-white transition-all hover:bg-green-700 shadow-md shadow-green-200 active:scale-95"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                      Khám phá sản phẩm
                    </Link>
                    <a
                      href={`tel:${phone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center justify-center rounded-2xl border-2 border-slate-100 bg-white px-8 py-4 font-bold text-slate-700 transition-all hover:border-green-500 hover:text-green-600 active:scale-95"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      Gọi ngay cho chúng tôi
                    </a>
                  </div>
                </div>
              </div>

              {/* --- 2.2. Cột phải (Action Panel) --- */}
              <div className="lg:col-span-5 grid grid-cols-1 gap-6">
                {/* Contact Cards (Phone & Email) */}
                <div className="rounded-[2.5rem] bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col gap-2">
                  {/* Phone */}
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="flex items-center gap-5 rounded-[2rem] p-5 transition-all hover:bg-green-50 hover:shadow-sm group"
                  >
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.2rem] bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-7 w-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-green-600 uppercase tracking-wider mb-1">
                        Đường dây nóng
                      </p>
                      <p className="block text-2xl font-black text-slate-900 group-hover:text-green-700 transition-colors">
                        {phone}
                      </p>
                    </div>
                  </a>

                  <div className="h-px bg-slate-100 mx-5"></div>

                  {/* Email */}
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-5 rounded-[2rem] p-5 transition-all hover:bg-yellow-50 hover:shadow-sm group"
                  >
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.2rem] bg-yellow-100 text-yellow-600 group-hover:bg-yellow-500 group-hover:text-white transition-colors duration-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-7 w-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-yellow-600 uppercase tracking-wider mb-1">
                        Email hỗ trợ
                      </p>
                      <p className="block break-all text-xl font-bold text-slate-900 group-hover:text-yellow-700 transition-colors">
                        {email}
                      </p>
                    </div>
                  </a>
                </div>

                {/* Social Card (Dark premium) */}
                <div className="rounded-[2.5rem] bg-slate-900 p-8 md:p-10 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden flex flex-col justify-center">
                  {/* Pattern mờ */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-green-500/20 blur-3xl rounded-full pointer-events-none"></div>

                  <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-3 text-white">
                      Mạng xã hội
                    </h3>
                    <p className="text-slate-400 text-[15px] font-medium mb-8 leading-relaxed">
                      Theo dõi và nhắn tin trực tiếp qua các nền tảng quen thuộc
                      để nhận phản hồi nhanh chóng và các ưu đãi bí mật.
                    </p>

                    <div className="space-y-4">
                      {facebook && (
                        <a
                          href={facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-3 rounded-2xl bg-[#1877F2] py-4 font-bold transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-[#1877F2]/30 active:scale-95"
                        >
                          <svg
                            className="h-6 w-6 fill-current text-white"
                            viewBox="0 0 24 24"
                          >
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                          Trò chuyện qua Facebook
                        </a>
                      )}

                      {zalo && (
                        <a
                          href={zalo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-3 rounded-2xl bg-[#0068FF] py-4 font-bold transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-[#0068FF]/30 active:scale-95"
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[#0068FF] font-black text-[10px]">
                            Zalo
                          </div>
                          Nhắn tin qua Zalo
                        </a>
                      )}

                      {/* Empty state nếu cả 2 link đều trống */}
                      {!facebook && !zalo && (
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center">
                          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg
                              className="w-5 h-5 text-white/50"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              ></path>
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-white/60">
                            Các kênh mạng xã hội đang được chúng tôi cập nhật.
                            Vui lòng liên hệ qua Hotline hoặc Email!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 4. MAP SECTION ==================== */}
        <section className="pb-24 pt-10">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-10 text-center max-w-2xl mx-auto">
                <span className="text-green-600 font-bold tracking-wider uppercase text-sm mb-2 block">
                  Vị trí của chúng tôi
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                  Ghé thăm cửa hàng
                </h2>
                <p className="text-slate-500 font-medium text-lg leading-relaxed">
                  Trải nghiệm trực tiếp không gian trái cây tươi mát và nhận sự
                  tư vấn tận tình từ nhân viên của {websiteName}.
                </p>
              </div>

              {/* Bao bọc Iframe đẹp mắt */}
              <div className="relative overflow-hidden rounded-[3rem] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.06)] border border-slate-50 p-3 md:p-5 group">
                {/* Info Card Float trên Map (Chỉ hiển thị trên Desktop để tăng tính thẩm mỹ) */}
                <div className="absolute top-10 left-10 z-10 hidden md:block w-72 bg-white/95 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border border-white">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      ></path>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      ></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {websiteName} Store
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mb-4">
                    {settings?.address || "Trường Đại học Thăng Long, Hà Nội"}
                  </p>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-sm font-bold text-green-600 hover:text-green-700"
                  >
                    Chỉ đường{" "}
                    <span className="ml-1 text-lg leading-none">&rarr;</span>
                  </a>
                </div>

                <div className="rounded-[2.5rem] overflow-hidden relative">
                  {/* Lớp phủ tương tác mượt khi hover */}
                  <div className="absolute inset-0 bg-slate-900/5 pointer-events-none group-hover:bg-transparent transition-colors duration-500 z-10"></div>

                  {/* Giữ nguyên Iframe gốc */}
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.828589098033!2d105.80698267503118!3d20.974101289646206!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135accf8ad3d6a7%3A0x3b3f4b5d6c7f01d1!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBUaMSDbmcgTG9uZw!5e0!3m2!1svi!2sVN!4v1710000000000!5m2!1svi!2sVN"
                    width="100%"
                    height="500"
                    className="border-0 w-full object-cover filter contrast-[0.95] saturate-[1.1]"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`${websiteName} Location`}
                  ></iframe>
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

export default ContactPage;
