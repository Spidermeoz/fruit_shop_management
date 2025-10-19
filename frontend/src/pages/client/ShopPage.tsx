import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
}

const ShopPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  // Giả lập dữ liệu sản phẩm (sau này thay bằng API từ backend)
  useEffect(() => {
    setProducts([
      {
        id: 1,
        name: "Rau cải xanh",
        price: 15000,
        image: "https://i.imgur.com/lhluQd3.jpg",
        category: "Rau lá",
      },
      {
        id: 2,
        name: "Cà rốt Đà Lạt",
        price: 18000,
        image: "https://i.imgur.com/Lm1gY1v.jpg",
        category: "Củ quả",
      },
      {
        id: 3,
        name: "Dưa hấu Long An",
        price: 22000,
        image: "https://i.imgur.com/6eWYWsp.jpg",
        category: "Trái cây",
      },
      {
        id: 4,
        name: "Khoai tây Đà Lạt",
        price: 20000,
        image: "https://i.imgur.com/xLRT8qV.jpg",
        category: "Củ quả",
      },
      {
        id: 5,
        name: "Táo Mỹ đỏ",
        price: 55000,
        image: "https://i.imgur.com/gYbP0Dc.jpg",
        category: "Trái cây",
      },
      {
        id: 6,
        name: "Rau muống sạch",
        price: 12000,
        image: "https://i.imgur.com/wfGYYeK.jpg",
        category: "Rau lá",
      },
    ]);
  }, []);
//   useEffect(() => {
//   fetch("http://localhost:5000/api/products")
//     .then((res) => res.json())
//     .then((data) => setProducts(data))
//     .catch(console.error);
// }, []);


  // Lọc sản phẩm theo danh mục và tìm kiếm
  const filteredProducts = products.filter((p) => {
    const matchCategory =
      selectedCategory === "Tất cả" || p.category === selectedCategory;
    const matchSearch = p.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase().trim());
    return matchCategory && matchSearch;
  });

  const categories = ["Tất cả", "Rau lá", "Củ quả", "Trái cây", "Nông sản khô"];

  return (
    <div className="bg-white min-h-screen">
      {/* Banner nhỏ */}
      <section className="bg-green-100 py-10 text-center">
        <h1 className="text-4xl font-bold text-green-800 mb-2">
          Cửa hàng của chúng tôi
        </h1>
        <p className="text-gray-700">
          Chọn cho mình những loại rau củ tươi ngon, an toàn mỗi ngày!
        </p>
      </section>

      {/* Bộ lọc */}
      <section className="container mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          {/* Ô tìm kiếm */}
          <input
            type="text"
            placeholder="🔍 Tìm sản phẩm..."
            className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Bộ lọc danh mục */}
          <div className="flex flex-wrap gap-3 justify-center md:justify-end">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full border transition ${
                  selectedCategory === cat
                    ? "bg-green-700 text-white border-green-700"
                    : "bg-white text-green-700 border-green-500 hover:bg-green-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách sản phẩm */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white border rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4 text-center">
                  <h3 className="text-lg font-semibold text-green-800 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {product.price.toLocaleString()} đ / kg
                  </p>
                  <Link
                    to={`/product/${product.id}`}
                    className="inline-block bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 py-10">
            Không tìm thấy sản phẩm nào phù hợp.
          </p>
        )}
      </section>
    </div>
  );
};

export default ShopPage;
