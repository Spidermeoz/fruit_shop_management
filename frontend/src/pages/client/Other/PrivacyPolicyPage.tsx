import React, { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import Footer from "../../../components/client/layouts/Footer";

const PrivacyPolicyPage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // --- DỮ LIỆU TÓM TẮT ---
  const summaryCards = [
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      ),
      title: "Bảo mật tuyệt đối",
      desc: "Dữ liệu của bạn được mã hóa và lưu trữ an toàn trên hệ thống của chúng tôi.",
    },
    {
      icon: (
        <>
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
        </>
      ),
      title: "Minh bạch thông tin",
      desc: "Luôn thông báo rõ ràng về mục đích thu thập và cách thức sử dụng dữ liệu.",
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      ),
      title: "Không chia sẻ trái phép",
      desc: "Tuyệt đối không mua bán hay trao đổi thông tin cá nhân với bên thứ ba.",
    },
  ];

  // --- DỮ LIỆU NỘI DUNG CHÍNH SÁCH ---
  const policySections = [
    {
      id: "muc-dich",
      title: "1. Mục đích thu thập thông tin",
      content:
        "FreshFruits thu thập thông tin cá nhân chủ yếu để xử lý đơn hàng, giao trái cây đến tận tay bạn một cách nhanh chóng nhất. Ngoài ra, thông tin này giúp chúng tôi hỗ trợ giải đáp thắc mắc, gửi thông báo về trạng thái đơn hàng và các chương trình ưu đãi đặc biệt (nếu bạn đồng ý nhận).",
    },
    {
      id: "pham-vi",
      title: "2. Phạm vi thu thập thông tin",
      content:
        "Chúng tôi chỉ thu thập những thông tin thực sự cần thiết, bao gồm: Họ và tên, Số điện thoại, Email, Địa chỉ giao hàng và Lịch sử mua hàng. Mọi thông tin thanh toán qua thẻ/ngân hàng đều được xử lý bởi cổng thanh toán đối tác chuẩn quốc tế, FreshFruits không trực tiếp lưu trữ số thẻ của bạn.",
    },
    {
      id: "cach-su-dung",
      title: "3. Cách sử dụng thông tin",
      content:
        "Thông tin của bạn được sử dụng trong nội bộ FreshFruits để cải thiện chất lượng dịch vụ. Chúng tôi phân tích xu hướng mua sắm để mang đến những loại trái cây phù hợp theo mùa mà bạn có thể sẽ yêu thích, đồng thời nâng cấp trải nghiệm giao diện website.",
    },
    {
      id: "thoi-gian",
      title: "4. Thời gian lưu trữ",
      content:
        "Dữ liệu cá nhân của khách hàng sẽ được lưu trữ an toàn trên máy chủ của FreshFruits cho đến khi khách hàng có yêu cầu hủy bỏ hoặc tự đăng nhập và thực hiện thao tác xóa tài khoản.",
    },
    {
      id: "tiep-can",
      title: "5. Những ai có thể tiếp cận thông tin",
      content:
        "Chỉ những nhân viên được ủy quyền của FreshFruits mới có quyền tiếp cận thông tin này. Trong quá trình giao hàng, chúng tôi bắt buộc phải cung cấp Tên, Số điện thoại và Địa chỉ cho Đơn vị vận chuyển đối tác để họ thực hiện việc giao nhận.",
    },
    {
      id: "cam-ket",
      title: "6. Cam kết bảo mật",
      content:
        "Chúng tôi áp dụng các biện pháp kỹ thuật và an ninh chuẩn quốc tế (như chứng chỉ SSL) để ngăn chặn truy cập trái phép hoặc việc rò rỉ dữ liệu. Việc bảo vệ thông tin của bạn là ưu tiên hàng đầu.",
    },
    {
      id: "quyen-loi",
      title: "7. Quyền lợi của khách hàng",
      content:
        "Bạn hoàn toàn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa bỏ thông tin cá nhân của mình bất cứ lúc nào thông qua trang 'Hồ sơ của tôi'. Nếu gặp khó khăn, đội ngũ CSKH luôn sẵn sàng hỗ trợ bạn thực hiện điều này.",
    },
    {
      id: "cookies",
      title: "8. Cookies và công nghệ theo dõi",
      content:
        "Website FreshFruits sử dụng Cookies để ghi nhớ giỏ hàng và tùy chọn của bạn cho những lần truy cập sau, giúp bạn không phải nhập lại thông tin. Bạn có thể tắt Cookies trong cài đặt trình duyệt nếu muốn.",
    },
    {
      id: "thay-doi",
      title: "9. Thay đổi chính sách",
      content:
        "FreshFruits có quyền thay đổi chính sách bảo mật này để phù hợp với pháp luật và dịch vụ. Mọi thay đổi lớn sẽ được thông báo rõ ràng trên website hoặc qua email trước khi áp dụng.",
    },
    {
      id: "lien-he",
      title: "10. Thông tin liên hệ",
      content:
        "Nếu bạn có bất kỳ câu hỏi hay mối quan ngại nào về quyền riêng tư, vui lòng liên hệ với chúng tôi qua Email: privacy@freshfruits.vn hoặc Hotline: 1900 8888. Chúng tôi cam kết phản hồi trong vòng 24 giờ làm việc.",
    },
  ];

  // --- DỮ LIỆU FAQ ---
  const faqs = [
    {
      q: "FreshFruits có bán thông tin của tôi cho các bên quảng cáo không?",
      a: "Tuyệt đối không. FreshFruits cam kết không bao giờ bán, trao đổi hay chia sẻ trái phép thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại.",
    },
    {
      q: "Tôi có thể yêu cầu xóa hoàn toàn tài khoản và dữ liệu không?",
      a: "Có. Bạn có quyền yêu cầu xóa bỏ hoàn toàn dữ liệu. Bạn có thể thực hiện trong phần Cài đặt tài khoản hoặc gửi email yêu cầu đến bộ phận CSKH của chúng tôi.",
    },
    {
      q: "Thông tin thẻ tín dụng của tôi có được lưu lại không?",
      a: "FreshFruits không lưu trữ thông tin thẻ tín dụng của bạn. Quá trình thanh toán được mã hóa và xử lý trực tiếp bởi các cổng thanh toán uy tín và tuân thủ tiêu chuẩn bảo mật PCI-DSS.",
    },
  ];

  return (
    <Layout>
      <div className="bg-[#fcfdfc] min-h-screen text-slate-800 font-sans selection:bg-green-200 selection:text-green-900 pb-20 scroll-smooth">
        {/* ==================== 1. HERO SECTION ==================== */}
        <section className="relative overflow-hidden bg-gradient-to-b from-green-50 to-transparent pt-16 pb-20 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green-200/30 rounded-[100%] blur-[100px] pointer-events-none -z-10"></div>

          <div className="container mx-auto px-4 relative z-10 max-w-4xl">
            {/* Breadcrumb */}
            <div className="flex items-center justify-center text-slate-500 text-sm font-medium mb-6">
              <Link to="/" className="hover:text-green-600 transition-colors">
                Trang chủ
              </Link>
              <span className="mx-3 opacity-40">/</span>
              <span className="text-green-700 font-bold">
                Chính sách bảo mật
              </span>
            </div>

            {/* Icon minh họa */}
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              Chính sách{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                Bảo mật
              </span>
            </h1>
            <p className="text-slate-500 font-medium text-lg md:text-xl leading-relaxed">
              Tại FreshFruits, chúng tôi hiểu rằng sự an tâm của bạn quan trọng
              không kém chất lượng của những giỏ trái cây tươi. Chúng tôi cam
              kết tôn trọng và bảo vệ thông tin cá nhân của bạn một cách tuyệt
              đối.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 lg:px-8 -mt-8">
          {/* ==================== 2. SUMMARY CARDS ==================== */}
          <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 relative z-20">
            {summaryCards.map((card, idx) => (
              <div
                key={idx}
                className="bg-white rounded-[2rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-50 hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {card.icon}
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {card.title}
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">
                  {card.desc}
                </p>
              </div>
            ))}
          </section>

          {/* ==================== 3 & 4. MAIN CONTENT & TOC ==================== */}
          <section className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 mb-20">
            {/* 4. Table of Contents (Sticky Sidebar) */}
            <aside className="lg:w-1/3 hidden lg:block">
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 sticky top-24">
                <h3 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                  Nội dung chính
                </h3>
                <nav className="space-y-1.5">
                  {policySections.map((sec) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="block px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-green-50 hover:text-green-700 transition-colors"
                    >
                      {sec.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* 3. Policy Content Sections */}
            <main className="lg:w-2/3">
              <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.02)] border border-slate-50">
                <div className="space-y-12">
                  {policySections.map((sec) => (
                    <div key={sec.id} id={sec.id} className="scroll-mt-32">
                      <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 flex items-start gap-3">
                        <span className="text-green-500 mt-1">
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
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </span>
                        {sec.title}
                      </h2>
                      <p className="text-slate-600 font-medium leading-relaxed pl-9 text-[15px]">
                        {sec.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </section>

          {/* ==================== 5. BRAND COMMITMENT ==================== */}
          <section className="max-w-5xl mx-auto bg-gradient-to-br from-green-500 to-emerald-700 rounded-[3rem] p-10 md:p-16 text-center shadow-2xl mb-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leaves.png')] opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 text-white">
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
                    d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                  />
                </svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                Sự tin tưởng của bạn là tài sản lớn nhất
              </h2>
              <p className="text-green-50 text-lg md:text-xl font-medium max-w-3xl mx-auto leading-relaxed">
                Tại FreshFruits, chúng tôi không chỉ giao đi những loại quả tươi
                ngon, mà còn trao đi sự an tâm. Mọi dữ liệu của bạn đều được mã
                hóa, bảo vệ nghiêm ngặt và xử lý minh bạch.
              </p>
            </div>
          </section>

          {/* ==================== 6. FAQ ==================== */}
          <section className="max-w-4xl mx-auto mb-20">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-slate-900 mb-4">
                Câu hỏi thường gặp
              </h2>
              <p className="text-slate-500 font-medium">
                Giải đáp nhanh những thắc mắc về quyền riêng tư của bạn.
              </p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-[1.5rem] border transition-all duration-300 ${activeFaq === idx ? "border-green-300 shadow-md" : "border-slate-100 shadow-sm hover:border-green-200"}`}
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between font-bold text-slate-800 focus:outline-none"
                  >
                    <span className="pr-4">{faq.q}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 text-green-500 transform transition-transform duration-300 shrink-0 ${activeFaq === idx ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <div
                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${activeFaq === idx ? "max-h-40 pb-5 opacity-100" : "max-h-0 opacity-0"}`}
                  >
                    <p className="text-slate-600 font-medium text-sm md:text-base leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ==================== 7. CTA CUỐI TRANG ==================== */}
          <section className="max-w-4xl mx-auto text-center border-t border-slate-100 pt-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Bạn vẫn còn thắc mắc?
            </h2>
            <p className="text-slate-500 font-medium mb-8 max-w-xl mx-auto">
              Nếu bạn có bất kỳ câu hỏi nào về quyền riêng tư và dữ liệu cá
              nhân, đội ngũ FreshFruits luôn sẵn sàng lắng nghe và hỗ trợ bạn.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-sm active:scale-95"
              >
                Liên hệ ngay
              </Link>
              <Link
                to="/terms"
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-700 border-2 border-slate-100 rounded-xl font-bold hover:border-green-500 hover:text-green-600 transition-all active:scale-95"
              >
                Điều khoản sử dụng
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </Layout>
  );
};

export default PrivacyPolicyPage;
