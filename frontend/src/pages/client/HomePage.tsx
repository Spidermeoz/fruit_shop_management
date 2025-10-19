import React from "react";
import { Link } from "react-router-dom";

const HomePage: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Banner */}
      <section className="relative bg-green-100 h-[400px] flex items-center justify-center text-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-green-800 mb-4">
            Rau củ quả tươi sạch mỗi ngày
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            Giao hàng tận nơi – Nông sản hữu cơ – Tươi ngon từ trang trại Việt.
          </p>
          <Link
            to="/shop"
            className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-lg font-medium"
          >
            Mua ngay
          </Link>
        </div>
      </section>

      {/* Danh mục nổi bật */}
      <section className="container mx-auto px-6 py-12">
        <h2 className="text-3xl font-semibold text-green-800 mb-8 text-center">
          Danh mục nổi bật
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: "Rau lá", image: "https://i.imgur.com/Qm2vM0P.jpg" },
            { name: "Củ quả", image: "https://i.imgur.com/HXJb3nI.jpg" },
            { name: "Trái cây", image: "https://i.imgur.com/ARX8o8X.jpg" },
            { name: "Nông sản khô", image: "https://i.imgur.com/YrAtH6x.jpg" },
            // data sản phẩm để ở đây tạm thời
          ].map((item) => (
            <div
              key={item.name}
              className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-40 object-cover"
              />
              <div className="p-4 text-center bg-white">
                <h3 className="text-lg font-semibold text-green-700">
                  {item.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Giới thiệu */}
      <section className="bg-green-50 py-12 text-center">
        <h2 className="text-3xl font-semibold text-green-800 mb-4">
          Vì sao chọn FreshFarm?
        </h2>
        <p className="text-gray-700 max-w-2xl mx-auto">
          Chúng tôi cam kết mang đến sản phẩm tươi sạch, nguồn gốc rõ ràng, thu hoạch mỗi sáng và giao tận tay khách hàng trong ngày.
        </p>
      </section>
    </div>
  );
};

export default HomePage;
