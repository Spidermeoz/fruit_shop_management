import React, { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import Footer from "../../../components/client/layouts/Footer";

const ReturnPolicyPage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // --- DỮ LIỆU TÓM TẮT NHANH ---
  const highlights = [
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
      title: "Chất lượng là trên hết",
      desc: "Hỗ trợ đổi trả ngay nếu trái cây không đạt chuẩn tươi ngon hoặc dập nát do vận chuyển.",
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      ),
      title: "Xử lý siêu tốc",
      desc: "Tiếp nhận yêu cầu và phản hồi phương án xử lý nhanh chóng trong vòng 2 giờ làm việc.",
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514"
        />
      ),
      title: "Ưu tiên quyền lợi",
      desc: "Luôn đặt sự hài lòng của bạn lên hàng đầu với các chính sách minh bạch, công bằng.",
    },
  ];

  // --- DỮ LIỆU QUY TRÌNH 4 BƯỚC ---
  const processSteps = [
    {
      step: "01",
      title: "Liên hệ FreshFruits",
      desc: "Gọi Hotline hoặc nhắn tin qua Fanpage/Zalo trong vòng 24h từ khi nhận hàng.",
    },
    {
      step: "02",
      title: "Cung cấp thông tin",
      desc: "Gửi mã đơn hàng kèm hình ảnh/video rõ nét chụp tình trạng sản phẩm lỗi.",
    },
    {
      step: "03",
      title: "Xác minh tình trạng",
      desc: "Đội ngũ CSKH kiểm tra, phản hồi nguyên nhân và xác nhận hỗ trợ.",
    },
    {
      step: "04",
      title: "Đổi trả & Hoàn tiền",
      desc: "Tiến hành gửi sản phẩm mới thay thế hoặc hoàn tiền theo thỏa thuận.",
    },
  ];

  // --- DỮ LIỆU FAQ ---
  const faqs = [
    {
      q: "Tôi cần liên hệ yêu cầu đổi trả trong bao lâu?",
      a: "Vì trái cây là thực phẩm tươi sống, bạn vui lòng kiểm tra và liên hệ với FreshFruits trong vòng 24 giờ kể từ khi nhận hàng để được hỗ trợ tốt nhất.",
    },
    {
      q: "FreshFruits có hỗ trợ hoàn tiền mặt không?",
      a: "Có. Trong trường hợp sản phẩm lỗi không thể đổi mới hoặc bạn không có nhu cầu đổi sản phẩm khác, chúng tôi sẽ hoàn tiền qua chuyển khoản ngân hàng trong 24h-48h.",
    },
    {
      q: "Tôi có phải chịu phí ship khi đổi hàng lỗi không?",
      a: "Hoàn toàn không. Nếu lỗi xuất phát từ chất lượng sản phẩm của FreshFruits hoặc sự cố do đơn vị vận chuyển, chúng tôi sẽ chịu 100% chi phí giao hàng hai chiều.",
    },
    {
      q: "Trái cây bị rụng cuống một chút có được đổi không?",
      a: "Đối với một số loại trái cây (như nho, nhãn), việc rụng cuống nhẹ khoảng 5-10% trong quá trình vận chuyển là đặc tính tự nhiên, mong bạn thông cảm. Tuy nhiên, nếu quả rụng bị dập nát, FreshFruits vẫn sẽ hỗ trợ đền bù tương xứng.",
    },
  ];

  return (
    <Layout>
      <div className="bg-[#fcfdfc] min-h-screen text-slate-800 font-sans selection:bg-green-200 selection:text-green-900 pb-20 scroll-smooth">
        {/* ==================== 1. HERO SECTION ==================== */}
        <section className="relative overflow-hidden bg-gradient-to-b from-green-50 via-emerald-50/30 to-transparent pt-16 pb-24 text-center">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-yellow-100/40 rounded-full blur-[120px] pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-green-200/30 rounded-full blur-[100px] pointer-events-none -z-10 -translate-x-1/2 translate-y-1/3"></div>

          <div className="container mx-auto px-4 relative z-10 max-w-4xl">
            {/* Breadcrumb */}
            <div className="flex items-center justify-center text-slate-500 text-sm font-medium mb-8">
              <Link to="/" className="hover:text-green-600 transition-colors">
                Trang chủ
              </Link>
              <span className="mx-3 opacity-40">/</span>
              <span className="text-green-700 font-bold">
                Chính sách đổi trả
              </span>
            </div>

            {/* Icon minh họa */}
            <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm border border-green-100 flex items-center justify-center mx-auto mb-8 text-green-500 relative">
              <div className="absolute inset-0 bg-green-400 rounded-[2rem] blur-xl opacity-20"></div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 relative z-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              Chính Sách{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                Đổi Trả
              </span>
            </h1>
            <p className="text-slate-600 font-medium text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
              FreshFruits luôn mong muốn mang đến trải nghiệm mua sắm an tâm
              tuyệt đối với chính sách đổi trả minh bạch, rõ ràng và thuận tiện
              nhất cho khách hàng.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 lg:px-8 -mt-12 relative z-20">
          {/* ==================== 2. KHỐI TÓM TẮT NHANH ==================== */}
          <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {highlights.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-50 hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {item.icon}
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed text-[15px]">
                  {item.desc}
                </p>
              </div>
            ))}
          </section>

          {/* ==================== 3 & 4. NỘI DUNG CHÍNH & MỤC LỤC ==================== */}
          <section className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 mb-20">
            {/* 3. Table of Contents (Sticky Sidebar) */}
            <aside className="lg:w-1/4 hidden lg:block">
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 sticky top-24">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5 px-4">
                  Nội dung chính
                </h3>
                <nav className="space-y-1">
                  {[
                    { id: "dieu-kien", label: "Điều kiện áp dụng" },
                    { id: "khong-ap-dung", label: "Trường hợp từ chối" },
                    { id: "thoi-gian", label: "Thời gian yêu cầu" },
                    { id: "quy-trinh", label: "Quy trình xử lý" },
                    { id: "hinh-thuc", label: "Hình thức hỗ trợ" },
                    { id: "chi-phi", label: "Chi phí đổi trả" },
                  ].map((link) => (
                    <a
                      key={link.id}
                      href={`#${link.id}`}
                      className="block px-4 py-3 rounded-xl text-[15px] font-medium text-slate-600 hover:bg-green-50 hover:text-green-700 transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* 4. Main Policy Content */}
            <main className="lg:w-3/4">
              <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-50 space-y-14">
                {/* 4.1 Điều kiện áp dụng */}
                <div id="dieu-kien" className="scroll-mt-32">
                  <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">
                      1
                    </span>
                    Điều kiện áp dụng đổi trả
                  </h2>
                  <p className="text-slate-600 font-medium mb-4">
                    Khách hàng được hỗ trợ đổi trả sản phẩm mới hoặc hoàn tiền
                    trong các trường hợp sau:
                  </p>
                  <ul className="space-y-3 pl-2">
                    {[
                      "Sản phẩm bị hư hỏng, dập nát, mốc hỏng không đảm bảo chất lượng khi nhận hàng.",
                      "Giao sai loại trái cây, sai phân loại hoặc thiếu số lượng so với đơn đặt hàng.",
                      "Sản phẩm không đúng với mô tả về trọng lượng, kích thước trên website.",
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 text-green-500 mt-0.5 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-slate-600 font-medium leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4.2 Trường hợp không áp dụng */}
                <div id="khong-ap-dung" className="scroll-mt-32">
                  <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">
                      2
                    </span>
                    Trường hợp không áp dụng
                  </h2>
                  <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-100/50 rounded-bl-full -z-10"></div>
                    <ul className="space-y-3">
                      {[
                        "Khách hàng thay đổi nhu cầu (không muốn mua nữa) sau khi đơn đã giao thành công.",
                        "Sản phẩm đã được sử dụng một phần hoặc bảo quản không đúng hướng dẫn (để ngoài nắng nóng, không bỏ tủ lạnh...).",
                        "Trái cây có vết xước nhẹ ngoài vỏ, rụng cuống ít không ảnh hưởng đến chất lượng thịt quả bên trong.",
                        "Không có hình ảnh/video chứng minh lỗi sản phẩm lúc nhận hàng.",
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <svg
                            className="w-5 h-5 text-red-400 mt-0.5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          <span className="text-slate-700 font-medium leading-relaxed">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 4.3 & 4.7 Thời gian & Lưu ý quan trọng */}
                <div
                  id="thoi-gian"
                  className="scroll-mt-32 flex flex-col md:flex-row gap-6"
                >
                  <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Thời gian yêu cầu
                    </h3>
                    <p className="text-slate-600 font-medium leading-relaxed text-[15px]">
                      Vui lòng liên hệ và gửi yêu cầu cho FreshFruits trong vòng{" "}
                      <strong className="text-slate-900">24 giờ</strong> kể từ
                      khi ký nhận đơn hàng. Qua thời gian này, chúng tôi xin
                      phép từ chối giải quyết khiếu nại.
                    </p>
                  </div>

                  <div className="flex-1 bg-amber-50 border border-amber-100 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-amber-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Lưu ý quan trọng
                    </h3>
                    <p className="text-amber-800 font-medium leading-relaxed text-[15px]">
                      Khách hàng vui lòng{" "}
                      <strong>
                        kiểm tra kỹ hàng hóa ngay khi shipper giao tới
                      </strong>
                      . Khuyến khích quay video lúc mở thùng hàng để quá trình
                      đối soát diễn ra nhanh nhất.
                    </p>
                  </div>
                </div>

                {/* 4.4 Quy trình đổi trả */}
                <div id="quy-trinh" className="scroll-mt-32">
                  <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">
                      3
                    </span>
                    Quy trình xử lý nhanh gọn
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {processSteps.map((step, idx) => (
                      <div key={idx} className="relative group">
                        {/* Đường gạch ngang nối các bước (ẩn trên mobile) */}
                        {idx !== processSteps.length - 1 && (
                          <div className="hidden md:block absolute top-6 left-1/2 w-full h-[2px] bg-slate-100 group-hover:bg-green-200 transition-colors z-0"></div>
                        )}
                        <div className="relative z-10 flex flex-col items-center text-center">
                          <div className="w-12 h-12 rounded-2xl bg-white border-2 border-green-100 text-green-600 font-bold flex items-center justify-center mb-4 group-hover:bg-green-500 group-hover:text-white group-hover:border-green-500 transition-all shadow-sm">
                            {step.step}
                          </div>
                          <h4 className="font-bold text-slate-900 mb-2">
                            {step.title}
                          </h4>
                          <p className="text-slate-500 text-sm font-medium leading-relaxed">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4.5 & 4.6 Hình thức & Chi phí */}
                <div
                  id="hinh-thuc"
                  className="scroll-mt-32 border-t border-slate-100 pt-10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 mb-4">
                        Hình thức hỗ trợ
                      </h2>
                      <p className="text-slate-600 font-medium leading-relaxed mb-3">
                        Tùy vào tình trạng thực tế, chúng tôi sẽ đưa ra hướng
                        giải quyết phù hợp và có lợi nhất cho bạn:
                      </p>
                      <ul className="space-y-2 text-slate-600 font-medium">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>{" "}
                          Đổi mới sản phẩm cùng loại.
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>{" "}
                          Hoàn tiền theo giá trị sản phẩm lỗi.
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>{" "}
                          Tặng voucher/mã giảm giá cho đơn hàng sau.
                        </li>
                      </ul>
                    </div>

                    <div id="chi-phi" className="scroll-mt-32">
                      <h2 className="text-xl font-bold text-slate-900 mb-4">
                        Chi phí đổi trả
                      </h2>
                      <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                        <p className="text-slate-700 font-medium leading-relaxed">
                          <strong>Miễn phí 100%:</strong> Nếu lỗi phát sinh từ
                          phía FreshFruits hoặc quá trình vận chuyển, chúng tôi
                          sẽ chịu toàn bộ chi phí giao nhận hàng đổi trả. Bạn
                          không cần thanh toán thêm bất kỳ khoản phí nào.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </section>

          {/* ==================== 5. BRAND COMMITMENT ==================== */}
          <section className="max-w-5xl mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-[3rem] p-10 md:p-14 text-center shadow-lg mb-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] mix-blend-overlay"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-6 text-white border border-white/30">
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
              <h2 className="text-3xl md:text-4xl font-black text-white mb-5">
                Cam kết từ FreshFruits
              </h2>
              <p className="text-green-50 text-lg font-medium max-w-3xl mx-auto leading-relaxed">
                "Chúng tôi không chỉ bán trái cây, chúng tôi trao gửi sự an tâm.
                Mỗi đơn hàng đến tay bạn đều mang theo sự tận tâm và trách
                nhiệm. Nếu có điều gì chưa hài lòng, hãy để chúng tôi được khắc
                phục ngay lập tức."
              </p>
            </div>
          </section>

          {/* ==================== 6. FAQ ==================== */}
          <section className="max-w-4xl mx-auto mb-20">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-slate-900 mb-3">
                Câu hỏi thường gặp
              </h2>
              <p className="text-slate-500 font-medium">
                Giải đáp nhanh những thắc mắc về quá trình đổi trả hàng.
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
                    <p className="text-slate-600 font-medium text-[15px] leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ==================== 7. CTA ==================== */}
          <section className="max-w-3xl mx-auto text-center border-t border-slate-100 pt-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Bạn cần hỗ trợ ngay lúc này?
            </h2>
            <p className="text-slate-500 font-medium mb-8">
              Đừng ngần ngại liên hệ, đội ngũ Chăm sóc khách hàng của
              FreshFruits luôn sẵn sàng lắng nghe và giải quyết vấn đề của bạn
              một cách nhanh nhất.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-sm active:scale-95"
              >
                Liên hệ hỗ trợ
              </Link>
              <Link
                to="/shipping-policy"
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-700 border-2 border-slate-100 rounded-xl font-bold hover:border-green-500 hover:text-green-600 transition-all active:scale-95"
              >
                Chính sách giao hàng
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </Layout>
  );
};

export default ReturnPolicyPage;
