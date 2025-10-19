import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);

  // Giả lập dữ liệu (sau này sẽ thay bằng fetch API)
  useEffect(() => {
    const sampleData: Product[] = [
      {
        id: 1,
        name: "Rau cải xanh",
        price: 15000,
        image: "https://i.imgur.com/lhluQd3.jpg",
        category: "Rau lá",
        description:
          "Rau cải xanh tươi, được trồng theo quy trình hữu cơ, không sử dụng thuốc trừ sâu. Thích hợp cho các món luộc, xào, hoặc nấu canh.",
      },
      {
        id: 2,
        name: "Cà rốt Đà Lạt",
        price: 18000,
        image: "https://i.imgur.com/Lm1gY1v.jpg",
        category: "Củ quả",
        description:
          "Cà rốt tươi giòn, màu sắc tự nhiên, chứa nhiều vitamin A tốt cho mắt và sức khỏe. Thích hợp ép nước, nấu canh hoặc salad.",
      },
      {
        id: 3,
        name: "Dưa hấu Long An",
        price: 22000,
        image: "https://i.imgur.com/6eWYWsp.jpg",
        category: "Trái cây",
        description:
          "Dưa hấu Long An nổi tiếng với độ ngọt thanh và mọng nước. Thích hợp làm món tráng miệng mùa hè hoặc ép nước giải khát.",
      },
    ];

    const found = sampleData.find((p) => p.id === Number(id));
    setProduct(found || null);
  }, [id]);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-2xl text-gray-700 mb-4">
          Không tìm thấy sản phẩm
        </h2>
        <Link
          to="/shop"
          className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800"
        >
          Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header nhỏ */}
      <section className="bg-green-100 py-6 text-center">
        <h1 className="text-3xl font-bold text-green-800">
          Chi tiết sản phẩm
        </h1>
      </section>

      {/* Nội dung sản phẩm */}
      <div className="container mx-auto px-6 py-10 grid md:grid-cols-2 gap-10 items-center">
        {/* Ảnh */}
        <div className="flex justify-center">
          <img
            src={product.image}
            alt={product.name}
            className="rounded-2xl shadow-md w-full max-w-md object-cover"
          />
        </div>

        {/* Thông tin */}
        <div>
          <h2 className="text-3xl font-semibold text-green-800 mb-3">
            {product.name}
          </h2>
          <p className="text-gray-600 mb-4">
            Danh mục:{" "}
            <span className="text-green-700 font-medium">
              {product.category}
            </span>
          </p>
          <p className="text-2xl font-bold text-green-700 mb-6">
            {product.price.toLocaleString()} đ / kg
          </p>
          <p className="text-gray-700 leading-relaxed mb-8">
            {product.description}
          </p>

          {/* Nút hành động */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800 transition">
              🛒 Thêm vào giỏ hàng
            </button>
            <Link
              to="/shop"
              className="border border-green-600 text-green-700 px-6 py-3 rounded-lg hover:bg-green-50 transition text-center"
            >
              ← Quay lại cửa hàng
            </Link>
          </div>
        </div>
      </div>

      {/* Gợi ý sản phẩm tương tự */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-6">
          <h3 className="text-2xl font-semibold text-green-800 mb-6">
            Sản phẩm tương tự
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {["Rau muống", "Khoai tây", "Cà chua", "Xà lách"].map(
              (name, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border shadow-sm hover:shadow-md p-4 text-center transition"
                >
                  <div className="w-full h-40 bg-green-50 rounded-lg mb-3" />
                  <h4 className="text-lg font-medium text-green-800">{name}</h4>
                  <p className="text-gray-600 text-sm">Từ 15.000 đ / kg</p>
                </div>
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetailPage;
