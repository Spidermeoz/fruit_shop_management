import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layout/Layout";
import Footer from "../../../components/client/layout/Footer";
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
    <Layout>
      {/* Header nhỏ */}
      <section className="bg-gradient-to-r from-green-100 to-yellow-100 py-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-10 w-16 h-16 bg-yellow-300 rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 right-10 w-12 h-12 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-green-800 mb-2">
          Liên hệ với chúng tôi
          </h1>
          <p className="text-gray-700">
            FreshFruits luôn sẵn sàng hỗ trợ bạn qua nhiều kênh liên hệ khác nhau. Hãy chọn cách thức phù hợp nhất để kết nối với chúng tôi!
          </p>
          <div className="flex items-center justify-center text-gray-600 mt-2">
            <Link to="/" className="hover:text-green-600 transition">
              Trang chủ
            </Link>
            <span className="mx-2">/</span>
            <span className="text-green-700">Liên hệ</span>
          </div>
        </div>
      </section>

      {/* Main Intro */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-yellow-50 py-14 md:py-20">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-60px] top-10 h-40 w-40 rounded-full bg-green-200/30 blur-3xl"></div>
          <div className="absolute right-[-40px] top-16 h-44 w-44 rounded-full bg-yellow-200/40 blur-3xl"></div>
          <div className="absolute bottom-[-40px] left-1/3 h-32 w-32 rounded-full bg-green-100/40 blur-2xl"></div>
        </div>

        <div className="container relative z-10 mx-auto px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
            {/* Left content */}
            <div className="lg:col-span-7">
              <div className="relative h-full overflow-hidden rounded-[28px] bg-white p-8 shadow-[0_10px_40px_rgba(0,0,0,0.06)] ring-1 ring-green-100 md:p-10">
                <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-yellow-100 opacity-70 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 h-36 w-36 -translate-x-8 translate-y-8 rounded-full bg-green-100 opacity-70 blur-2xl"></div>

                <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-700">
                      Hỗ trợ nhanh chóng
                    </span>
                    <span className="inline-flex rounded-full bg-yellow-100 px-4 py-1.5 text-sm font-semibold text-yellow-700">
                      Thân thiện & tận tâm
                    </span>
                  </div>

                  <h2 className="mt-5 max-w-3xl text-3xl font-bold leading-tight text-green-800 md:text-4xl md:leading-tight">
                    Liên hệ với {websiteName} theo cách{" "}
                    <span className="text-green-600">thuận tiện nhất</span> cho
                    bạn
                  </h2>

                  <p className="mt-5 max-w-2xl text-base leading-7 text-gray-700 md:text-lg">
                    Dù bạn cần tư vấn sản phẩm, hỗ trợ đơn hàng hay muốn kết nối
                    nhanh với cửa hàng, chúng tôi luôn sẵn sàng phản hồi qua các
                    kênh phù hợp nhất với thói quen của bạn.
                  </p>

                  {/* Highlights */}
                  <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-green-100 bg-green-50/80 p-4">
                      <p className="text-sm text-gray-500">Hỗ trợ</p>
                      <p className="mt-1 font-semibold text-green-800">
                        Sản phẩm & đơn hàng
                      </p>
                    </div>

                    <div className="rounded-2xl border border-yellow-100 bg-yellow-50/80 p-4">
                      <p className="text-sm text-gray-500">Phản hồi</p>
                      <p className="mt-1 font-semibold text-yellow-700">
                        Nhanh chóng, rõ ràng
                      </p>
                    </div>

                    <div className="rounded-2xl border border-green-100 bg-green-50/80 p-4">
                      <p className="text-sm text-gray-500">Kênh liên hệ</p>
                      <p className="mt-1 font-semibold text-green-800">
                        Facebook, Zalo, Email
                      </p>
                    </div>
                  </div>

                  {/* CTA buttons */}
                  <div className="mt-8 flex flex-wrap gap-4">
                    <Link
                      to="/products"
                      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-6 py-3.5 font-semibold text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      Khám phá sản phẩm
                    </Link>

                    <a
                      href={`tel:${phone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white px-6 py-3.5 font-semibold text-green-700 transition duration-300 hover:border-green-300 hover:bg-green-50"
                    >
                      Gọi ngay cho chúng tôi
                    </a>
                  </div>

                  {/* Quick trust row */}
                  <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>
                      Phản hồi trong giờ làm việc
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-yellow-500"></span>
                      Nhiều kênh liên hệ tiện lợi
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>
                      Hỗ trợ rõ ràng, dễ tiếp cận
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right action panel */}
            <div className="lg:col-span-5">
              <div className="grid h-full grid-cols-1 gap-4">
                {/* Phone card */}
                <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-7 w-7 text-green-600"
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

                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-500">Liên hệ trực tiếp</p>
                      <a
                        href={`tel:${phone.replace(/\s+/g, "")}`}
                        className="mt-1 block text-xl font-bold text-green-800 transition hover:text-green-600"
                      >
                        {phone}
                      </a>
                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        Phù hợp khi bạn cần hỗ trợ nhanh về đơn hàng hoặc sản
                        phẩm.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email card */}
                <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-7 w-7 text-yellow-600"
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

                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-500">Email hỗ trợ</p>
                      <a
                        href={`mailto:${email}`}
                        className="mt-1 block break-all text-lg font-bold text-green-800 transition hover:text-green-600"
                      >
                        {email}
                      </a>
                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        Thích hợp cho các nội dung cần mô tả chi tiết hơn.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Social action card */}
                <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-gray-100">
                  <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5 text-white">
                    <p className="text-sm text-white/85">
                      Kết nối nhanh qua mạng xã hội
                    </p>
                    <h3 className="mt-1 text-xl font-bold">
                      Chọn nền tảng bạn quen dùng nhất
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/85">
                      Nhắn tin trực tiếp qua Facebook hoặc Zalo để được hỗ trợ
                      thuận tiện hơn.
                    </p>
                  </div>

                  <div className="space-y-3 p-5">
                    {facebook && (
                      <a
                        href={facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between rounded-2xl px-4 py-3.5 text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
                        style={{ backgroundColor: "#1877F2" }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-5 w-5"
                            >
                              <path d="M14 8.998h3V5.998h-3c-2.757 0-5 2.243-5 5v2H6v3h3v6h3v-6h4l.6-3H12v-2c0-1.103.897-2 2-2z" />
                            </svg>
                          </span>

                          <div>
                            <p className="font-semibold">Facebook</p>
                            <p className="text-sm text-white/85">
                              Nhắn tin trên Facebook
                            </p>
                          </div>
                        </div>

                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </a>
                    )}

                    {zalo && (
                      <a
                        href={zalo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between rounded-2xl px-4 py-3.5 text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
                        style={{
                          background:
                            "linear-gradient(135deg, #0068FF 0%, #1E88FF 100%)",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white p-1.5 shadow-sm">
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg"
                              alt="Zalo"
                              className="h-7 w-7 object-contain"
                            />
                          </span>

                          <div>
                            <p className="font-semibold">Zalo</p>
                            <p className="text-sm text-white/90">
                              Trò chuyện nhanh trên Zalo
                            </p>
                          </div>
                        </div>

                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </a>
                    )}

                    {!facebook && !zalo && (
                      <div className="rounded-2xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                        Hiện chưa có liên kết Facebook hoặc Zalo để liên hệ trực
                        tiếp.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="py-14 md:py-16">
        <div className="container mx-auto px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-green-800">
              Tìm chúng tôi trên bản đồ
            </h2>
            <p className="mt-3 text-gray-600 leading-7">
              Bạn có thể ghé thăm hoặc tìm đường đến {websiteName} một cách dễ
              dàng thông qua bản đồ bên dưới.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-gray-100">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.828589098033!2d105.80698267503118!3d20.974101289646206!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135accf8ad3d6a7%3A0x3b3f4b5d6c7f01d1!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBUaMSDbmcgTG9uZw!5e0!3m2!1svi!2sVN!4v1710000000000!5m2!1svi!2sVN"
              width="100%"
              height="420"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`${websiteName} Location`}
            ></iframe>
          </div>
        </div>
      </section>

      <Footer />
    </Layout>
  );
};

export default ContactPage;
