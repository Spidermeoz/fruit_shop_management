import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import Footer from "../../../components/client/layouts/Footer";

const FAQPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // --- DỮ LIỆU NHÓM CHỦ ĐỀ ---
  const categories = [
    {
      id: "all",
      label: "Tất cả câu hỏi",
      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    },
    {
      id: "dat-hang",
      label: "Đặt hàng",
      icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    },
    {
      id: "thanh-toan",
      label: "Thanh toán",
      icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    },
    {
      id: "giao-hang",
      label: "Giao hàng",
      icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
    },
    {
      id: "doi-tra",
      label: "Đổi trả",
      icon: "M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z",
    },
    {
      id: "san-pham",
      label: "Sản phẩm",
      icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
    },
    {
      id: "tai-khoan",
      label: "Tài khoản",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
  ];

  // --- DỮ LIỆU CÂU HỎI ---
  const faqs = [
    // Đặt hàng
    {
      id: 1,
      category: "dat-hang",
      q: "Làm thế nào để đặt hàng tại FreshFruits?",
      a: "Bạn chỉ cần lướt xem các sản phẩm, chọn số lượng và thêm vào giỏ hàng. Sau đó, tiến hành 'Thanh toán', điền thông tin địa chỉ giao nhận và xác nhận đơn hàng là xong.",
    },
    {
      id: 2,
      category: "dat-hang",
      q: "Tôi có cần tạo tài khoản để mua hàng không?",
      a: "Không bắt buộc. Bạn hoàn toàn có thể mua sắm với tư cách Khách vãng lai. Tuy nhiên, tạo tài khoản giúp bạn theo dõi đơn hàng và nhận ưu đãi dễ dàng hơn.",
    },
    {
      id: 3,
      category: "dat-hang",
      q: "Tôi có thể đặt hàng qua điện thoại không?",
      a: "Có, bạn có thể gọi trực tiếp đến Hotline 1900 8888 để được nhân viên CSKH hỗ trợ tạo đơn hàng nhanh chóng.",
    },
    // Thanh toán
    {
      id: 4,
      category: "thanh-toan",
      q: "FreshFruits hỗ trợ những hình thức thanh toán nào?",
      a: "Chúng tôi hỗ trợ thanh toán tiền mặt khi nhận hàng (COD), chuyển khoản ngân hàng, và thanh toán qua các loại thẻ tín dụng/ghi nợ (Visa, Mastercard, JCB).",
    },
    {
      id: 5,
      category: "thanh-toan",
      q: "Nếu thanh toán thẻ bị lỗi thì phải làm sao?",
      a: "Nếu giao dịch bị trừ tiền nhưng đơn hàng chưa được xác nhận, hệ thống sẽ tự động hoàn tiền trong vòng 24h. Hoặc bạn có thể liên hệ ngay Hotline để được hỗ trợ kiểm tra.",
    },
    // Giao hàng
    {
      id: 6,
      category: "giao-hang",
      q: "FreshFruits có giao hàng trong ngày không?",
      a: "Có. Với các đơn hàng trong khu vực nội thành đặt trước 16h00, chúng tôi cam kết giao hàng trong vòng 2-4 tiếng để đảm bảo độ tươi ngon nhất.",
    },
    {
      id: 7,
      category: "giao-hang",
      q: "Phí giao hàng được tính như thế nào?",
      a: "Phí giao hàng dao động từ 15.000đ - 35.000đ tùy khu vực. Đặc biệt, miễn phí giao hàng cho tất cả các đơn hàng có giá trị từ 500.000đ trở lên.",
    },
    // Đổi trả
    {
      id: 8,
      category: "doi-tra",
      q: "Tôi có thể đổi trả trái cây khi nào?",
      a: "Do đặc thù hàng tươi sống, FreshFruits chấp nhận đổi trả trong vòng 24 giờ kể từ lúc nhận hàng nếu trái cây bị dập nát, hư hỏng do vận chuyển hoặc chất lượng không đúng mô tả.",
    },
    {
      id: 9,
      category: "doi-tra",
      q: "Quy trình hoàn tiền diễn ra trong bao lâu?",
      a: "Ngay khi xác nhận yêu cầu trả hàng hợp lệ, FreshFruits sẽ tiến hành hoàn tiền vào tài khoản ngân hàng của bạn trong vòng 1-3 ngày làm việc.",
    },
    // Sản phẩm
    {
      id: 10,
      category: "san-pham",
      q: "Sản phẩm có nguồn gốc rõ ràng không?",
      a: "100% trái cây tại FreshFruits đều có giấy tờ kiểm định chất lượng, nguồn gốc xuất xứ rõ ràng từ các nông trại đạt chuẩn VietGAP, GlobalGAP hoặc nhập khẩu chính ngạch.",
    },
    // Tài khoản
    {
      id: 11,
      category: "tai-khoan",
      q: "Nếu quên mật khẩu thì phải làm sao?",
      a: "Bạn chỉ cần nhấn vào 'Quên mật khẩu' ở trang Đăng nhập, nhập email đã đăng ký. Hệ thống sẽ gửi một liên kết an toàn để bạn thiết lập lại mật khẩu mới.",
    },
  ];

  // --- LOGIC TÌM KIẾM & LỌC ---
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchCategory = activeTab === "all" || faq.category === activeTab;
      const matchSearch =
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [activeTab, searchQuery]);

  return (
    <Layout>
      <div className="bg-[#fcfdfc] min-h-screen text-slate-800 font-sans selection:bg-green-200 selection:text-green-900 pb-20 scroll-smooth">
        {/* ==================== 1. HERO SECTION ==================== */}
        <section className="relative overflow-hidden bg-gradient-to-b from-green-50 via-green-50/50 to-transparent pt-16 pb-32 text-center">
          {/* Decorative Background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green-200/30 rounded-[100%] blur-[100px] pointer-events-none -z-10"></div>

          <div className="container mx-auto px-4 relative z-10 max-w-4xl">
            {/* Breadcrumb */}
            <div className="flex items-center justify-center text-slate-500 text-sm font-medium mb-6">
              <Link to="/" className="hover:text-green-600 transition-colors">
                Trang chủ
              </Link>
              <span className="mx-3 opacity-40">/</span>
              <span className="text-green-700 font-bold">
                Hỗ trợ khách hàng
              </span>
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
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              Câu hỏi{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                Thường gặp
              </span>
            </h1>
            <p className="text-slate-500 font-medium text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
              FreshFruits tổng hợp những thắc mắc phổ biến nhất để giúp hành
              trình mua sắm trái cây của bạn trở nên nhanh chóng và dễ dàng.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 lg:px-8 -mt-24 relative z-20">
          {/* ==================== 2. THANH TÌM KIẾM ==================== */}
          <div className="max-w-3xl mx-auto bg-white rounded-[2rem] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-50 mb-12 flex items-center">
            <div className="pl-4 pr-2 text-green-600">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm câu hỏi về giao hàng, thanh toán, đổi trả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none py-3 px-2 text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-0 text-base md:text-lg"
            />
            <button className="hidden sm:block bg-green-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-green-700 transition-all shadow-md shadow-green-200 active:scale-95">
              Tìm kiếm
            </button>
          </div>

          {/* ==================== 3 & 4. DANH MỤC & CÂU HỎI ==================== */}
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-10 lg:gap-16 mb-20">
            {/* Cột trái: Filter Category */}
            <aside className="md:w-1/3">
              <div className="sticky top-24 bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-4 pt-2">
                  Nhóm chủ đề
                </h3>
                <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 custom-scrollbar">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveTab(cat.id);
                        setActiveFaq(null);
                      }}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all whitespace-nowrap md:whitespace-normal text-left ${
                        activeTab === cat.id
                          ? "bg-green-600 text-white shadow-md shadow-green-200"
                          : "text-slate-600 hover:bg-green-50 hover:text-green-700"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={cat.icon}
                        />
                      </svg>
                      {cat.label}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Cột phải: Accordion List */}
            <main className="md:w-2/3">
              {filteredFaqs.length > 0 ? (
                <div className="space-y-4">
                  {filteredFaqs.map((faq) => (
                    <div
                      key={faq.id}
                      className={`bg-white rounded-[1.5rem] border transition-all duration-300 overflow-hidden ${
                        activeFaq === faq.id
                          ? "border-green-300 shadow-[0_10px_30px_rgba(22,101,52,0.08)]"
                          : "border-slate-100 shadow-sm hover:border-green-200"
                      }`}
                    >
                      <button
                        onClick={() =>
                          setActiveFaq(activeFaq === faq.id ? null : faq.id)
                        }
                        className="w-full text-left px-6 py-5 flex items-center justify-between font-bold text-slate-800 focus:outline-none group"
                      >
                        <span className="pr-4 text-lg group-hover:text-green-700 transition-colors">
                          {faq.q}
                        </span>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            activeFaq === faq.id
                              ? "bg-green-600 text-white shadow-md"
                              : "bg-slate-50 text-slate-400 group-hover:bg-green-100 group-hover:text-green-600"
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 transform transition-transform duration-300 ${activeFaq === faq.id ? "rotate-45" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </div>
                      </button>
                      <div
                        className={`transition-all duration-300 ease-in-out ${
                          activeFaq === faq.id
                            ? "max-h-96 opacity-100 pb-6"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        <p className="px-6 text-slate-600 font-medium text-[15px] leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center bg-white rounded-[2rem] border border-slate-100 p-12 shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-10 h-10"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      ></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    Không tìm thấy câu hỏi
                  </h3>
                  <p className="text-slate-500 font-medium">
                    Thử điều chỉnh từ khóa tìm kiếm hoặc chọn danh mục khác nhé.
                  </p>
                </div>
              )}
            </main>
          </div>

          {/* ==================== 5. SECTION CAM KẾT HỖ TRỢ ==================== */}
          <section className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 mb-20">
            <div className="bg-green-50 rounded-[2rem] p-8 text-center border border-green-100">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-green-600 mx-auto mb-4 shadow-sm">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  ></path>
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">
                Hỗ trợ nhanh chóng
              </h3>
              <p className="text-slate-500 text-sm font-medium">
                Luôn phản hồi yêu cầu của bạn trong thời gian sớm nhất.
              </p>
            </div>
            <div className="bg-orange-50 rounded-[2rem] p-8 text-center border border-orange-100">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-orange-500 mx-auto mb-4 shadow-sm">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  ></path>
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">
                Thông tin minh bạch
              </h3>
              <p className="text-slate-500 text-sm font-medium">
                Mọi chính sách đều rõ ràng, bảo vệ quyền lợi khách hàng.
              </p>
            </div>
            <div className="bg-blue-50 rounded-[2rem] p-8 text-center border border-blue-100">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-500 mx-auto mb-4 shadow-sm">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  ></path>
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Mua sắm an tâm</h3>
              <p className="text-slate-500 text-sm font-medium">
                Cam kết chất lượng trên từng giỏ trái cây tươi giao đến bạn.
              </p>
            </div>
          </section>

          {/* ==================== 6. SECTION LIÊN HỆ THÊM ==================== */}
          <section className="max-w-4xl mx-auto text-center border-t border-slate-100 pt-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Chưa tìm thấy thông tin bạn cần?
            </h2>
            <p className="text-slate-500 font-medium mb-8 max-w-xl mx-auto">
              Đừng lo lắng! Đội ngũ chăm sóc khách hàng của FreshFruits luôn sẵn
              sàng lắng nghe và hỗ trợ bạn mọi lúc.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-sm active:scale-95"
              >
                Liên hệ với chúng tôi
              </Link>
              <Link
                to="/return-policy"
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-700 border-2 border-slate-100 rounded-xl font-bold hover:border-green-500 hover:text-green-600 transition-all active:scale-95"
              >
                Xem chính sách đổi trả
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </Layout>
  );
};

export default FAQPage;
