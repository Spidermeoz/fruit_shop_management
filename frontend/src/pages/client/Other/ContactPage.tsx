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
  const [, setLoading] = useState(true);

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

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfc]">
      <Layout>
        {/* Banner Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-green-100/50 to-transparent py-12 text-center">
          <div className="container mx-auto relative z-10 px-4">
            {/* <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 mb-4 tracking-tight">
              Liên hệ với chúng tôi
            </h1>
            <p className="text-slate-600 max-w-2xl mx-auto font-medium mb-6">
              FreshFruits luôn sẵn sàng hỗ trợ bạn qua nhiều kênh liên hệ khác
              nhau. Hãy chọn cách thức phù hợp nhất để kết nối với chúng tôi!
            </p> */}
            <div className="flex items-center justify-center text-slate-500 text-sm md:text-base font-medium">
              <Link to="/" className="hover:text-green-600 transition-colors">
                Trang chủ
              </Link>
              <span className="mx-3 opacity-30">/</span>
              <span className="text-green-700">Liên hệ</span>
            </div>
          </div>
        </section>

        {/* Main Intro */}
        <section className="pb-20 pt-4 relative">
          {/* Background Blobs */}
          <div className="absolute top-20 left-0 w-72 h-72 bg-green-200/50 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-20 right-0 w-80 h-80 bg-yellow-100/60 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="container relative z-10 mx-auto px-4 lg:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-stretch">
              {/* Left content (Thông tin chính) */}
              <div className="lg:col-span-7">
                <div className="h-full bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_30px_80px_rgba(0,0,0,0.06)] border border-slate-50 relative overflow-hidden">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-green-700 border border-green-100">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                      </span>
                      Hỗ trợ nhanh chóng
                    </span>
                    <span className="inline-flex rounded-full bg-yellow-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-yellow-700 border border-yellow-100">
                      Thân thiện & Tận tâm
                    </span>
                  </div>

                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.15] mb-6">
                    Kết nối với {websiteName} <br />
                    theo cách{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                      thuận tiện nhất
                    </span>
                  </h2>

                  <p className="text-lg leading-relaxed text-slate-500 mb-10">
                    Dù bạn cần tư vấn sản phẩm, hỗ trợ đơn hàng hay muốn kết nối
                    nhanh với cửa hàng, chúng tôi luôn sẵn sàng phản hồi qua các
                    kênh phù hợp nhất với thói quen của bạn.
                  </p>

                  {/* Highlights (Dạng lưới Feature) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                    <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 transition-colors hover:bg-green-50/50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Hỗ trợ
                      </p>
                      <p className="font-bold text-slate-800">
                        Sản phẩm & <br />
                        Đơn hàng
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 transition-colors hover:bg-yellow-50/50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Phản hồi
                      </p>
                      <p className="font-bold text-slate-800">
                        Nhanh chóng & <br />
                        Rõ ràng
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 transition-colors hover:bg-blue-50/50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Kênh đa dạng
                      </p>
                      <p className="font-bold text-slate-800">
                        Facebook, Zalo, Email
                      </p>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-wrap gap-4">
                    <Link
                      to="/products"
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-8 py-4 font-bold text-white transition-all duration-300 hover:bg-green-700 hover:shadow-[0_15px_30px_rgba(34,197,94,0.3)] active:scale-95"
                    >
                      Khám phá sản phẩm
                    </Link>
                    <a
                      href={`tel:${phone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 font-bold text-slate-700 transition-all duration-300 hover:border-green-500 hover:text-green-600 active:scale-95"
                    >
                      Gọi ngay cho chúng tôi
                    </a>
                  </div>
                </div>
              </div>

              {/* Right action panel (Các thẻ liên lạc) */}
              <div className="lg:col-span-5 grid grid-cols-1 gap-6">
                {/* Khối Phone & Email gộp chung cho gọn gàng */}
                <div className="rounded-[2.5rem] bg-white p-4 shadow-[0_30px_80px_rgba(0,0,0,0.06)] border border-slate-50">
                  <div className="space-y-2">
                    {/* Phone */}
                    <div className="flex items-center gap-5 rounded-3xl p-5 transition-colors hover:bg-green-50">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg shadow-green-200">
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
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Hotline tư vấn
                        </p>
                        <a
                          href={`tel:${phone.replace(/\s+/g, "")}`}
                          className="block text-2xl font-black text-slate-900 hover:text-green-600 transition-colors"
                        >
                          {phone}
                        </a>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-5 rounded-3xl p-5 transition-colors hover:bg-yellow-50">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-500 text-white shadow-lg shadow-yellow-200">
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
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Email hỗ trợ
                        </p>
                        <a
                          href={`mailto:${email}`}
                          className="block break-all text-lg font-bold text-slate-900 hover:text-yellow-600 transition-colors"
                        >
                          {email}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Card (Nổi bật với dark mode) */}
                <div className="rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-xl shadow-slate-900/20">
                  <h3 className="text-2xl font-bold mb-2">Mạng xã hội</h3>
                  <p className="text-slate-400 text-sm font-medium mb-8">
                    Nhắn tin trực tiếp qua nền tảng quen thuộc để được hỗ trợ
                    thuận tiện hơn.
                  </p>

                  <div className="space-y-4">
                    {facebook && (
                      <a
                        href={facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 rounded-2xl bg-[#1877F2] py-4 font-bold transition-transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/30"
                      >
                        <svg
                          className="h-6 w-6 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Chat qua Facebook
                      </a>
                    )}

                    {zalo && (
                      <a
                        href={zalo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 rounded-2xl bg-[#0068FF] py-4 font-bold transition-transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/30"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[#0068FF] font-black text-[10px]">
                          Zalo
                        </div>
                        Nhắn tin Zalo
                      </a>
                    )}

                    {!facebook && !zalo && (
                      <div className="rounded-2xl bg-white/10 p-4 text-sm font-medium text-white/70 text-center">
                        Hiện chưa có liên kết mạng xã hội.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="pb-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-slate-900">
                  Tìm chúng tôi trên bản đồ
                </h2>
                <p className="mt-3 text-slate-500 font-medium">
                  Bạn có thể ghé thăm cửa hàng hoặc tìm đường đến {websiteName}{" "}
                  một cách dễ dàng.
                </p>
              </div>

              <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.06)] border border-slate-50 p-2 md:p-4">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.828589098033!2d105.80698267503118!3d20.974101289646206!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135accf8ad3d6a7%3A0x3b3f4b5d6c7f01d1!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBUaMSDbmcgTG9uZw!5e0!3m2!1svi!2sVN!4v1710000000000!5m2!1svi!2sVN"
                  width="100%"
                  height="460"
                  className="rounded-[2rem] border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`${websiteName} Location`}
                ></iframe>
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
