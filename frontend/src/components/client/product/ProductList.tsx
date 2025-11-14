import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/Layout";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  origin: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  discount?: number;
}

const ProductListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [sortBy, setSortBy] = useState("default");
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const productsPerPage = 12;

  // Giả lập dữ liệu sản phẩm
  useEffect(() => {
    const sampleData: Product[] = [
      {
        id: 1,
        name: "Táo Envy Mỹ",
        price: 250000,
        image: "https://i.imgur.com/k2P1k5M.jpg",
        category: "Trái cây nhập khẩu",
        origin: "Mỹ",
        rating: 4.8,
        reviews: 128,
        inStock: true,
        discount: 10
      },
      {
        id: 2,
        name: "Cam Úc",
        price: 180000,
        image: "https://i.imgur.com/8Jk3l7n.jpg",
        category: "Trái cây nhập khẩu",
        origin: "Úc",
        rating: 4.7,
        reviews: 95,
        inStock: true
      },
      {
        id: 3,
        name: "Cherry Mỹ",
        price: 550000,
        image: "https://i.imgur.com/5Hd9p2q.jpg",
        category: "Trái cây nhập khẩu",
        origin: "Mỹ",
        rating: 4.9,
        reviews: 76,
        inStock: true,
        discount: 15
      },
      {
        id: 4,
        name: "Nho Úc",
        price: 320000,
        image: "https://i.imgur.com/7Mj4k9l.jpg",
        category: "Trái cây nhập khẩu",
        origin: "Úc",
        rating: 4.6,
        reviews: 54,
        inStock: true
      },
      {
        id: 5,
        name: "Dâu Hàn Quốc",
        price: 450000,
        image: "https://i.imgur.com/3Kd8p5m.jpg",
        category: "Trái cây nhập khẩu",
        origin: "Hàn Quốc",
        rating: 4.9,
        reviews: 112,
        inStock: true,
        discount: 5
      },
      {
        id: 6,
        name: "Xoài Cát Hòa Lộc",
        price: 120000,
        image: "https://i.imgur.com/9Ld7k3j.jpg",
        category: "Trái cây nội địa",
        origin: "Việt Nam",
        rating: 4.7,
        reviews: 87,
        inStock: true
      },
      {
        id: 7,
        name: "Lê Hàn Quốc",
        price: 280000,
        image: "https://i.imgur.com/2Kd6p4n.jpg",
        category: "Trái cây nhập khẩu",
        origin: "Hàn Quốc",
        rating: 4.5,
        reviews: 43,
        inStock: true
      },
      {
        id: 8,
        name: "Kiwi New Zealand",
        price: 200000,
        image: "https://i.imgur.com/5Jd9p8k.jpg",
        category: "Trái cây nhập khẩu",
        origin: "New Zealand",
        rating: 4.6,
        reviews: 67,
        inStock: true
      },
      {
        id: 9,
        name: "Bưởi Da Xanh",
        price: 90000,
        image: "https://i.imgur.com/6Ld9k2j.jpg",
        category: "Trái cây nội địa",
        origin: "Việt Nam",
        rating: 4.8,
        reviews: 102,
        inStock: true
      },
      {
        id: 10,
        name: "Thanh Long Ruột Đỏ",
        price: 110000,
        image: "https://i.imgur.com/3Kd8p5m.jpg",
        category: "Trái cây nội địa",
        origin: "Việt Nam",
        rating: 4.7,
        reviews: 89,
        inStock: true
      },
      {
        id: 11,
        name: "Sầu Riêng Ri6",
        price: 150000,
        image: "https://i.imgur.com/9Ld7k3j.jpg",
        category: "Trái cây nội địa",
        origin: "Việt Nam",
        rating: 4.9,
        reviews: 156,
        inStock: true,
        discount: 8
      },
      {
        id: 12,
        name: "Chôm Chôm",
        price: 80000,
        image: "https://i.imgur.com/5Jd9p8k.jpg",
        category: "Trái cây nội địa",
        origin: "Việt Nam",
        rating: 4.5,
        reviews: 72,
        inStock: true
      },
      {
        id: 13,
        name: "Mận Úc",
        price: 220000,
        image: "https://i.imgur.com/2Kd6p4n.jpg",
        category: "Trái cây nhập khẩu",
        origin: "Úc",
        rating: 4.4,
        reviews: 38,
        inStock: false
      },
      {
        id: 14,
        name: "Lựu Đỏ",
        price: 180000,
        image: "https://i.imgur.com/6Ld9k2j.jpg",
        category: "Trái cây nhập khẩu",
        origin: "Mỹ",
        rating: 4.6,
        reviews: 61,
        inStock: true
      },
      {
        id: 15,
        name: "Vải Thiều",
        price: 130000,
        image: "https://i.imgur.com/3Kd8p5m.jpg",
        category: "Trái cây nội địa",
        origin: "Việt Nam",
        rating: 4.8,
        reviews: 124,
        inStock: true,
        discount: 12
      },
      {
        id: 16,
        name: "Na Đài Loan",
        price: 350000,
        image: "https://i.imgur.com/9Ld7k3j.jpg",
        category: "Trái cây nhập khẩu",
        origin: "Đài Loan",
        rating: 4.7,
        reviews: 93,
        inStock: true
      }
    ];

    // Giả lập tải dữ liệu
    setTimeout(() => {
      setProducts(sampleData);
      setFilteredProducts(sampleData);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Lấy danh sách các danh mục
  const categories = ["Tất cả", ...Array.from(new Set(products.map(p => p.category)))];

  // Áp dụng bộ lọc
  useEffect(() => {
    let filtered = [...products];

    // Lọc theo từ khóa tìm kiếm
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Lọc theo danh mục
    if (selectedCategory !== "Tất cả") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Lọc theo khoảng giá
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Sắp xếp
    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // Mặc định, không sắp xếp
        break;
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi bộ lọc
  }, [products, searchTerm, selectedCategory, priceRange, sortBy]);

  // Tính toán sản phẩm cho trang hiện tại
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Thay đổi trang
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Xử lý thay đổi khoảng giá
  const handlePriceRangeChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newPriceRange = [...priceRange];
    newPriceRange[index] = parseInt(e.target.value);
    setPriceRange(newPriceRange);
  };

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-to-r from-green-100 to-yellow-100 py-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-10 w-16 h-16 bg-yellow-300 rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 right-10 w-12 h-12 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-green-800 mb-2">Cửa hàng trái cây</h1>
          <p className="text-gray-700">Khám phá những loại trái cây tươi ngon nhất từ khắp nơi trên thế giới</p>
          <div className="flex items-center justify-center text-gray-600 mt-2">
            <Link to="/" className="hover:text-green-600 transition">Trang chủ</Link>
            <span className="mx-2">/</span>
            <span className="text-green-700">Sản phẩm</span>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Bộ lọc bên trái */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-green-800 mb-4">Bộ lọc sản phẩm</h2>
              
              {/* Tìm kiếm */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">Tìm kiếm</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nhập tên sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Danh mục */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">Danh mục</label>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === category}
                        onChange={() => setSelectedCategory(category)}
                        className="mr-2 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Khoảng giá */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">Khoảng giá</label>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Từ: {priceRange[0].toLocaleString()}đ</label>
                    <input
                      type="range"
                      min="0"
                      max="1000000"
                      step="10000"
                      value={priceRange[0]}
                      onChange={(e) => handlePriceRangeChange(e, 0)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Đến: {priceRange[1].toLocaleString()}đ</label>
                    <input
                      type="range"
                      min="0"
                      max="1000000"
                      step="10000"
                      value={priceRange[1]}
                      onChange={(e) => handlePriceRangeChange(e, 1)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Sắp xếp */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">Sắp xếp theo</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="default">Mặc định</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                  <option value="rating">Đánh giá cao nhất</option>
                  <option value="name">Tên A-Z</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("Tất cả");
                  setSortBy("default");
                  setPriceRange([0, 1000000]);
                }}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="lg:w-3/4">
            {/* Kết quả tìm kiếm */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-700">
                Hiển thị {currentProducts.length} / {filteredProducts.length} sản phẩm
              </p>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">Hiển thị:</span>
                <div className="flex border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setCurrentPage(1)}
                    className={`px-3 py-1 ${currentPage === 1 ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                  >
                    1
                  </button>
                  <button
                    onClick={() => setCurrentPage(2)}
                    className={`px-3 py-1 ${currentPage === 2 ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                  >
                    2
                  </button>
                </div>
              </div>
            </div>

            {/* Loading state */}
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <>
                {/* Grid sản phẩm */}
                {currentProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentProducts.map((product) => (
                      <div
                        key={product.id}
                        className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                      >
                        <div className="relative overflow-hidden h-56">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          {product.discount && (
                            <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                              -{product.discount}%
                            </div>
                          )}
                          {!product.inStock && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <span className="text-white font-semibold text-lg">Hết hàng</span>
                            </div>
                          )}
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button className="bg-white p-2 rounded-full shadow-md hover:bg-green-50 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-green-600 font-medium">{product.category}</span>
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-xs text-gray-600 ml-1"><Link to={`/review/${product.id}`}>{product.rating} ({product.reviews})</Link></span>
                            </div>
                          </div>
                          <h3 className="text-lg font-semibold text-green-800 mb-2">{product.name}</h3>
                          <p className="text-xs text-gray-500 mb-3">Xuất xứ: {product.origin}</p>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              {product.discount ? (
                                <>
                                  <span className="text-lg font-bold text-green-700">
                                    {(product.price * (1 - product.discount / 100)).toLocaleString()} đ
                                  </span>
                                  <span className="text-sm text-gray-500 line-through ml-2">
                                    {product.price.toLocaleString()} đ
                                  </span>
                                </>
                              ) : (
                                <span className="text-lg font-bold text-green-700">
                                  {product.price.toLocaleString()} đ
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              to={`/product/${product.id}`}
                              className="flex-1 bg-green-600 text-white py-2 rounded-lg text-center font-medium hover:bg-green-700 transition"
                            >
                              Xem chi tiết
                            </Link>
                            <button
                              className={`px-3 py-2 rounded-lg font-medium transition ${
                                product.inStock
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                              disabled={!product.inStock}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-2xl text-gray-700 mb-4">Không tìm thấy sản phẩm</h2>
                    <p className="text-gray-600 mb-6">Không có sản phẩm nào phù hợp với bộ lọc của bạn.</p>
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("Tất cả");
                        setSortBy("default");
                        setPriceRange([0, 1000000]);
                      }}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                )}

                {/* Phân trang */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-10">
                    <nav className="flex items-center space-x-2">
                      <button
                        onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-2 rounded-lg ${
                          currentPage === 1
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-700 hover:bg-green-50 border border-gray-300"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      {[...Array(totalPages)].map((_, index) => (
                        <button
                          key={index}
                          onClick={() => paginate(index + 1)}
                          className={`px-4 py-2 rounded-lg ${
                            currentPage === index + 1
                              ? "bg-green-600 text-white"
                              : "bg-white text-gray-700 hover:bg-green-50 border border-gray-300"
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-2 rounded-lg ${
                          currentPage === totalPages
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-700 hover:bg-green-50 border border-gray-300"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Banner khuyến mãi */}
      <section className="bg-gradient-to-r from-green-600 to-yellow-500 py-12 mt-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Khuyến mãi đặc biệt</h2>
          <p className="text-white text-lg mb-6">Nhập mã "FRESH20" để được giảm 20% cho đơn hàng đầu tiên!</p>
          <Link
            to="/product"
            className="inline-block bg-white text-green-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition"
          >
            Mua sắm ngay
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default ProductListPage;