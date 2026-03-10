import React from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layout/Layout";
import Footer from "../../../components/client/layout/Footer";

const ContactPage: React.FC = () => {
  const contactInfo = [
    {
      title: "Địa chỉ",
      content: "Đại học Thăng Long, Nghiêm Xuân Yêm, Hà Nội",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-green-600"
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
      ),
    },
    {
      title: "Email",
      content: "Test@gmail.com",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-green-600"
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
      ),
    },
    {
      title: "Điện thoại",
      content: "01234 567 890",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-green-600"
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
      ),
    },
  ];

  const workingHours = [
    { day: "Thứ Hai - Thứ Sáu", hours: "8:00 - 18:00" },
    { day: "Thứ Bảy", hours: "8:00 - 17:00" },
    { day: "Chủ Nhật", hours: "9:00 - 16:00" },
  ];

  return (
    <Layout>
      {/* Header nhỏ */}
      <section className="bg-gradient-to-r from-green-100 to-yellow-100 py-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-10 w-16 h-16 bg-yellow-300 rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 right-10 w-12 h-12 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-green-800 mb-2">Liên hệ</h1>
          <p className="text-gray-700">
            Chúng tôi luôn sẵn sàng lắng nghe từ bạn
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

      <div className="container mx-auto px-6 py-10">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Chat Options */}
          <div>
            <h2 className="text-2xl font-bold text-green-800 mb-6">
              Kết nối với chúng tôi
            </h2>
            <p className="text-gray-600 mb-8">
              Chọn nền tảng bạn muốn để trò chuyện trực tiếp với chúng tôi.
              Chúng tôi sẽ phản hồi nhanh nhất có thể!
            </p>

            <div className="space-y-4">
              {/* Messenger Button */}
              <a
                href="https://www.facebook.com/spd.meow.0502"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 hover:opacity-90 text-white py-4 px-6 rounded-xl font-semibold shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6 mr-3"
                  >
                    <path d="M12 2C6.477 2 2 6.145 2 11.265c0 2.912 1.472 5.507 3.771 7.203V22l3.356-1.842c.893.247 1.84.38 2.873.38 5.523 0 10-4.145 10-9.273S17.523 2 12 2zm1.06 12.445l-2.548-2.718-4.86 2.718 5.346-5.67 2.59 2.718 4.818-2.718-5.346 5.67z" />
                  </svg>

                  <span>Chat qua Messenger</span>
                </div>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
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

              {/* Zalo Button */}
              <a
                href="https://zalo.me/0967004916"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full bg-[#0068FF] hover:bg-[#0050d4] text-white py-4 px-6 rounded-xl font-semibold shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg"
                    alt="Zalo"
                    className="w-6 h-6 mr-3"
                  />

                  <span>Chat qua Zalo</span>
                </div>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
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
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Lưu ý:</strong> Bạn sẽ được chuyển hướng đến ứng dụng
                tương ứng để bắt đầu cuộc trò chuyện. Đảm bảo bạn đã cài đặt ứng
                dụng trên thiết bị của mình.
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold text-green-800 mb-6">
              Thông tin liên hệ
            </h2>

            <div className="space-y-6 mb-8">
              {contactInfo.map((info, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 mr-4">{info.icon}</div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-1">
                      {info.title}
                    </h3>
                    <p className="text-gray-600">{info.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Giờ làm việc
              </h3>
              <div className="space-y-2">
                {workingHours.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600">{item.day}:</span>
                    <span className="text-gray-800 font-medium">
                      {item.hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Theo dõi chúng tôi
              </h3>
              <div className="flex space-x-4">
                <a
                  href="https://github.com/Spidermeoz/fruit_shop_management"
                  className="hover:text-green-300 transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.83 9.504.475.083.677-.217.677-.484 0-.233-.007-.867-.011-1.702-2.782.607-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.004.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.931 0-1.088.39-1.979 1.029-2.679-.103-.253-.446-1.266.098-2.64 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 5.042c.847.009 1.682.115 2.477.332 1.91-1.296 2.747-1.026 2.747-1.026.546 1.373.202 2.387.099 2.64.64.7 1.028 1.591 1.028 2.679 0 3.829-2.336 4.673-4.565 4.92.359.307.678.915.678 1.846 0 1.338-.012 2.419-.012 2.747 0 .268.201.576.682.483C19.136 20.217 22 16.46 22 12.017 22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-green-800 mb-6 text-center">
            Tìm chúng tôi trên bản đồ
          </h2>
          <div className="rounded-lg overflow-hidden shadow-md h-96">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.5308226326!2d106.69517201482196!3d10.776769992337734!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f5b5f9c5e1f%3A0xb7b0b5c5f5f5f5f!2zMTIzIER1b8gbmcgVHLDoGkgQ8OyYSwgU-G7k4BUgMSwgU-G7rSDEsIFRQLiBIw7JpIE3hu4buNaA!5e0!3m2!1svi!2sVN!4v1688424976404!5m2!1svi!2sVN!4v1688424976404"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="FreshFruits Location"
            ></iframe>
          </div>
        </div>
      </div>
      <Footer></Footer>
    </Layout>
  );
};

export default ContactPage;
