import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  origin: string;
  nutrition: string;
  storage: string;
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  // Giả lập dữ liệu (sau này sẽ thay bằng fetch API)
  useEffect(() => {
    const sampleData: Product[] = [
      {
        id: 1,
        name: "Táo Envy Mỹ",
        price: 250000,
        image: "https://i.imgur.com/k2P1k5M.jpg",
        category: "Trái cây nhập khẩu",
        description: "Táo Envy là một trong những loại táo ngon nhất thế giới, với vị ngọt thanh, giòn và mọng nước. Táo được trồng theo quy trình hữu cơ, không sử dụng thuốc trừ sâu hóa học.",
        origin: "Mỹ",
        nutrition: "Chất xơ, Vitamin C, Kali, Chất chống oxy hóa",
        storage: "Bảo quản trong tủ lạnh ở nhiệt độ 0-4°C, có thể giữ tươi trong 4-6 tuần."
      },
      {
        id: 2,
        name: "Cam Úc",
        price: 180000,
        image: "https://i.imgur.com/8Jk3l7n.jpg",
        category: "Trái cây nhập khẩu",
        description: "Cam Úc nổi tiếng với vị ngọt đậm, nhiều nước và hương thơm đặc trưng. Cam được tuyển chọn kỹ lưỡng từ những nông trại uy tín tại Úc.",
        origin: "Úc",
        nutrition: "Vitamin C, Folate, Chất xơ, Kali",
        storage: "Bảo quản ở nhiệt độ phòng trong 1 tuần hoặc trong tủ lạnh để giữ tươi lâu hơn."
      },
      {
        id: 3,
        name: "Cherry Mỹ",
        price: 550000,
        image: "https://i.imgur.com/5Hd9p2q.jpg",
        category: "Trái cây nhập khẩu",
        description: "Cherry Mỹ có vị ngọt thanh, giòn và mọng nước. Cherry là nguồn cung cấp chất chống oxy hóa dồi dào, tốt cho sức khỏe.",
        origin: "Mỹ",
        nutrition: "Chất chống oxy hóa, Vitamin C, Kali, Chất xơ",
        storage: "Bảo quản trong tủ lạnh, không rửa trước khi bảo quản để giữ tươi lâu hơn."
      },
      {
        id: 4,
        name: "Nho Úc",
        price: 320000,
        image: "https://i.imgur.com/7Mj4k9l.jpg",
        category: "Trái cây nhập khẩu",
        description: "Nho Úc có vị ngọt đậm, hạt nhỏ và vỏ mỏng. Nho được trồng theo quy trình hiện đại, đảm bảo chất lượng và an toàn.",
        origin: "Úc",
        nutrition: "Vitamin K, Vitamin C, Chất chống oxy hóa, Kali",
        storage: "Bảo quản trong tủ lạnh, sử dụng trong 5-7 ngày."
      },
      {
        id: 5,
        name: "Dâu Hàn Quốc",
        price: 450000,
        image: "https://i.imgur.com/3Kd8p5m.jpg",
        category: "Trái cây nhập khẩu",
        description: "Dâu Hàn Quốc nổi tiếng với vị ngọt thanh, thơm và màu sắc hấp dẫn. Dâu được trồng trong nhà kính, đảm bảo vệ sinh an toàn thực phẩm.",
        origin: "Hàn Quốc",
        nutrition: "Vitamin C, Mangan, Folate, Kali",
        storage: "Bảo quản trong tủ lạnh, không rửa trước khi bảo quản, sử dụng trong 2-3 ngày."
      },
      {
        id: 6,
        name: "Xoài Cát Hòa Lộc",
        price: 120000,
        image: "https://i.imgur.com/9Ld7k3j.jpg",
        category: "Trái cây nội địa",
        description: "Xoài Cát Hòa Lộc là một trong những loại xoài ngon nhất Việt Nam, với vị ngọt đậm, thơm và ít xơ.",
        origin: "Việt Nam",
        nutrition: "Vitamin C, Vitamin A, Chất xơ, Kali",
        storage: "Bảo quản ở nhiệt độ phòng cho đến khi chín, sau đó bảo quản trong tủ lạnh."
      }
    ];

    const found = sampleData.find((p) => p.id === Number(id));
    setProduct(found || null);
    
    // Lấy sản phẩm tương tự (cùng danh mục)
    if (found) {
      const related = sampleData.filter(p => p.category === found.category && p.id !== found.id).slice(0, 4);
      setRelatedProducts(related);
    }
  }, [id]);

  const handleAddToCart = () => {
    // Logic thêm vào giỏ hàng sẽ được triển khai sau
    alert(`Đã thêm ${quantity} kg ${product?.name} vào giỏ hàng!`);
  };

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50">
        <div className="text-center">
          <div className="mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h2 className="text-3xl text-gray-700 mb-4">
            Không tìm thấy sản phẩm
          </h2>
          <p className="text-gray-600 mb-6">Sản phẩm bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <Link
            to="/shop"
            className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            Quay lại cửa hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header nhỏ */}
      <section className="bg-gradient-to-r from-green-100 to-yellow-100 py-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-10 w-16 h-16 bg-yellow-300 rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 right-10 w-12 h-12 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            Chi tiết sản phẩm
          </h1>
          <div className="flex items-center justify-center text-gray-600">
            <Link to="/" className="hover:text-green-600 transition">Trang chủ</Link>
            <span className="mx-2">/</span>
            <Link to="/shop" className="hover:text-green-600 transition">Sản phẩm</Link>
            <span className="mx-2">/</span>
            <span className="text-green-700">{product.name}</span>
          </div>
        </div>
      </section>

      {/* Nội dung sản phẩm */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Ảnh */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-yellow-400 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative overflow-hidden rounded-lg">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {product.category}
              </div>
            </div>
          </div>

          {/* Thông tin */}
          <div>
            <h2 className="text-4xl font-bold text-green-800 mb-4">
              {product.name}
            </h2>
            
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400 mr-2">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-gray-600">(128 đánh giá)</span>
            </div>
            
            <div className="flex items-center mb-6">
              <span className="text-3xl font-bold text-green-700">
                {product.price.toLocaleString()} đ / kg
              </span>
              <span className="ml-3 text-gray-500 line-through">
                {(product.price * 1.2).toLocaleString()} đ
              </span>
              <span className="ml-2 bg-red-500 text-white px-2 py-1 rounded text-sm">-20%</span>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-700">Xuất xứ: <span className="font-medium">{product.origin}</span></span>
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Tình trạng: <span className="font-medium text-green-600">Còn hàng</span></span>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Số lượng và nút hành động */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button 
                  onClick={decreaseQuantity}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition"
                >
                  -
                </button>
                <span className="px-4 py-2 border-l border-r border-gray-300">{quantity} kg</span>
                <button 
                  onClick={increaseQuantity}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition"
                >
                  +
                </button>
              </div>
              
              <button 
                onClick={handleAddToCart}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Thêm vào giỏ hàng
              </button>
              
              <button className="border border-green-600 text-green-700 px-6 py-3 rounded-lg hover:bg-green-50 transition flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Yêu thích
              </button>
            </div>

            <div className="flex items-center space-x-4 text-gray-600">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Giao hàng trong 2-3 ngày</span>
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Đảm bảo chất lượng</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs thông tin chi tiết */}
        <div className="mt-16">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('description')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'description'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Mô tả chi tiết
              </button>
              <button
                onClick={() => setActiveTab('nutrition')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'nutrition'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dinh dưỡng
              </button>
              <button
                onClick={() => setActiveTab('storage')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'storage'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Bảo quản
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reviews'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Đánh giá (128)
              </button>
            </nav>
          </div>

          <div className="mt-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {product.description}
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  Sản phẩm được tuyển chọn kỹ lưỡng từ những nông trại uy tín, đảm bảo chất lượng và an toàn cho sức khỏe. Chúng tôi cam kết mang đến những sản phẩm tươi ngon nhất đến tay người tiêu dùng.
                </p>
              </div>
            )}

            {activeTab === 'nutrition' && (
              <div>
                <h3 className="text-xl font-semibold text-green-800 mb-4">Giá trị dinh dưỡng</h3>
                <p className="text-gray-700 mb-4">
                  {product.name} là nguồn cung cấp dồi dào các chất dinh dưỡng quan trọng cho cơ thể:
                </p>
                <div className="bg-green-50 rounded-lg p-6">
                  <p className="text-gray-700">{product.nutrition}</p>
                </div>
              </div>
            )}

            {activeTab === 'storage' && (
              <div>
                <h3 className="text-xl font-semibold text-green-800 mb-4">Hướng dẫn bảo quản</h3>
                <div className="bg-yellow-50 rounded-lg p-6">
                  <p className="text-gray-700">{product.storage}</p>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-xl font-semibold text-green-800 mb-6">Đánh giá từ khách hàng</h3>
                <div className="space-y-6">
                  {[1, 2, 3].map((review) => (
                    <div key={review} className="border-b border-gray-200 pb-6">
                      <div className="flex items-center mb-2">
                        <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold mr-3">
                          {String.fromCharCode(64 + review)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Khách hàng {review}</h4>
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700">
                        Sản phẩm rất tươi ngon, được đóng gói cẩn thận. Giao hàng nhanh chóng, sẽ tiếp tục ủng hộ shop trong lần tới.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gợi ý sản phẩm tương tự */}
      <section className="bg-gradient-to-br from-green-50 to-yellow-50 py-16">
        <div className="container mx-auto px-6">
          <h3 className="text-3xl font-semibold text-green-800 mb-8 text-center">
            Sản phẩm tương tự
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map((relatedProduct) => (
              <div
                key={relatedProduct.id}
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="overflow-hidden h-48">
                  <img
                    src={relatedProduct.image}
                    alt={relatedProduct.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <h4 className="text-lg font-semibold text-green-800 mb-2">
                    {relatedProduct.name}
                  </h4>
                  <p className="text-green-700 font-bold mb-3">
                    {relatedProduct.price.toLocaleString()} đ / kg
                  </p>
                  <Link
                    to={`/product/${relatedProduct.id}`}
                    className="block w-full text-center bg-green-600 text-white py-2 rounded-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-green-700"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-10">
            <Link
              to="/shop"
              className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Xem tất cả sản phẩm
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetailPage;