import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Layout from "../../../components/client/layout/Layout";
import { useCart } from "../../../context/CartContext";
import { http } from "../../../services/http";
import {
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ShoppingCart,
  Check,
  AlertCircle,
  Package,
  ArrowRight,
  ArrowLeft,
  Home,
  Info,
  Truck,
  FileText,
  Building,
  Smartphone,
  RefreshCw,
  Save,
  Edit,
} from "lucide-react";

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

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items: cartItems, fetchCart } = useCart();

  // List productId được chọn từ CartPage
  const selectedItems: number[] = location.state?.selectedItems || [];

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Nếu không có selected items → quay về giỏ hàng
  useEffect(() => {
    fetchCart();
    if (!selectedItems.length) navigate("/cart");
  }, []);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await http("GET", "/api/v1/client/orders/addresses");
        if (res?.success) {
          setSavedAddresses(res.data);
        }
      } catch (err) {
        console.error("Load addresses failed", err);
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchAddresses();
  }, []);

  const applySavedAddress = (addr: any) => {
    setOrderInfo((prev) => ({
      ...prev,
      name: addr.fullName,
      phone: addr.phone,
      address: addr.addressLine1,
      ward: addr.ward,
      district: addr.district,
      city: addr.province,
      note: addr.notes || "",
    }));
  };

  // Lọc item được chọn từ giỏ hàng thực
  const checkoutItems = cartItems.filter((i) =>
    selectedItems.includes(i.productId)
  );

  // ✅ Thêm hàm tính giá hiệu quả (sau khi giảm giá)
  const getEffectivePrice = (product: any) => {
    if (!product) return 0;
    if (product.discountPercentage && product.discountPercentage > 0) {
      return product.price * (1 - product.discountPercentage / 100);
    }
    return product.price;
  };

  // ✅ Cập nhật cách tính tổng tiền
  const subtotal = checkoutItems.reduce(
    (acc, item) => acc + getEffectivePrice(item.product) * item.quantity,
    0
  );

  const shippingFee = selectedItems.length > 0 ? 20000 : 0;
  const total = subtotal + shippingFee;

  // Input change handler
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setOrderInfo((prev) => ({ ...prev, [name]: target.checked }));
    } else {
      setOrderInfo((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Validate Step 1
  const validateAndNext = () => {
    const newErrors: { [key: string]: string } = {};

    if (!orderInfo.name.trim()) newErrors.name = "Họ và tên là bắt buộc";
    else if (orderInfo.name.trim().length < 2)
      newErrors.name = "Họ và tên không hợp lệ";

    if (!orderInfo.phone) newErrors.phone = "Số điện thoại là bắt buộc";
    else if (!/^0\d{9}$/.test(orderInfo.phone))
      newErrors.phone = "Số điện thoại phải bắt đầu bằng 0 và có 10 số";

    if (!orderInfo.email) newErrors.email = "Email là bắt buộc";
    else if (!/^\S+@\S+\.\S+$/.test(orderInfo.email))
      newErrors.email = "Email không hợp lệ";

    if (!orderInfo.city) newErrors.city = "Thành phố là bắt buộc";

    if (!orderInfo.district) newErrors.district = "Quận / Huyện là bắt buộc";

    if (!orderInfo.ward) newErrors.ward = "Phường / Xã là bắt buộc";

    if (!orderInfo.address) newErrors.address = "Địa chỉ là bắt buộc";
    else if (orderInfo.address.trim().length < 5)
      newErrors.address = "Địa chỉ quá ngắn";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    nextStep();
  };

  // Điều hướng step
  const nextStep = () => currentStep < 3 && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  // Submit order → gọi API thật
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkoutItems.length) {
      alert("Không có sản phẩm hợp lệ để thanh toán");
      return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        productIds: selectedItems,
        address: {
          fullName: orderInfo.name,
          phone: orderInfo.phone,
          addressLine1: orderInfo.address,
          addressLine2: "",
          ward: orderInfo.ward,
          district: orderInfo.district,
          province: orderInfo.city,
          postalCode: "",
          notes: orderInfo.note,
        },
        shippingFee: shippingFee,
        discountAmount: 0,
        paymentMethod: orderInfo.payment,
      };

      console.log("Payload being sent to backend:", payload);

      const res = await http("POST", "/api/v1/client/orders/checkout", payload);

      if (res?.success) {
        await fetchCart(); // reload giỏ hàng
        navigate(`/orders/${res.data.id}`); // chuyển sang trang chi tiết đơn hàng
      } else {
        alert(res?.message || "Lỗi đặt hàng");
      }
    } catch (err: any) {
      alert(err.message || "Lỗi không xác định");
    } finally {
      setIsProcessing(false);
    }
  };

  // Icons cho các bước
  const stepIcons = [
    <MapPin className="w-5 h-5" />,
    <CreditCard className="w-5 h-5" />,
    <Check className="w-5 h-5" />,
  ];

  // Icons cho các phương thức thanh toán
  const paymentIcons = {
    cod: <Truck className="w-5 h-5" />,
    bank: <Building className="w-5 h-5" />,
    momo: <Smartphone className="w-5 h-5" />,
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
          <h1 className="text-4xl font-bold text-green-800 mb-2 flex items-center justify-center gap-2">
            <ShoppingCart className="w-10 h-10" />
            Thanh toán
          </h1>
          <p className="text-gray-700">Điền thông tin để hoàn tất đơn hàng</p>
          <div className="flex items-center justify-center text-gray-600 mt-2">
            <Link
              to="/"
              className="hover:text-green-600 transition flex items-center gap-1"
            >
              <Home className="w-4 h-4" />
              Trang chủ
            </Link>
            <span className="mx-2">/</span>
            <Link
              to="/cart"
              className="hover:text-green-600 transition flex items-center gap-1"
            >
              <ShoppingCart className="w-4 h-4" />
              Giỏ hàng
            </Link>
            <span className="mx-2">/</span>
            <span className="text-green-700">Thanh toán</span>
          </div>
        </div>
      </section>

      {/* Steps Progress */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                    currentStep >= step
                      ? "bg-green-600 text-white shadow-lg"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {stepIcons[step - 1]}
                </div>
                <span
                  className={`ml-2 font-medium ${
                    currentStep >= step ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {step === 1 && "Thông tin giao hàng"}
                  {step === 2 && "Phương thức thanh toán"}
                  {step === 3 && "Xác nhận đơn hàng"}
                </span>
              </div>
              {step !== 3 && (
                <div
                  className={`w-16 h-1 mx-4 transition-all duration-300 ${
                    currentStep > step ? "bg-green-600" : "bg-gray-300"
                  }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 pb-10 grid md:grid-cols-3 gap-10">
        {/* LEFT SIDE — FORM */}
        <div className="md:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-md overflow-hidden"
          >
            {/* STEP 1 */}
            {currentStep === 1 && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-green-800 mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Thông tin người nhận
                </h2>

                {/* LIST SAVED ADDRESSES */}
                {!loadingAddresses && savedAddresses.length > 0 && (
                  <div className="mb-6 bg-green-50 p-4 rounded-xl border border-green-200">
                    <h3 className="text-green-700 font-medium mb-3 flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Địa chỉ đã từng sử dụng
                    </h3>

                    <div className="space-y-3">
                      {savedAddresses.map((addr, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white rounded-lg border hover:border-green-500 cursor-pointer transition flex items-start gap-3"
                          onClick={() => applySavedAddress(addr)}
                        >
                          <div className="mt-1">
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">
                              {addr.fullName} — {addr.phone}
                            </p>
                            <p className="text-gray-600 text-sm">
                              {addr.addressLine1}, {addr.ward}, {addr.district},{" "}
                              {addr.province}
                            </p>
                            {addr.notes && (
                              <p className="text-gray-500 text-xs mt-1">
                                Ghi chú: {addr.notes}
                              </p>
                            )}
                          </div>
                          <button className="text-green-600 hover:text-green-800">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Name + Phone */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={orderInfo.name}
                      onChange={handleChange}
                      className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                        errors.name ? "border-red-500" : ""
                      }`}
                      placeholder="Nhập họ và tên của bạn"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={orderInfo.phone}
                      onChange={handleChange}
                      className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                        errors.phone ? "border-red-500" : ""
                      }`}
                      placeholder="0xxxxxxxxx"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-700 mb-2 flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={orderInfo.email}
                    onChange={handleChange}
                    className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                      errors.email ? "border-red-500" : ""
                    }`}
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* City / District / Ward */}
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block mb-2 text-sm text-gray-700 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Thành phố *
                    </label>
                    <input
                      name="city"
                      value={orderInfo.city}
                      onChange={handleChange}
                      className={`w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                        errors.city ? "border-red-500" : ""
                      }`}
                      placeholder="VD: Hồ Chí Minh"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 text-sm text-gray-700 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Quận / Huyện *
                    </label>
                    <input
                      name="district"
                      value={orderInfo.district}
                      onChange={handleChange}
                      className={`w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                        errors.district ? "border-red-500" : ""
                      }`}
                      placeholder="VD: Quận 1"
                    />
                    {errors.district && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.district}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 text-sm text-gray-700 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Phường / Xã *
                    </label>
                    <input
                      name="ward"
                      value={orderInfo.ward}
                      onChange={handleChange}
                      className={`w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                        errors.ward ? "border-red-500" : ""
                      }`}
                      placeholder="VD: Phường 5"
                    />
                    {errors.ward && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.ward}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="mb-6">
                  <label className="block text-sm text-gray-700 mb-2 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Địa chỉ cụ thể *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={orderInfo.address}
                    onChange={handleChange}
                    className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                      errors.address ? "border-red-500" : ""
                    }`}
                    placeholder="Số nhà, tên đường..."
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.address}
                    </p>
                  )}
                </div>

                {/* Note */}
                <div className="mb-6">
                  <label className="block text-sm text-gray-700 mb-2 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Ghi chú (tuỳ chọn)
                  </label>
                  <textarea
                    name="note"
                    rows={3}
                    value={orderInfo.note}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    placeholder="Ghi chú cho đơn hàng..."
                  ></textarea>
                </div>

                {/* Buttons */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={validateAndNext}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                  >
                    Tiếp tục
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-green-800 mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Phương thức thanh toán
                </h2>

                <div className="space-y-4 mb-6">
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-green-50 transition border-green-500 bg-green-50">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={orderInfo.payment === "cod"}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        {paymentIcons.cod}
                      </div>
                      <div>
                        <span className="font-medium">
                          Thanh toán khi nhận hàng (COD)
                        </span>
                        <p className="text-sm text-gray-500">
                          Thanh toán bằng tiền mặt khi nhận hàng
                        </p>
                      </div>
                    </div>
                  </label>

                  <div className="flex items-center p-4 border rounded-lg">
                    <input
                      type="radio"
                      name="payment"
                      value="bank"
                      checked={false}
                      onChange={() => {}}
                      className="mr-3"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(
                          "Phương thức thanh toán này đang được cập nhật, vui lòng chọn phương thức COD."
                        );
                      }}
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        {paymentIcons.bank}
                      </div>
                      <div>
                        <span className="font-medium">
                          Chuyển khoản ngân hàng
                        </span>
                        <p className="text-sm text-gray-500">
                          Chuyển khoản qua ngân hàng
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                      Sắp cập nhật
                    </span>
                  </div>

                  <div className="flex items-center p-4 border rounded-lg">
                    <input
                      type="radio"
                      name="payment"
                      value="momo"
                      checked={false}
                      onChange={() => {}}
                      className="mr-3"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(
                          "Phương thức thanh toán này đang được cập nhật, vui lòng chọn phương thức COD."
                        );
                      }}
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600">
                        {paymentIcons.momo}
                      </div>
                      <div>
                        <span className="font-medium">Ví MoMo</span>
                        <p className="text-sm text-gray-500">
                          Thanh toán qua ví điện tử MoMo
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                      Sắp cập nhật
                    </span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="border px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                  >
                    Tiếp tục
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-green-800 mb-6 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Xác nhận đơn hàng
                </h2>

                {/* Shipping info */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Thông tin người nhận
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Họ tên</p>
                      <p className="font-medium">{orderInfo.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">SĐT</p>
                      <p className="font-medium">{orderInfo.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{orderInfo.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Địa chỉ</p>
                      <p className="font-medium">
                        {orderInfo.address}, {orderInfo.ward},{" "}
                        {orderInfo.district}, {orderInfo.city}
                      </p>
                    </div>
                  </div>
                  {orderInfo.note && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500">Ghi chú</p>
                      <p className="font-medium">{orderInfo.note}</p>
                    </div>
                  )}
                </div>

                {/* Payment */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Phương thức thanh toán
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                      {paymentIcons.cod}
                    </div>
                    <div>
                      <p className="font-medium">
                        Thanh toán khi nhận hàng (COD)
                      </p>
                      <p className="text-sm text-gray-500">
                        Thanh toán bằng tiền mặt khi nhận hàng
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="border px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại
                  </button>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Xác nhận đặt hàng
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* RIGHT SIDE — ORDER SUMMARY */}
        <div>
          <div className="bg-gradient-to-br from-green-50 to-yellow-50 rounded-2xl p-6 shadow-md sticky top-6">
            <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Đơn hàng của bạn
            </h3>

            <div className="space-y-4 mb-6">
              {checkoutItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg"
                >
                  <img
                    src={item.product?.thumbnail || ""}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">
                      {item.product?.title}
                    </h4>
                    <p className="text-sm text-gray-500">x{item.quantity}</p>
                  </div>

                  {/* ✅ Cập nhật cách hiển thị giá */}
                  <div className="text-right">
                    {(item.product?.discountPercentage ?? 0) > 0 ? (
                      <div>
                        <div className="text-green-700 font-medium">
                          {(
                            getEffectivePrice(item.product) * item.quantity
                          ).toLocaleString()}{" "}
                          đ
                        </div>
                        <div className="text-sm text-gray-500 line-through">
                          {(
                            (item.product?.price || 0) * item.quantity
                          ).toLocaleString()}{" "}
                          đ
                        </div>
                        <div className="text-xs bg-red-500 text-white px-2 py-1 rounded mt-1">
                          -{(item.product?.discountPercentage || 0)}%
                        </div>
                      </div>
                    ) : (
                      <div className="text-green-700 font-medium">
                        {(
                          (item.product?.price || 0) * item.quantity
                        ).toLocaleString()}{" "}
                        đ
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span>{subtotal.toLocaleString()} đ</span>
              </div>

              <div className="flex justify-between">
                <span>Phí giao hàng:</span>
                <span>{shippingFee.toLocaleString()} đ</span>
              </div>

              <div className="flex justify-between font-bold text-lg text-green-700 pt-2 border-t">
                <span>Tổng cộng:</span>
                <span>{total.toLocaleString()} đ</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Bằng cách đặt hàng, bạn đồng ý với điều khoản sử dụng của
                  chúng tôi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
