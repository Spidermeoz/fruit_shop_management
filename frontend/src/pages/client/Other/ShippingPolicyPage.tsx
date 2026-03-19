import React, { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import Footer from "../../../components/client/layouts/Footer";

const ShippingPolicyPage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // --- DỮ LIỆU TÓM TẮT NHANH ---
  const highlights = [
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
      title: "Giao hàng thần tốc",
      desc: "Hỗ trợ giao nhanh nội thành chỉ trong 2-4 giờ để trái cây luôn giữ được độ tươi ngon nhất.",
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
        />
      ),
      title: "Đóng gói cẩn thận",
      desc: "Trái cây được bọc chống sốc và đặt trong hộp giấy thoáng khí, hạn chế tối đa dập nát.",
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10 M14 8h5.36m0 0l2.25 3m-2.25-3v5m-1.36 0H14"
        />
      ),
      title: "Phí vận chuyển minh bạch",
      desc: "Hiển thị rõ ràng cước phí trước khi thanh toán. Miễn phí giao hàng cho đơn từ 500.000đ.",
    },
  ];

  // --- DỮ LIỆU QUY TRÌNH GIAO HÀNG ---
  const processSteps = [
    {
      step: "01",
      title: "Xác nhận đơn",
      desc: "Hệ thống ghi nhận và nhân viên gọi điện/nhắn tin chốt đơn hàng.",
    },
    {
      step: "02",
      title: "Tuyển chọn",
      desc: "Kiểm tra kỹ từng quả, đảm bảo độ chín và tươi ngon tiêu chuẩn.",
    },
    {
      step: "03",
      title: "Đóng gói",
      desc: "Sắp xếp cẩn thận vào giỏ/hộp, lót mút chống sốc chuyên dụng.",
    },
    {
      step: "04",
      title: "Giao tận tay",
      desc: "Shipper bảo quản mát, giao hàng đúng hẹn và đồng kiểm cùng bạn.",
    },
  ];

  // --- DỮ LIỆU FAQ ---
  const faqs = [
    {
      q: "FreshFruits có giao hàng trong ngày không?",
      a: "Có. Với các đơn hàng trong khu vực Nội thành đặt trước 16:00, FreshFruits hỗ trợ giao tốc hành trong vòng 2-4 giờ hoặc giao linh hoạt trong ngày theo khung giờ bạn chọn.",
    },
    {
      q: "Tôi có thể hẹn giờ nhận hàng theo ý muốn không?",
      a: "Hoàn toàn được. Ở bước thanh toán, bạn có thể ghi chú khung giờ nhận hàng mong muốn (ví dụ: giao giờ hành chính, giao sau 18h). Chúng tôi sẽ sắp xếp shipper phù hợp.",
    },
    {
      q: "Trái cây giao đến bị dập nát do shipper thì sao?",
      a: "FreshFruits chịu hoàn toàn trách nhiệm trong khâu vận chuyển. Nếu trái cây bị dập nát, bạn chỉ cần chụp ảnh gửi cho CSKH, chúng tôi sẽ giao phần mới đổi trả miễn phí tận nơi.",
    },
    {
      q: "Tôi có được mở hộp kiểm tra trái cây trước khi thanh toán không?",
      a: "Có, FreshFruits luôn khuyến khích khách hàng đồng kiểm (kiểm tra số lượng, chất lượng bên ngoài) cùng shipper trước khi nhận hàng và thanh toán.",
    },
  ];

  return (
    <Layout>
      <div className="bg-[#fcfdfc] min-h-screen text-slate-800 font-sans selection:bg-green-200 selection:text-green-900 pb-20 scroll-smooth">
        {/* ==================== 1. HERO SECTION ==================== */}
        <section className="relative overflow-hidden bg-gradient-to-b from-green-50 via-emerald-50/20 to-transparent pt-16 pb-24 text-center">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-green-200/30 rounded-full blur-[100px] pointer-events-none -z-10 translate-x-1/2 -translate-y-1/4"></div>

          <div className="container mx-auto px-4 relative z-10 max-w-4xl">
            {/* Breadcrumb */}
            <div className="flex items-center justify-center text-slate-500 text-sm font-medium mb-8">
              <Link to="/" className="hover:text-green-600 transition-colors">
                Trang chủ
              </Link>
              <span className="mx-3 opacity-40">/</span>
              <span className="text-green-700 font-bold">
                Chính sách giao hàng
              </span>
            </div>

            {/* Icon Hero */}
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
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M14 8h5.36m0 0l2.25 3m-2.25-3v5m-1.36 0H14"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              Chính Sách{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                Giao Hàng
              </span>
            </h1>
            <p className="text-slate-600 font-medium text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
              FreshFruits cam kết giao trái cây tươi nhanh chóng, cẩn thận và
              minh bạch để mang đến trải nghiệm mua sắm an tâm trọn vẹn cho bạn.
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
            {/* 3. Table of Contents (Sticky) */}
            <aside className="lg:w-1/4 hidden lg:block">
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 sticky top-24">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5 px-4">
                  Nội dung chính
                </h3>
                <nav className="space-y-1">
                  {[
                    { id: "pham-vi", label: "Phạm vi giao hàng" },
                    { id: "thoi-gian", label: "Thời gian dự kiến" },
                    { id: "chi-phi", label: "Phí vận chuyển" },
                    { id: "quy-trinh", label: "Quy trình xử lý" },
                    { id: "kiem-tra", label: "Quy định kiểm tra" },
                    { id: "luu-y-trai-cay", label: "Lưu ý bảo quản" },
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

            {/* 4. Main Content */}
            <main className="lg:w-3/4">
              <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-50 space-y-14">
                {/* 4.1 Phạm vi giao hàng */}
                <div id="pham-vi" className="scroll-mt-32">
                  <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">
                      <svg
                        className="w-4 h-4"
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
                    </span>
                    Phạm vi hỗ trợ giao hàng
                  </h2>
                  <p className="text-slate-600 font-medium mb-4 leading-relaxed">
                    Để đảm bảo trái cây đến tay khách hàng luôn trong tình trạng
                    tươi ngon nhất, hiện tại FreshFruits tập trung phục vụ và
                    giao hàng tại các khu vực sau:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50">
                      <h4 className="font-bold text-slate-900 mb-2">
                        Khu vực Nội thành
                      </h4>
                      <p className="text-sm text-slate-600 font-medium">
                        Các quận trung tâm (Q1, Q3, Q4, Q5, Q10, Phú Nhuận, Bình
                        Thạnh...). Hỗ trợ giao nhanh siêu tốc.
                      </p>
                    </div>
                    <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50">
                      <h4 className="font-bold text-slate-900 mb-2">
                        Khu vực Ngoại thành
                      </h4>
                      <p className="text-sm text-slate-600 font-medium">
                        Thủ Đức, Q7, Q8, Q12, Gò Vấp, Tân Phú, Bình Tân... Giao
                        trong ngày hoặc theo ca cố định.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4.2 & 4.3 Thời gian & Phí giao hàng (Grid Layout) */}
                <div
                  id="thoi-gian"
                  className="scroll-mt-32 grid md:grid-cols-2 gap-8 border-t border-slate-100 pt-10"
                >
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
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
                      Thời gian dự kiến
                    </h2>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>
                        <div>
                          <p className="font-bold text-slate-800">
                            Giao nhanh (Hỏa tốc)
                          </p>
                          <p className="text-sm text-slate-500 font-medium">
                            Nhận hàng trong vòng 2-4 tiếng (Nội thành).
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2"></div>
                        <div>
                          <p className="font-bold text-slate-800">
                            Giao tiêu chuẩn
                          </p>
                          <p className="text-sm text-slate-500 font-medium">
                            Nhận hàng trong vòng 12-24 tiếng (Ngoại thành).
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div id="chi-phi" className="scroll-mt-32">
                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
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
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Phí vận chuyển
                    </h2>
                    <div className="bg-green-50/50 border border-green-100 rounded-xl p-5 space-y-3">
                      <div className="flex justify-between items-center text-[15px]">
                        <span className="text-slate-600 font-medium">
                          Dưới 3km
                        </span>
                        <span className="font-bold text-slate-900">
                          15.000đ
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[15px]">
                        <span className="text-slate-600 font-medium">
                          Từ 3km - 10km
                        </span>
                        <span className="font-bold text-slate-900">
                          25.000đ - 35.000đ
                        </span>
                      </div>
                      <div className="border-t border-green-200/50 pt-2 mt-2">
                        <span className="text-sm text-green-700 font-bold">
                          🎉 Miễn phí giao hàng cho đơn từ 500k
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4.4 Quy trình xử lý */}
                <div id="quy-trinh" className="scroll-mt-32">
                  <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center md:text-left">
                    Quy trình xử lý đơn hàng
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                    {processSteps.map((step, idx) => (
                      <div key={idx} className="relative group z-10">
                        {idx !== processSteps.length - 1 && (
                          <div className="hidden md:block absolute top-6 left-1/2 w-full h-[2px] bg-slate-100 group-hover:bg-green-200 transition-colors -z-10"></div>
                        )}
                        <div className="flex flex-col items-center text-center bg-white">
                          <div className="w-12 h-12 rounded-2xl bg-white border-2 border-green-100 text-green-600 font-bold flex items-center justify-center mb-4 shadow-sm">
                            {step.step}
                          </div>
                          <h4 className="font-bold text-slate-900 mb-2">
                            {step.title}
                          </h4>
                          <p className="text-slate-500 text-[13px] font-medium leading-relaxed">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4.5 & 4.6 Quy định kiểm tra & Sự cố */}
                <div
                  id="kiem-tra"
                  className="scroll-mt-32 border-t border-slate-100 pt-10"
                >
                  <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                      <svg
                        className="w-8 h-8"
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
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-amber-900 mb-2">
                        Quyền lợi đồng kiểm khi nhận hàng
                      </h3>
                      <p className="text-amber-800 font-medium leading-relaxed text-[15px]">
                        Khách hàng được quyền{" "}
                        <strong>
                          mở hộp kiểm tra số lượng và tình trạng bên ngoài
                        </strong>{" "}
                        của trái cây trước khi thanh toán cho shipper. Nếu phát
                        hiện sai sót, dập nát hoặc thiếu hàng, vui lòng từ chối
                        nhận hoặc liên hệ ngay hotline để chúng tôi xử lý bù/đổi
                        ngay lập tức.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4.7 Lưu ý đặc thù trái cây (Highlight box) */}
                <div id="luu-y-trai-cay" className="scroll-mt-32">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-8 relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 text-green-200 opacity-30">
                      <svg
                        className="w-32 h-32"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C7.58 2 4 5.58 4 10c0 4.2 3.14 7.68 7.2 7.96V22h1.6v-4.04c4.06-.28 7.2-3.76 7.2-7.96 0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-green-800 mb-4 relative z-10">
                      🌿 Lưu ý đặc biệt với mặt hàng trái cây tươi
                    </h3>
                    <ul className="space-y-3 relative z-10 text-green-700 font-medium text-[15px]">
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>
                          Trái cây là thực phẩm có hạn sử dụng ngắn, xin vui
                          lòng <strong>nhận hàng đúng hẹn</strong> để đảm bảo
                          hương vị tốt nhất.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>
                          Sau khi nhận, hãy tham khảo tem hướng dẫn trên hộp để{" "}
                          <strong>bảo quản đúng cách</strong> (loại nào cần để
                          tủ lạnh, loại nào để nhiệt độ phòng).
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>
                          Trong trường hợp bất khả kháng (mưa bão, ngập lụt),
                          thời gian giao hàng có thể xê dịch đôi chút.
                          FreshFruits sẽ chủ động thông báo trước cho bạn.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </main>
          </section>

          {/* ==================== 5. BRAND COMMITMENT ==================== */}
          <section className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-10 md:p-14 text-center shadow-xl mb-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-900/40 to-emerald-900/20 mix-blend-overlay"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 text-green-400 border border-white/20">
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
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514"
                  />
                </svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-5">
                Nâng niu từng giỏ quà
              </h2>
              <p className="text-slate-300 text-lg font-medium max-w-3xl mx-auto leading-relaxed">
                "Chúng tôi hiểu rằng mỗi đơn hàng không chỉ là trái cây, mà còn
                là sức khỏe và tình cảm bạn dành cho gia đình. Vì vậy, mọi
                chuyến đi đều được đóng gói cẩn thận và chuyên chở bằng cả sự
                tận tâm."
              </p>
            </div>
          </section>

          {/* ==================== 6. FAQ ==================== */}
          <section className="max-w-4xl mx-auto mb-20">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-slate-900 mb-3">
                Hỏi đáp nhanh
              </h2>
              <p className="text-slate-500 font-medium">
                Những câu hỏi phổ biến về quá trình giao nhận.
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
              Bạn chưa rõ về khu vực giao hàng của mình?
            </h2>
            <p className="text-slate-500 font-medium mb-8">
              Để lại tin nhắn hoặc gọi ngay cho chúng tôi, đội ngũ điều phối của
              FreshFruits sẽ kiểm tra tuyến đường và báo thời gian giao chính
              xác nhất cho bạn.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-sm active:scale-95"
              >
                Liên hệ hỗ trợ
              </Link>
              <Link
                to="/return-policy"
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-700 border-2 border-slate-100 rounded-xl font-bold hover:border-green-500 hover:text-green-600 transition-all active:scale-95"
              >
                Xem Chính sách đổi trả
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </Layout>
  );
};

export default ShippingPolicyPage;
