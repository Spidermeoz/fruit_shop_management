import React, { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import Footer from "../../../components/client/layouts/Footer";

const TermsOfUsePage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // --- DỮ LIỆU TÓM TẮT ---
  const summaryCards = [
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
        />
      ),
      title: "Môi trường minh bạch",
      desc: "Mọi quy định được xây dựng nhằm tạo ra không gian mua sắm rõ ràng, công bằng cho tất cả khách hàng.",
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
        />
      ),
      title: "Tôn trọng quyền lợi",
      desc: "FreshFruits luôn đặt quyền lợi và trải nghiệm của người tiêu dùng lên hàng đầu trong mọi quyết định.",
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      ),
      title: "Tuân thủ quy định",
      desc: "Việc tuân thủ các điều khoản giúp bảo vệ chính bạn và cộng đồng khách hàng của FreshFruits.",
    },
  ];

  // --- DỮ LIỆU ĐIỀU KHOẢN (14 Mục) ---
  const termsSections = [
    {
      id: "gioi-thieu",
      title: "1. Giới thiệu chung",
      content:
        "Chào mừng bạn đến với website mua sắm trực tuyến FreshFruits. Khi truy cập và sử dụng website này, bạn đồng ý tuân thủ các điều khoản và điều kiện được quy định dưới đây. Xin vui lòng đọc kỹ trước khi tiến hành mua sắm.",
    },
    {
      id: "pham-vi",
      title: "2. Phạm vi áp dụng",
      content:
        "Điều khoản này áp dụng cho mọi cá nhân, tổ chức truy cập, xem thông tin hoặc đặt mua sản phẩm trái cây và dịch vụ do FreshFruits cung cấp trên nền tảng website.",
    },
    {
      id: "quyen-trach-nhiem-user",
      title: "3. Quyền và trách nhiệm của khách hàng",
      content:
        "Bạn có quyền xem thông tin, đặt hàng và nhận hỗ trợ từ FreshFruits. Tuy nhiên, bạn cần cung cấp thông tin liên hệ và địa chỉ chính xác để đảm bảo việc giao nhận diễn ra suôn sẻ.",
      highlight: {
        type: "warning",
        text: "Khách hàng vui lòng chịu trách nhiệm về tính chính xác của các thông tin cá nhân cung cấp cho FreshFruits để tránh rủi ro thất lạc đơn hàng.",
      },
    },
    {
      id: "quyen-trach-nhiem-freshfruits",
      title: "4. Quyền và trách nhiệm của FreshFruits",
      content:
        "Chúng tôi cam kết cung cấp trái cây tươi ngon, đúng chất lượng mô tả và bảo vệ dữ liệu khách hàng. FreshFruits có quyền từ chối phục vụ hoặc hủy đơn hàng nếu phát hiện dấu hiệu gian lận hoặc vi phạm chính sách.",
    },
    {
      id: "tai-khoan",
      title: "5. Quy định về tài khoản",
      content:
        "Bạn có thể mua hàng dưới dạng khách vãng lai hoặc đăng ký tài khoản. Khi tạo tài khoản, bạn có trách nhiệm bảo mật mật khẩu của mình. FreshFruits không chịu trách nhiệm cho những thiệt hại phát sinh từ việc bạn để lộ thông tin đăng nhập.",
    },
    {
      id: "san-pham-gia",
      title: "6. Quy định về sản phẩm và giá bán",
      content:
        "Mọi nỗ lực đều được thực hiện để hiển thị hình ảnh và thông tin sản phẩm chính xác nhất. Giá bán có thể thay đổi tùy theo mùa vụ và tình hình thị trường nông sản mà không cần báo trước.",
      highlight: {
        type: "info",
        text: "FreshFruits bảo lưu quyền cập nhật giá cả và điều chỉnh các chương trình khuyến mãi cho phù hợp với thực tế nguồn cung trái cây tại từng thời điểm.",
      },
    },
    {
      id: "dat-hang-thanh-toan",
      title: "7. Quy trình đặt hàng và thanh toán",
      content:
        "Đơn hàng của bạn sẽ được xác nhận qua email hoặc điện thoại. Chúng tôi hỗ trợ nhiều hình thức thanh toán (COD, Chuyển khoản, Thẻ). Giao dịch chỉ hoàn tất khi chúng tôi xác nhận đã nhận được thanh toán đối với các đơn hàng trả trước.",
    },
    {
      id: "giao-hang",
      title: "8. Chính sách giao hàng",
      content:
        "Trái cây là mặt hàng tươi sống cần bảo quản đặc biệt, do đó thời gian và phạm vi giao hàng sẽ được giới hạn tại một số khu vực nhất định để đảm bảo chất lượng quả tốt nhất khi đến tay bạn.",
    },
    {
      id: "doi-tra",
      title: "9. Chính sách đổi trả và hoàn tiền",
      content:
        "Nếu sản phẩm bị dập nát, hỏng hóc trong quá trình vận chuyển hoặc không đúng mô tả, bạn có quyền yêu cầu đổi trả hoặc hoàn tiền trong vòng 24 giờ kể từ khi nhận hàng. Vui lòng cung cấp hình ảnh minh chứng để chúng tôi xử lý nhanh chóng.",
    },
    {
      id: "hanh-vi-cam",
      title: "10. Hành vi bị nghiêm cấm",
      content:
        "Bạn không được phép sử dụng website cho các mục đích lừa đảo, phát tán mã độc, can thiệp vào hệ thống dữ liệu, hoặc sao chép hình ảnh/nội dung của FreshFruits phục vụ mục đích thương mại trái phép.",
      highlight: {
        type: "error",
        text: "Mọi hành vi gian lận thanh toán, tạo đơn hàng giả mạo hoặc phá hoại hệ thống sẽ bị FreshFruits vô hiệu hóa tài khoản vĩnh viễn và có thể nhờ pháp luật can thiệp nếu gây thiệt hại lớn.",
      },
    },
    {
      id: "gioi-han-trach-nhiem",
      title: "11. Giới hạn trách nhiệm",
      content:
        "FreshFruits không chịu trách nhiệm về những thiệt hại gián tiếp phát sinh từ việc sử dụng hoặc không thể sử dụng website do lỗi đường truyền mạng hoặc các sự cố bất khả kháng (thiên tai, dịch bệnh).",
    },
    {
      id: "thay-doi-dieu-khoan",
      title: "12. Quyền thay đổi nội dung",
      content:
        "Chúng tôi có quyền chỉnh sửa, cập nhật bất kỳ phần nào của Điều khoản sử dụng này vào bất kỳ lúc nào. Việc bạn tiếp tục sử dụng website sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận những cập nhật đó.",
    },
    {
      id: "bao-mat",
      title: "13. Bảo mật thông tin",
      content:
        "Việc thu thập và sử dụng dữ liệu cá nhân của bạn tuân thủ chặt chẽ theo 'Chính sách bảo mật' của chúng tôi. Vui lòng tham khảo thêm trang Chính sách bảo mật để hiểu rõ hơn.",
    },
    {
      id: "lien-he",
      title: "14. Liên hệ hỗ trợ",
      content:
        "Nếu có bất kỳ thắc mắc nào liên quan đến các điều khoản trên, đừng ngần ngại liên hệ với chúng tôi qua hotline hoặc email. FreshFruits luôn sẵn sàng lắng nghe và giải quyết thỏa đáng.",
    },
  ];

  // --- DỮ LIỆU FAQ ---
  const faqs = [
    {
      q: "Tôi có bắt buộc phải tạo tài khoản để đặt hàng không?",
      a: "Không bắt buộc. Bạn hoàn toàn có thể đặt mua trái cây với tư cách 'Khách vãng lai'. Tuy nhiên, việc tạo tài khoản sẽ giúp bạn theo dõi đơn hàng dễ dàng hơn và tích lũy điểm thưởng cho các lần mua sau.",
    },
    {
      q: "FreshFruits có quyền thay đổi giá sản phẩm không?",
      a: "Có. Trái cây là mặt hàng có tính thời vụ cao. Do đó, giá sản phẩm có thể thay đổi tùy theo mùa vụ và nguồn cung. Tuy nhiên, giá trị đơn hàng của bạn sẽ được giữ cố định tại thời điểm bạn nhấn nút đặt hàng thành công.",
    },
    {
      q: "Tôi có thể hủy đơn hàng sau khi đã đặt không?",
      a: "Bạn có thể hủy đơn hàng nếu trạng thái đơn hàng đang là 'Chờ xác nhận'. Vui lòng liên hệ ngay với Hotline của chúng tôi để được hỗ trợ hủy đơn trước khi hàng được giao cho đơn vị vận chuyển.",
    },
    {
      q: "Làm sao để tôi biết điều khoản sử dụng đã được cập nhật?",
      a: "Khi có những thay đổi quan trọng về điều khoản sử dụng, FreshFruits sẽ hiển thị thông báo trên trang chủ hoặc gửi email trực tiếp cho những khách hàng đã đăng ký tài khoản.",
    },
  ];

  // Helper render Highlight box
  const renderHighlight = (highlight: { type: string; text: string }) => {
    if (highlight.type === "warning") {
      return (
        <div className="mt-4 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex gap-3">
          <svg
            className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            ></path>
          </svg>
          <p className="text-amber-800 text-sm font-medium">{highlight.text}</p>
        </div>
      );
    }
    if (highlight.type === "info") {
      return (
        <div className="mt-4 bg-sky-50 border-l-4 border-sky-500 p-4 rounded-r-xl flex gap-3">
          <svg
            className="w-5 h-5 text-sky-500 shrink-0 mt-0.5"
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
          <p className="text-sky-800 text-sm font-medium">{highlight.text}</p>
        </div>
      );
    }
    if (highlight.type === "error") {
      return (
        <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex gap-3">
          <svg
            className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            ></path>
          </svg>
          <p className="text-red-800 text-sm font-medium">{highlight.text}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="bg-[#fcfdfc] min-h-screen text-slate-800 font-sans selection:bg-green-200 selection:text-green-900 pb-20 scroll-smooth">
        {/* ==================== 1. HERO SECTION ==================== */}
        <section className="relative overflow-hidden bg-gradient-to-b from-green-50 via-yellow-50/30 to-transparent pt-16 pb-20 text-center">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-200/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-yellow-200/20 rounded-full blur-[100px] pointer-events-none -z-10"></div>

          <div className="container mx-auto px-4 relative z-10 max-w-4xl">
            {/* Breadcrumb */}
            <div className="flex items-center justify-center text-slate-500 text-sm font-medium mb-6">
              <Link to="/" className="hover:text-green-600 transition-colors">
                Trang chủ
              </Link>
              <span className="mx-3 opacity-40">/</span>
              <span className="text-green-700 font-bold">
                Điều khoản sử dụng
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              Điều khoản{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                Sử dụng
              </span>
            </h1>
            <p className="text-slate-500 font-medium text-lg md:text-xl leading-relaxed">
              Vui lòng đọc kỹ các điều khoản dưới đây để hiểu rõ quyền lợi và
              trách nhiệm của bạn, giúp hành trình mua sắm trái cây tươi tại
              FreshFruits trở nên trọn vẹn nhất.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 lg:px-8 -mt-8">
          {/* ==================== 2. QUICK SUMMARY CARDS ==================== */}
          <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 relative z-20">
            {summaryCards.map((card, idx) => (
              <div
                key={idx}
                className="bg-white rounded-[2rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col items-center text-center hover:border-green-100 transition-colors duration-300"
              >
                <div className="w-14 h-14 bg-green-50 rounded-[1.2rem] flex items-center justify-center text-green-600 mb-5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {card.icon}
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </section>

          {/* ==================== 3 & 4. MAIN CONTENT & TOC ==================== */}
          <section className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 mb-20">
            {/* 3. Table of Contents (Sticky Sidebar for Desktop) */}
            <aside className="lg:w-1/4 hidden lg:block">
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 sticky top-24">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-green-600"
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
                  Nội dung quy định
                </h3>
                <nav className="space-y-1 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                  {termsSections.map((sec) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="block px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-500 hover:bg-green-50 hover:text-green-700 transition-colors"
                    >
                      {sec.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* 4. Policy Content Sections */}
            <main className="lg:w-3/4">
              <div className="bg-white rounded-[2.5rem] p-6 md:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.02)] border border-slate-50">
                <div className="space-y-10">
                  {termsSections.map((sec) => (
                    <div
                      key={sec.id}
                      id={sec.id}
                      className="scroll-mt-32 relative"
                    >
                      {/* Thêm nét đứt trang trí bên trái */}
                      <div className="absolute left-0 top-2 bottom-0 w-1 bg-gradient-to-b from-green-100 to-transparent rounded-full hidden md:block"></div>

                      <div className="md:pl-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                          {sec.title}
                        </h2>
                        <p className="text-slate-600 font-medium leading-relaxed text-[15px]">
                          {sec.content}
                        </p>

                        {/* 5. Highlight Boxes (Nếu có) */}
                        {sec.highlight && renderHighlight(sec.highlight)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </section>

          {/* ==================== 6. BRAND COMMITMENT ==================== */}
          <section className="max-w-5xl mx-auto bg-green-50 rounded-[3rem] p-10 md:p-16 text-center border border-green-100 mb-20 relative overflow-hidden">
            {/* Pattern mờ */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 shadow-sm border border-green-100">
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
                    strokeWidth={2.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4">
                Đồng hành cùng niềm tin
              </h2>
              <p className="text-slate-600 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
                FreshFruits luôn nỗ lực xây dựng một môi trường mua sắm trực
                tuyến minh bạch, tiện lợi và đáng tin cậy. Các điều khoản trên
                không phải để làm khó bạn, mà để bảo vệ quyền lợi chính đáng của
                mọi khách hàng yêu trái cây.
              </p>
            </div>
          </section>

          {/* ==================== 7. FAQ ==================== */}
          <section className="max-w-4xl mx-auto mb-20">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-slate-900 mb-3">
                Câu hỏi thường gặp
              </h2>
              <p className="text-slate-500 font-medium">
                Một số thắc mắc phổ biến về quy định khi mua sắm.
              </p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-[1.5rem] border transition-all duration-300 ${activeFaq === idx ? "border-green-300 shadow-[0_5px_15px_rgba(22,101,52,0.05)]" : "border-slate-100 shadow-sm hover:border-green-200"}`}
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between font-bold text-slate-800 focus:outline-none"
                  >
                    <span className="pr-4">{faq.q}</span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${activeFaq === idx ? "bg-green-100 text-green-600" : "bg-slate-50 text-slate-400"}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 transform transition-transform duration-300 ${activeFaq === idx ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>
                  <div
                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${activeFaq === idx ? "max-h-40 pb-5 opacity-100" : "max-h-0 opacity-0"}`}
                  >
                    <p className="text-slate-600 font-medium text-[15px] leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ==================== 8. CTA CUỐI TRANG ==================== */}
          <section className="max-w-4xl mx-auto text-center border-t border-slate-100 pt-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Bạn cần hỗ trợ thêm?
            </h2>
            <p className="text-slate-500 font-medium mb-8 max-w-xl mx-auto">
              Nếu bạn chưa rõ về bất kỳ điều khoản nào, đội ngũ FreshFruits luôn
              sẵn sàng giải đáp và đồng hành cùng bạn.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-sm active:scale-95"
              >
                Liên hệ hỗ trợ
              </Link>
              <Link
                to="/privacy-policy"
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-700 border-2 border-slate-100 rounded-xl font-bold hover:border-green-500 hover:text-green-600 transition-all active:scale-95"
              >
                Chính sách bảo mật
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </Layout>
  );
};

export default TermsOfUsePage;
