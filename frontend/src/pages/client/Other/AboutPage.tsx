import React from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layout/Layout";

const AboutPage: React.FC = () => {
  const teamMembers = [
    {
      name: "Nguyễn Văn A",
      position: "CEO & Founder",
      image: "https://i.imgur.com/5Y2n5xR.jpg",
      description: "Với hơn 10 năm kinh nghiệm trong ngành nông sản, anh A đã sáng lập FreshFruits với mong muốn mang đến những sản phẩm tươi ngon nhất cho người tiêu dùng."
    },
    {
      name: "Trần Thị B",
      position: "COO & Co-founder",
      image: "https://i.imgur.com/7Yl5m3k.jpg",
      description: "Chị B chịu trách nhiệm về vận hành và đảm bảo chất lượng sản phẩm luôn đạt tiêu chuẩn cao nhất."
    },
    {
      name: "Lê Văn C",
      position: "Head of Marketing",
      image: "https://i.imgur.com/9Zl4p8q.jpg",
      description: "Anh C có kinh nghiệm dày dặn trong lĩnh vực marketing và xây dựng thương hiệu cho các sản phẩm nông sản."
    },
    {
      name: "Phạm Thị D",
      position: "Head of Product",
      image: "https://i.imgur.com/3Kd8p5m.jpg",
      description: "Chị D chịu trách nhiệm về phát triển sản phẩm và tìm kiếm các nguồn cung ứng chất lượng cao."
    }
  ];

  const values = [
    {
      title: "Chất lượng",
      description: "Cam kết mang đến những sản phẩm tươi ngon nhất, được tuyển chọn kỹ lưỡng từ các nông trại uy tín.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Tươi mới",
      description: "Sản phẩm được thu hoạch và giao hàng trong ngày, đảm bảo độ tươi ngon tối đa.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Bền vững",
      description: "Hỗ trợ các nông trại địa phương và áp dụng phương pháp canh tác bền vững.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Tiện lợi",
      description: "Dịch vụ giao hàng nhanh chóng, đặt hàng dễ dàng và thanh toán linh hoạt.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];

  const milestones = [
    { year: "2015", title: "Thành lập FreshFruits", description: "Bắt đầu với một cửa hàng nhỏ tại TP.HCM" },
    { year: "2017", title: "Mở rộng quy mô", description: "Mở thêm 5 chi nhánh tại các thành phố lớn" },
    { year: "2019", title: "Ra mắt website", description: "Bắt đầu bán hàng trực tuyến và giao hàng toàn quốc" },
    { year: "2021", title: "Hợp tác quốc tế", description: "Bắt đầu nhập khẩu trái cây từ các nước Úc, Mỹ, New Zealand" },
    { year: "2023", title: "Đạt 100.000 khách hàng", description: "Mốc quan trọng trong hành trình phát triển" },
    { year: "2025", title: "Mở rộng sang thị trường mới", description: "Kế hoạch mở rộng sang các thị trường trong khu vực" }
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
          <h1 className="text-4xl font-bold text-green-800 mb-2">Về chúng tôi</h1>
          <p className="text-gray-700">Câu chuyện về FreshFruits và hành trình mang đến những sản phẩm tươi ngon</p>
          <div className="flex items-center justify-center text-gray-600 mt-2">
            <Link to="/" className="hover:text-green-600 transition">Trang chủ</Link>
            <span className="mx-2">/</span>
            <span className="text-green-700">Giới thiệu</span>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-yellow-50 py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-green-800 mb-6">
                Mang đến những sản phẩm tươi ngon nhất từ thiên nhiên
              </h2>
              <p className="text-gray-700 mb-6 leading-relaxed">
                FreshFruits được thành lập vào năm 2015 với sứ mệnh mang đến những sản phẩm trái cây và nông sản tươi ngon nhất đến tay người tiêu dùng Việt Nam. Chúng tôi tin rằng mọi người đều xứng đáng được thưởng thức những sản phẩm tự nhiên, an toàn và bổ dưỡng.
              </p>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Với hơn 8 năm kinh nghiệm trong ngành, chúng tôi đã xây dựng được mạng lưới các nông trại đối tác uy tín trên khắp cả nước và một số quốc gia trong khu vực. Mỗi sản phẩm đều được tuyển chọn kỹ lưỡng, đảm bảo chất lượng và độ tươi ngon.
              </p>
              <Link
                to="/products"
                className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Khám phá sản phẩm
              </Link>
            </div>
            <div className="md:w-1/2">
              <img
                src="https://i.imgur.com/5Y2n5xR.jpg"
                alt="FreshFruits Team"
                className="rounded-2xl shadow-lg w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-green-800 mb-12 text-center">
            Giá trị cốt lõi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    {value.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-green-800 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-green-800 mb-12 text-center">
            Đội ngũ của chúng tôi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="h-64 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-green-800 mb-1">{member.name}</h3>
                  <p className="text-green-600 mb-3">{member.position}</p>
                  <p className="text-gray-600 text-sm">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-green-800 mb-12 text-center">
            Hành trình phát triển
          </h2>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-green-200"></div>
            {milestones.map((milestone, index) => (
              <div key={index} className={`flex items-center mb-8 ${index % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                <div className={`w-1/2 ${index % 2 === 0 ? 'text-right pr-8' : 'pl-8'}`}>
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-green-800 mb-2">{milestone.title}</h3>
                    <p className="text-gray-600 mb-1">{milestone.description}</p>
                    <p className="text-green-600 font-medium">{milestone.year}</p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold z-10">
                  {milestone.year.slice(-2)}
                </div>
                <div className="w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-gradient-to-r from-green-600 to-yellow-500 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Đăng ký nhận tin khuyến mãi
          </h2>
          <p className="text-white text-lg mb-8 max-w-2xl mx-auto">
            Nhận thông tin về các sản phẩm mới và các chương trình khuyến mãi hấp dẫn từ FreshFruits
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="bg-white text-green-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition">
              Đăng ký
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AboutPage;