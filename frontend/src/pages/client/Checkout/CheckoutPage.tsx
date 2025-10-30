import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../../components/client/layout/Layout";

interface OrderInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  note: string;
  payment: string;
  saveInfo: boolean;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  origin: string;
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderInfo, setOrderInfo] = useState<OrderInfo>({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    district: "",
    ward: "",
    note: "",
    payment: "cod",
    saveInfo: false,
  });

  // Giả lập dữ liệu giỏ hàng
  const cartItems: CartItem[] = [
    {
      id: 1,
      name: "Táo Envy Mỹ",
      price: 250000,
      quantity: 2,
      image: "https://i.imgur.com/k2P1k5M.jpg",
      category: "Trái cây nhập khẩu",
      origin: "Mỹ"
    },
    {
      id: 2,
      name: "Cam Úc",
      price: 180000,
      quantity: 1,
      image: "https://i.imgur.com/8Jk3l7n.jpg",
      category: "Trái cây nhập khẩu",
      origin: "Úc"
    },
    {
      id: 3,
      name: "Cherry Mỹ",
      price: 550000,
      quantity: 1,
      image: "https://i.imgur.com/5Hd9p2q.jpg",
      category: "Trái cây nhập khẩu",
      origin: "Mỹ"
    },
  ];

  // Tính tổng tiền
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const shippingFee = 20000;
  const discount = subtotal * 0.1; // Giả sử có giảm giá 10%
  const total = subtotal + shippingFee - discount;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setOrderInfo((prev) => ({ ...prev, [name]: target.checked }));
    } else {
      setOrderInfo((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Giả lập xử lý đơn hàng
    setTimeout(() => {
      setIsProcessing(false);
      alert("Đặt hàng thành công! Cảm ơn bạn đã mua hàng.");
      navigate("/orders");
    }, 2000);
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Layout>
      {/* Header nhỏ */}
      <section className="bg-gradient-to-r from-green-100 to-yellow-100 py-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-10 w-16 h-16 bg-yellow-300 rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 right-10 w-12 h-12 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-green-800 mb-2">Thanh toán</h1>
          <p className="text-gray-700">Điền thông tin để hoàn tất đơn hàng</p>
          <div className="flex items-center justify-center text-gray-600 mt-2">
            <Link to="/" className="hover:text-green-600 transition">Trang chủ</Link>
            <span className="mx-2">/</span>
            <Link to="/cart" className="hover:text-green-600 transition">Giỏ hàng</Link>
            <span className="mx-2">/</span>
            <span className="text-green-700">Thanh toán</span>
          </div>
        </div>
      </section>

      {/* Steps */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              currentStep >= 1 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              1
            </div>
            <span className={`ml-2 font-medium ${
              currentStep >= 1 ? 'text-green-600' : 'text-gray-500'
            }`}>Thông tin giao hàng</span>
          </div>
          
          <div className={`w-16 h-1 mx-4 ${
            currentStep >= 2 ? 'bg-green-600' : 'bg-gray-300'
          }`}></div>
          
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              currentStep >= 2 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
            <span className={`ml-2 font-medium ${
              currentStep >= 2 ? 'text-green-600' : 'text-gray-500'
            }`}>Phương thức thanh toán</span>
          </div>
          
          <div className={`w-16 h-1 mx-4 ${
              currentStep >= 3 ? 'bg-green-600' : 'bg-gray-300'
            }`}></div>
            
            <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              currentStep >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              3
            </div>
            <span className={`ml-2 font-medium ${
              currentStep >= 3 ? 'text-green-600' : 'text-gray-500'
            }`}>Xác nhận đơn hàng</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 pb-10">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Form thanh toán */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md overflow-hidden">
              {/* Step 1: Thông tin giao hàng */}
              {currentStep === 1 && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-green-800 mb-6">
                    Thông tin người nhận
                  </h2>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Nhập họ và tên của bạn"
                        value={orderInfo.name}
                        onChange={handleChange}
                        required
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Nhập số điện thoại của bạn"
                        value={orderInfo.phone}
                        onChange={handleChange}
                        required
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Nhập email của bạn"
                      value={orderInfo.email}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Tỉnh/Thành phố <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="city"
                        value={orderInfo.city}
                        onChange={handleChange}
                        required
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Chọn tỉnh/thành phố</option>
                        <option value="hcm">Hồ Chí Minh</option>
                        <option value="hanoi">Hà Nội</option>
                        <option value="danang">Đà Nẵng</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Quận/Huyện <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="district"
                        value={orderInfo.district}
                        onChange={handleChange}
                        required
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Chọn quận/huyện</option>
                        <option value="1">Quận 1</option>
                        <option value="2">Quận 2</option>
                        <option value="3">Quận 3</option>
                        <option value="7">Quận 7</option>
                        <option value="binhthanh">Quận Bình Thạnh</option>
                        <option value="phunhuan">Quận Phú Nhuận</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Phường/Xã <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="ward"
                        value={orderInfo.ward}
                        onChange={handleChange}
                        required
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Chọn phường/xã</option>
                        <option value="1">Phường 1</option>
                        <option value="2">Phường 2</option>
                        <option value="3">Phường 3</option>
                        <option value="4">Phường 4</option>
                        <option value="5">Phường 5</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Địa chỉ cụ thể <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      placeholder="Số nhà, tên đường..."
                      value={orderInfo.address}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Ghi chú (tùy chọn)
                    </label>
                    <textarea
                      name="note"
                      placeholder="Ghi chú thêm về đơn hàng..."
                      value={orderInfo.note}
                      onChange={handleChange}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    ></textarea>
                  </div>

                  <div className="mb-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="saveInfo"
                        checked={orderInfo.saveInfo}
                        onChange={handleChange}
                        className="mr-2 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-gray-700">Lưu thông tin cho lần mua hàng tiếp theo</span>
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={nextStep}
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      Tiếp tục
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Phương thức thanh toán */}
              {currentStep === 2 && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-green-800 mb-6">
                    Phương thức thanh toán
                  </h2>

                  <div className="space-y-4 mb-6">
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-green-50 transition">
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={orderInfo.payment === "cod"}
                        onChange={handleChange}
                        className="mr-3 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex items-center flex-1">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800">Thanh toán khi nhận hàng (COD)</h3>
                          <p className="text-sm text-gray-600">Thanh toán bằng tiền mặt khi nhận hàng</p>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-green-50 transition">
                      <input
                        type="radio"
                        name="payment"
                        value="bank"
                        checked={orderInfo.payment === "bank"}
                        onChange={handleChange}
                        className="mr-3 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex items-center flex-1">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800">Chuyển khoản ngân hàng</h3>
                          <p className="text-sm text-gray-600">Chuyển khoản qua ngân hàng hoặc Internet Banking</p>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-green-50 transition">
                      <input
                        type="radio"
                        name="payment"
                        value="momo"
                        checked={orderInfo.payment === "momo"}
                        onChange={handleChange}
                        className="mr-3 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex items-center flex-1">
                        <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mr-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800">Ví MoMo</h3>
                          <p className="text-sm text-gray-600">Thanh toán qua ví điện tử MoMo</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      Tiếp tục
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Xác nhận đơn hàng */}
              {currentStep === 3 && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-green-800 mb-6">
                    Xác nhận đơn hàng
                  </h2>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-gray-800 mb-3">Thông tin người nhận</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Họ và tên:</span> {orderInfo.name}</p>
                      <p><span className="font-medium">Số điện thoại:</span> {orderInfo.phone}</p>
                      <p><span className="font-medium">Email:</span> {orderInfo.email}</p>
                      <p><span className="font-medium">Địa chỉ:</span> {orderInfo.address}, {orderInfo.ward}, {orderInfo.district}, {orderInfo.city}</p>
                      {orderInfo.note && <p><span className="font-medium">Ghi chú:</span> {orderInfo.note}</p>}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-gray-800 mb-3">Phương thức thanh toán</h3>
                    <p className="text-sm">
                      {orderInfo.payment === "cod" && "Thanh toán khi nhận hàng (COD)"}
                      {orderInfo.payment === "bank" && "Chuyển khoản ngân hàng"}
                      {orderInfo.payment === "momo" && "Ví MoMo"}
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
                    >
                      Quay lại
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Đang xử lý...
                        </>
                      ) : (
                        "Xác nhận đặt hàng"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Thông tin đơn hàng */}
          <div>
            <div className="bg-gradient-to-br from-green-50 to-yellow-50 rounded-2xl p-6 shadow-md sticky top-6">
              <h3 className="text-xl font-semibold text-green-800 mb-4">
                Đơn hàng của bạn
              </h3>
              
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{item.name}</h4>
                      <p className="text-sm text-gray-500">{item.category}</p>
                      <p className="text-sm text-gray-500">x{item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-700">
                        {(item.price * item.quantity).toLocaleString()} đ
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Tạm tính:</span>
                  <span>{subtotal.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Phí giao hàng:</span>
                  <span>{shippingFee.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá:</span>
                  <span>-{discount.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between text-green-800 font-bold text-lg pt-2 border-t">
                  <span>Tổng cộng:</span>
                  <span>{total.toLocaleString()} đ</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-white rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Mã giảm giá</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nhập mã giảm giá"
                    defaultValue="FRESH10"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled
                  />
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                    Áp dụng
                  </button>
                </div>
                <p className="text-xs text-green-600 mt-1">Đã áp dụng mã giảm giá 10%</p>
              </div>
              
              <div className="mt-6 p-4 bg-white rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Chính sách bảo hành</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 mr-1 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Hoàn tiền nếu sản phẩm không đạt chất lượng
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 mr-1 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Giao hàng nhanh trong 2-3 ngày
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 mr-1 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Đóng gói cẩn thận, giữ nguyên độ tươi ngon
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;