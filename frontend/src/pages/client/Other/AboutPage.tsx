import React from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import Footer from "../../../components/client/layouts/Footer";

const AboutPage: React.FC = () => {
  // Dữ liệu Giá trị cốt lõi
  const values = [
    {
      title: "Chất lượng cao",
      description:
        "Tuyển chọn kỹ lưỡng từ các nông trại uy tín, cam kết không chất bảo quản.",
      icon: (
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
            strokeWidth={2.5}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: "Tươi mới mỗi ngày",
      description:
        "Thu hoạch và vận chuyển trong ngày, giữ trọn vẹn vitamin và hương vị.",
      icon: (
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
            strokeWidth={2.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: "Phát triển bền vững",
      description:
        "Đồng hành cùng nông dân địa phương, canh tác thân thiện với môi trường.",
      icon: (
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
            strokeWidth={2.5}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: "Dịch vụ tận tâm",
      description:
        "Giao hàng nhanh chóng, đổi trả dễ dàng, đặt sự hài lòng của bạn lên đầu.",
      icon: (
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
            strokeWidth={2.5}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
  ];

  // Dữ liệu Hành trình phát triển
  const milestones = [
    {
      year: "2015",
      title: "Khởi nguồn đam mê",
      description: "Cửa hàng FreshFruits đầu tiên ra mắt tại TP.HCM.",
    },
    {
      year: "2017",
      title: "Mở rộng quy mô",
      description: "Đạt mốc 5 chi nhánh tại các thành phố lớn.",
    },
    {
      year: "2019",
      title: "Chuyển đổi số",
      description: "Ra mắt hệ thống đặt hàng trực tuyến tiện lợi.",
    },
    {
      year: "2021",
      title: "Vươn tầm thế giới",
      description:
        "Nhập khẩu trực tiếp trái cây cao cấp từ Úc, Mỹ, New Zealand.",
    },
    {
      year: "2023",
      title: "100.000+ Khách hàng",
      description: "Phục vụ hơn một trăm nghìn bữa ăn khỏe mạnh.",
    },
  ];

  // Dữ liệu Quy trình
  const processes = [
    {
      step: "01",
      title: "Khảo sát nông trại",
      desc: "Đội ngũ chuyên gia trực tiếp kiểm tra chất lượng đất và giống cây.",
    },
    {
      step: "02",
      title: "Thu hoạch đúng chuẩn",
      desc: "Hái quả vào sáng sớm khi độ tươi ngon và dinh dưỡng đạt mức cao nhất.",
    },
    {
      step: "03",
      title: "Kiểm định khắt khe",
      desc: "Lọc bỏ những quả không đạt yêu cầu, rửa sạch và đóng gói an toàn.",
    },
    {
      step: "04",
      title: "Giao hàng thần tốc",
      desc: "Vận chuyển xe lạnh chuyên dụng, đến tay khách hàng chỉ trong 2 giờ.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfc]">
      <Layout>
        {/* ==================== BREADCRUMB ==================== */}
        <section className="relative overflow-hidden bg-gradient-to-b from-green-100/50 to-transparent py-10 text-center">
          <div className="container mx-auto relative z-10 px-4">
            <div className="flex items-center justify-center text-slate-500 text-sm md:text-base font-medium">
              <Link to="/" className="hover:text-green-600 transition-colors">
                Trang chủ
              </Link>
              <span className="mx-3 opacity-30">/</span>
              <span className="text-green-700">Về FreshFruits</span>
            </div>
          </div>
        </section>

        {/* ==================== 1. HERO SECTION ==================== */}
        <section className="relative pb-20 pt-4 overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-200/30 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Nội dung */}
              <div className="relative z-10 space-y-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-green-700 border border-green-100">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    Tươi ngon mỗi ngày
                  </span>
                  <span className="inline-flex rounded-full bg-yellow-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-yellow-700 border border-yellow-100">
                    100% Organic
                  </span>
                </div>

                <h1 className="text-5xl lg:text-6xl font-black text-slate-900 leading-[1.15]">
                  Trái cây tươi cho <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                    cuộc sống khỏe mạnh
                  </span>
                </h1>

                <p className="text-lg text-slate-500 leading-relaxed max-w-lg font-medium">
                  FreshFruits ra đời với mong muốn mang nguồn vitamin tự nhiên,
                  tươi sạch và an toàn nhất đến bàn ăn của mọi gia đình Việt.
                  Chúng tôi tin rằng, ăn ngon và sống khỏe bắt đầu từ những lựa
                  chọn đơn giản mỗi ngày.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <Link
                    to="/products"
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-8 py-4 font-bold text-white transition-all duration-300 hover:bg-green-700 hover:shadow-[0_15px_30px_rgba(34,197,94,0.3)] active:scale-95"
                  >
                    Khám phá sản phẩm
                  </Link>
                  <a
                    href="#story"
                    className="inline-flex items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 font-bold text-slate-700 transition-all duration-300 hover:border-green-500 hover:text-green-600 active:scale-95"
                  >
                    Câu chuyện thương hiệu
                  </a>
                </div>
              </div>

              {/* Hình ảnh */}
              <div className="relative">
                <div className="relative rounded-[3rem] overflow-hidden shadow-[0_30px_80px_rgba(22,101,52,0.15)] border-8 border-white transform rotate-2 hover:rotate-0 transition-transform duration-700">
                  <img
                    src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80"
                    alt="Giỏ trái cây tươi FreshFruits"
                    className="w-full h-[500px] object-cover"
                  />

                  {/* Floating badges */}
                  <div
                    className="absolute top-8 left-8 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce"
                    style={{ animationDuration: "3s" }}
                  >
                    <span className="text-2xl">🍇</span>
                    <div className="text-sm">
                      <p className="font-bold text-slate-900">Mới thu hoạch</p>
                      <p className="text-green-600 font-bold text-xs">
                        Sáng nay
                      </p>
                    </div>
                  </div>

                  <div className="absolute bottom-8 right-8 bg-slate-900/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3">
                    <span className="text-3xl text-yellow-400">★</span>
                    <div className="text-sm">
                      <p className="font-bold text-white">4.9/5 Điểm</p>
                      <p className="text-slate-300 font-medium text-xs">
                        Đánh giá khách hàng
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 2. STATS HIGHLIGHT ==================== */}
        <section className="py-10">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-7xl mx-auto bg-green-700 rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_60px_rgba(21,128,61,0.2)] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative overflow-hidden">
              <div className="absolute inset-0 bg-green-800/20 mix-blend-overlay"></div>
              <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-green-600/50">
                {[
                  { number: "100k+", label: "Khách hàng hài lòng" },
                  { number: "50+", label: "Loại quả theo mùa" },
                  { number: "24h", label: "Cam kết tươi mới" },
                  { number: "100%", label: "Chuẩn nông nghiệp sạch" },
                ].map((stat, idx) => (
                  <div key={idx} className="px-4">
                    <p className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
                      {stat.number}
                    </p>
                    <p className="text-green-100 font-medium text-sm md:text-base uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 3. BRAND STORY ==================== */}
        <section id="story" className="py-20 bg-slate-50/50">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative">
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  <img
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"
                    alt="Siêu thị trái cây"
                    className="rounded-[2rem] shadow-lg w-full h-[300px] object-cover"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80"
                    alt="Nước ép trái cây"
                    className="rounded-[2rem] shadow-lg w-full h-[300px] object-cover mt-12"
                  />
                </div>
                {/* Quote Card */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-4/5 md:w-2/3 text-center border border-slate-50">
                  <p className="text-xl font-bold text-green-700 italic mb-2">
                    "Health is Wealth"
                  </p>
                  <p className="text-slate-500 font-medium text-sm">
                    Chúng tôi không bán trái cây, chúng tôi trao gửi sức khỏe và
                    sự an tâm.
                  </p>
                </div>
              </div>

              <div className="order-1 lg:order-2 space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                  Hành trình mang thiên nhiên về gian bếp nhỏ
                </h2>
                <div className="h-1.5 w-20 bg-green-500 rounded-full"></div>
                <p className="text-slate-600 text-lg leading-relaxed font-medium">
                  Bắt đầu từ một cửa hàng nhỏ nằm giữa lòng Sài Gòn nhộn nhịp
                  vào năm 2015, FreshFruits mang trong mình trăn trở về việc tìm
                  kiếm nguồn thực phẩm thật sự sạch cho gia đình.
                </p>
                <p className="text-slate-600 text-lg leading-relaxed font-medium">
                  Trải qua nhiều năm, chúng tôi đã len lỏi khắp các nhà vườn từ
                  Đà Lạt mộng mơ đến miền Tây trù phú, và vươn xa ra thế giới để
                  mang về những chủng loại quả cao cấp nhất. FreshFruits không
                  ngừng nỗ lực để trở thành "người làm vườn" tin cậy của mọi
                  nhà.
                </p>
                <div className="bg-green-50 rounded-2xl p-6 border-l-4 border-green-500">
                  <p className="text-slate-700 font-bold italic">
                    Sứ mệnh của chúng tôi là lan tỏa lối sống lành mạnh (Healthy
                    Lifestyle) thông qua từng bữa ăn dinh dưỡng.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 4. CORE VALUES ==================== */}
        <section className="py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-green-600 font-bold tracking-wider uppercase text-sm mb-2 block">
                  Cam kết của chúng tôi
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900">
                  Vì sao chọn FreshFruits?
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {values.map((val, idx) => (
                  <div
                    key={idx}
                    className="group bg-white rounded-[2rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-50 hover:shadow-[0_20px_60px_rgba(22,101,52,0.1)] hover:-translate-y-2 transition-all duration-300"
                  >
                    <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                      <div className="text-green-600 group-hover:text-white transition-colors">
                        {val.icon}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      {val.title}
                    </h3>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      {val.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 5. VISUAL GALLERY (ĐÃ SỬA LỖI) ==================== */}
        <section className="py-10">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 md:h-[600px]">
                {/* Ảnh lớn bên trái */}
                <div className="md:col-span-2 relative rounded-[2rem] overflow-hidden group h-[400px] md:h-full">
                  <img
                    src="https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=1000&q=80"
                    alt="Fruit Bowl"
                    className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 pointer-events-none"></div>
                  <div className="absolute bottom-8 left-8">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 inline-block">
                      Best Seller
                    </span>
                    <h3 className="text-3xl font-bold text-white">
                      Mùa Hè Sôi Động
                    </h3>
                  </div>
                </div>

                {/* 2 Ảnh nhỏ bên phải */}
                <div className="flex flex-col gap-4 md:gap-6 h-full">
                  <div className="relative rounded-[2rem] overflow-hidden group flex-1 min-h-[250px] md:min-h-0">
                    <img
                      src="https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=600&q=80"
                      alt="Orange"
                      className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-80 pointer-events-none"></div>
                    <div className="absolute bottom-6 left-6">
                      <h3 className="text-xl font-bold text-white">
                        Vitamin C Tự Nhiên
                      </h3>
                    </div>
                  </div>

                  <div className="relative rounded-[2rem] overflow-hidden group flex-1 min-h-[250px] md:min-h-0">
                    <img
                      src="https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80"
                      alt="Pineapple"
                      className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-80 pointer-events-none"></div>
                    <div className="absolute bottom-6 left-6">
                      <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 inline-block">
                        Organic
                      </span>
                      <h3 className="text-xl font-bold text-white">
                        Trái Cây Nhiệt Đới
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 6. QUALITY PROCESS (ĐÃ SỬA LỖI) ==================== */}
        <section className="py-20 bg-green-50/50">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                  Quy trình từ Nông trại đến Bàn ăn
                </h2>
                <p className="text-slate-500 font-medium">
                  Mỗi quả đều trải qua 4 bước kiểm duyệt gắt gao để đảm bảo độ
                  tươi sạch nhất.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {processes.map((proc, idx) => (
                  <div
                    key={idx}
                    className="relative bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-shadow"
                  >
                    <div className="text-5xl font-black text-green-100 absolute top-4 right-6 pointer-events-none z-0">
                      {proc.step}
                    </div>
                    <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold mb-6 relative z-10">
                      {idx + 1}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 relative z-10">
                      {proc.title}
                    </h3>
                    <p className="text-slate-500 font-medium text-sm relative z-10">
                      {proc.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 7. MILESTONES (Lịch sử) ==================== */}
        <section className="py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900">
                  Chặng đường phát triển
                </h2>
              </div>

              <div className="relative border-l-4 border-green-100 ml-4 md:ml-1/2 md:translate-x-[-2px] space-y-12">
                {milestones.map((stone, idx) => (
                  <div key={idx} className="relative pl-8 md:pl-0">
                    <div className="md:w-1/2 md:pr-12 md:text-right md:ml-0 md:mr-auto pl-0">
                      {/* Dành cho Desktop xen kẽ */}
                      <div
                        className={`hidden md:block ${idx % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12 md:text-left md:ml-auto md:mr-0"}`}
                      >
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                          <span className="text-green-600 font-black text-xl mb-1 block">
                            {stone.year}
                          </span>
                          <h3 className="text-lg font-bold text-slate-900 mb-2">
                            {stone.title}
                          </h3>
                          <p className="text-slate-500 font-medium text-sm">
                            {stone.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dành cho Mobile */}
                    <div className="md:hidden bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                      <span className="text-green-600 font-black text-xl mb-1 block">
                        {stone.year}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {stone.title}
                      </h3>
                      <p className="text-slate-500 font-medium text-sm">
                        {stone.description}
                      </p>
                    </div>

                    {/* Timeline Dot */}
                    <div className="absolute top-6 left-[-10px] md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-md"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 8. LIFESTYLE MESSAGE ==================== */}
        <section className="py-20 relative overflow-hidden bg-slate-900">
          <img
            src="https://images.unsplash.com/photo-1490818387583-1b5f2011198f?auto=format&fit=crop&w=1500&q=80"
            alt="Healthy Lifestyle"
            className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="max-w-3xl mx-auto">
              <span className="text-green-400 font-bold uppercase tracking-widest text-sm mb-4 block">
                Lan tỏa sức sống mới
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-8">
                "Mỗi loại trái cây là một nguồn năng lượng tươi mới cho ngày dài
                năng động."
              </h2>
              <div className="w-24 h-1 bg-green-500 mx-auto rounded-full"></div>
            </div>
          </div>
        </section>

        {/* ==================== 9. CTA & NEWSLETTER ==================== */}
        <section className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto bg-gradient-to-br from-green-500 to-emerald-700 rounded-[3rem] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
              {/* Pattern Lá cây */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leaves.png')] opacity-20"></div>

              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                  Sẵn sàng chọn trái cây tươi cho gia đình bạn?
                </h2>
                <p className="text-green-50 text-lg mb-10 font-medium max-w-2xl mx-auto">
                  Tham gia cộng đồng Healthy Lifestyle và nhận ngay voucher giảm
                  10% cho đơn hàng đầu tiên cùng những tin tức sức khỏe hữu ích
                  nhất.
                </p>

                <form className="flex flex-col sm:flex-row justify-center gap-3 max-w-xl mx-auto">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-700"
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
                    </span>
                    <input
                      type="email"
                      placeholder="Nhập email của bạn..."
                      className="w-full pl-11 pr-4 py-4 rounded-2xl font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-green-300 transition-shadow"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg active:scale-95 whitespace-nowrap"
                  >
                    Đăng ký ngay
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </Layout>
      <Footer />
    </div>
  );
};

export default AboutPage;
