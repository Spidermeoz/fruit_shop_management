import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layout/Layout";

const HomePage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    
    // Auto-rotate testimonials
    const testimonialInterval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    // Auto-rotate slides
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    
    return () => {
      clearInterval(testimonialInterval);
      clearInterval(slideInterval);
    };
  }, []);

  // Dữ liệu slide banner
  const slides = [
    {
      id: 1,
      image: "https://i.imgur.com/5Y2n5xR.jpg",
      title: "Trái Cây Tươi Ngon Mùa Hè",
      subtitle: "Giảm giá đến 30% cho các loại trái cây mùa hè",
      buttonText: "Khám phá ngay",
      buttonLink: "/product?category=summer"
    },
    {
      id: 2,
      image: "https://i.imgur.com/7Yl5m3k.jpg",
      title: "Nông Sản Hữu Cơ",
      subtitle: "100% hữu cơ, không thuốc trừ sâu, an toàn cho sức khỏe",
      buttonText: "Xem sản phẩm",
      buttonLink: "/product?category=organic"
    },
    {
      id: 3,
      image: "https://i.imgur.com/9Zl4p8q.jpg",
      title: "Giao Hàng Nhanh Chóng",
      subtitle: "Đặt hàng hôm nay, nhận hàng trong ngày",
      buttonText: "Đặt hàng ngay",
      buttonLink: "/product"
    },
    {
      id: 4,
      image: "https://i.imgur.com/3Kd8p5m.jpg",
      title: "Combo Trái Cây Dinh Dưỡng",
      subtitle: "Các combo được lựa chọn kỹ lưỡng để bổ sung vitamin cần thiết",
      buttonText: "Xem combo",
      buttonLink: "/product?category=combos"
    }
  ];

  // Chuyển đến slide tiếp theo
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  // Chuyển đến slide trước đó
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Chuyển đến slide cụ thể
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const testimonials = [
    {
      id: 1,
      name: "Nguyễn Thị Mai",
      comment: "Trái cây rất tươi ngon, được đóng gói cẩn thận. Tôi đã đặt hàng nhiều lần và rất hài lòng!",
      avatar: "https://i.imgur.com/5Y2n5xR.jpg"
    },
    {
      id: 2,
      name: "Trần Văn Hùng",
      comment: "Giao hàng nhanh chóng, chất lượng sản phẩm tuyệt vời. Sẽ tiếp tục ủng hộ shop.",
      avatar: "https://i.imgur.com/7Yl5m3k.jpg"
    },
    {
      id: 3,
      name: "Lê Thị Thu",
      comment: "Giá cả hợp lý, trái cây luôn tươi mới. Dịch vụ chăm sóc khách hàng rất tốt.",
      avatar: "https://i.imgur.com/9Zl4p8q.jpg"
    }
  ];

  const products = [
    { id: 1, name: "Táo Envy Mỹ", price: "250.000đ/kg", image: "https://i.imgur.com/k2P1k5M.jpg" },
    { id: 2, name: "Cam Úc", price: "180.000đ/kg", image: "https://i.imgur.com/8Jk3l7n.jpg" },
    { id: 3, name: "Cherry Mỹ", price: "550.000đ/hộp", image: "https://i.imgur.com/5Hd9p2q.jpg" },
    { id: 4, name: "Nho Úc", price: "320.000đ/kg", image: "https://i.imgur.com/7Mj4k9l.jpg" },
    { id: 5, name: "Dâu Hàn Quốc", price: "450.000đ/hộp", image: "https://i.imgur.com/3Kd8p5m.jpg" },
    { id: 6, name: "Xoài Cát Hòa Lộc", price: "120.000đ/kg", image: "https://i.imgur.com/9Ld7k3j.jpg" },
    { id: 7, name: "Lê Hàn Quốc", price: "280.000đ/kg", image: "https://i.imgur.com/2Kd6p4n.jpg" },
    { id: 8, name: "Kiwi New Zealand", price: "200.000đ/kg", image: "https://i.imgur.com/5Jd9p8k.jpg" }
  ];

  return (
    <Layout>
      {/* Hero Section với Slider */}
      <section className="relative h-[600px] overflow-hidden">
        {/* Slider Container */}
        <div className="relative h-full">
          {/* Slides */}
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
              
              {/* Content */}
              <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-6">
                  <div className="max-w-2xl">
                    <h1 
                      className={`text-4xl md:text-5xl font-bold text-white mb-4 transition-all duration-1000 transform ${
                        index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                      }`}
                    >
                      {slide.title}
                    </h1>
                    <p 
                      className={`text-xl text-white mb-6 transition-all duration-1000 transform delay-100 ${
                        index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                      }`}
                    >
                      {slide.subtitle}
                    </p>
                    <Link
                      to={slide.buttonLink}
                      className={`inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-full font-medium text-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
                        index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                      } delay-200`}
                    >
                      {slide.buttonText}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Slider Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Slider Indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Product Section */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-4xl font-semibold text-green-800 mb-12 text-center">
          Sản Phẩm Nổi Bật
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="group relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="overflow-hidden h-64">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-4 bg-white">
                <h3 className="text-xl font-semibold text-green-700 mb-2">
                  {product.name}
                </h3>
                <p className="text-lg text-orange-500 font-medium mb-4">{product.price}</p>
                <button className="w-full bg-green-600 text-white py-2 rounded-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-green-700">
                  Thêm vào giỏ hàng
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="bg-gradient-to-r from-green-50 to-yellow-50 py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <img src="https://i.imgur.com/5Y2n5xR.jpg" alt="Vườn trái cây" className="rounded-lg shadow-lg" />
            </div>
            <div className="md:w-1/2 md:pl-12">
              <h2 className="text-4xl font-semibold text-green-800 mb-6">
                Về Chúng Tôi
              </h2>
              <p className="text-gray-700 mb-4">
                FreshFruits cam kết mang đến những sản phẩm trái cây tươi ngon nhất, được tuyển chọn kỹ lưỡng từ các nông trại uy tín trong và ngoài nước.
              </p>
              <p className="text-gray-700 mb-6">
                Với quy trình đóng gói chuyên nghiệp và hệ thống giao hàng nhanh chóng, chúng tôi đảm bảo mỗi sản phẩm đến tay bạn vẫn giữ được độ tươi ngon như vừa thu hoạch.
              </p>
              <Link
                to="/about"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition"
              >
                Tìm hiểu thêm
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-4xl font-semibold text-green-800 mb-12 text-center">
          Khách Hàng Nói Gì Về Chúng Tôi
        </h2>
        <div className="relative max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center mb-6">
              <img
                src={testimonials[activeTestimonial].avatar}
                alt={testimonials[activeTestimonial].name}
                className="w-16 h-16 rounded-full mr-4"
              />
              <div>
                <h3 className="text-xl font-semibold text-green-700">
                  {testimonials[activeTestimonial].name}
                </h3>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-gray-700 italic text-lg">
              "{testimonials[activeTestimonial].comment}"
            </p>
          </div>
          
          <div className="flex justify-center mt-6 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`w-3 h-3 rounded-full ${index === activeTestimonial ? 'bg-green-600' : 'bg-gray-300'}`}
              ></button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">FreshFruits</h3>
              <p className="mb-4">Cung cấp trái cây tươi ngon, chất lượng cao đến tận nhà bạn.</p>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-green-300 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="hover:text-green-300 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.689-.07-4.849 0-3.259.014-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">Liên kết nhanh</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="hover:text-green-300 transition">Trang chủ</Link></li>
                <li><Link to="/product" className="hover:text-green-300 transition">Sản phẩm</Link></li>
                <li><Link to="/about" className="hover:text-green-300 transition">Giới thiệu</Link></li>
                <li><Link to="/contact" className="hover:text-green-300 transition">Liên hệ</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">Liên hệ</h3>
              <p className="mb-2">Địa chỉ: 123 Đường Trái Cây, Quận 1, TP.HCM</p>
              <p className="mb-2">Email: info@freshfruits.vn</p>
              <p className="mb-2">Điện thoại: (028) 1234 5678</p>
            </div>
          </div>
          
          <div className="border-t border-green-700 mt-8 pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} FreshFruits. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
      
      {/* Back to top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition z-40"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </Layout>
  );
};

export default HomePage;