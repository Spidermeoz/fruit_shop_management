import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import { useCart } from "../../../context/CartContext";
import { http } from "../../../services/http";
import { useToast } from "../../../context/ToastContext"; // Import Global Toast
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
  Building,
  Smartphone,
  RefreshCw,
  Save,
  FileText,
} from "lucide-react";
import Footer from "../../../components/client/layouts/Footer";

interface Location {
  name: string;
  code: number;
}

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
  const { showErrorToast } = useToast(); // Gọi hook UseToast

  // List product variants được chọn từ CartPage
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
  const [showAllAddresses, setShowAllAddresses] = useState(false);

  // location
  const [cities, setCities] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [wards, setWards] = useState<Location[]>([]);
  const [cityLoaded, setCityLoaded] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newOrderId, setNewOrderId] = useState<string | null>(null);

  const handleClearForm = () => {
    setOrderInfo({
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
    setErrors({}); // Xóa toàn bộ báo lỗi đỏ
    setDistricts([]); // Làm trống danh sách quận/huyện
    setWards([]); // Làm trống danh sách phường/xã
  };

  // Nếu không có selected items → quay về giỏ hàng
  useEffect(() => {
    fetchCart();
    if (!selectedItems.length) navigate("/cart");
  }, [fetchCart, navigate, selectedItems.length]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [currentStep]);

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

  const visibleAddresses = showAllAddresses
    ? savedAddresses
    : savedAddresses.slice(0, 3);

  const applySavedAddress = async (addr: any) => {
    try {
      let cityList = cities;
      // Nếu chưa có list thành phố thì load trước
      if (!cityList.length) {
        const res = await fetch("https://provinces.open-api.vn/api/p/");
        cityList = await res.json();
        setCities(cityList);
        setCityLoaded(true);
      }

      const city = cityList.find((c) => c.name === addr.province);
      let districtList: Location[] = [];
      let wardList: Location[] = [];

      if (city) {
        const districtRes = await fetch(
          `https://provinces.open-api.vn/api/p/${city.code}?depth=2`,
        );
        const districtData = await districtRes.json();
        districtList = districtData.districts || [];
        setDistricts(districtList);

        const district = districtList.find((d) => d.name === addr.district);

        if (district) {
          const wardRes = await fetch(
            `https://provinces.open-api.vn/api/d/${district.code}?depth=2`,
          );
          const wardData = await wardRes.json();
          wardList = wardData.wards || [];
          setWards(wardList);
        } else {
          setWards([]);
        }
      } else {
        setDistricts([]);
        setWards([]);
      }

      setOrderInfo((prev) => ({
        ...prev,
        name: addr.fullName || "",
        phone: addr.phone || "",
        email: addr.email || prev.email || "",
        address: addr.addressLine1 || "",
        city: addr.province || "",
        district: addr.district || "",
        ward: addr.ward || "",
        note: prev.note || "",
      }));

      setErrors({});
    } catch (err) {
      console.error("Apply saved address failed", err);
    }
  };

  // Lọc item được chọn từ giỏ hàng thực
  const checkoutItems = cartItems.filter((i) =>
    selectedItems.includes(i.productVariantId),
  );

  // Hàm tính giá hiệu quả (sau khi giảm giá)
  const getEffectivePrice = (item: any) => {
    if (typeof item.unitPrice === "number") return item.unitPrice;
    if (typeof item.variant?.price === "number") return item.variant.price;
    return 0;
  };

  const subtotal = checkoutItems.reduce(
    (acc, item) => acc + getEffectivePrice(item) * item.quantity,
    0,
  );

  const shippingFee = selectedItems.length > 0 ? 20000 : 0;
  const total = subtotal + shippingFee;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setOrderInfo((prev) => ({ ...prev, [name]: target.checked }));
    } else {
      setOrderInfo((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateAndNext = () => {
    const newErrors: { [key: string]: string } = {};

    if (!orderInfo.name.trim()) newErrors.name = "Họ và tên là bắt buộc";
    else if (orderInfo.name.trim().length < 2)
      newErrors.name = "Họ và tên không hợp lệ";

    if (!orderInfo.phone) newErrors.phone = "Số điện thoại là bắt buộc";
    else if (!/^0\d{9}$/.test(orderInfo.phone))
      newErrors.phone = "Số điện thoại không hợp lệ";

    if (!orderInfo.email.trim()) newErrors.email = "Email là bắt buộc";
    else if (
      !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|vn|edu|org|net)$/i.test(
        orderInfo.email.trim(),
      )
    ) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!orderInfo.city) newErrors.city = "Vui lòng chọn Tỉnh/Thành phố";
    if (!orderInfo.district) newErrors.district = "Vui lòng chọn Quận/Huyện";
    if (!orderInfo.ward) newErrors.ward = "Vui lòng chọn Phường/Xã";

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

  const nextStep = () => currentStep < 3 && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  const loadCities = async () => {
    if (cityLoaded) return;
    const res = await fetch("https://provinces.open-api.vn/api/p/");
    const data = await res.json();
    setCities(data);
    setCityLoaded(true);
  };

  const loadDistricts = async (cityCode: number) => {
    const res = await fetch(
      `https://provinces.open-api.vn/api/p/${cityCode}?depth=2`,
    );
    const data = await res.json();
    setDistricts(data.districts);
  };

  const loadWards = async (districtCode: number) => {
    const res = await fetch(
      `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`,
    );
    const data = await res.json();
    setWards(data.wards);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutItems.length) {
      showErrorToast("Không có sản phẩm hợp lệ để thanh toán");
      return;
    }
    setIsProcessing(true);

    try {
      const payload = {
        productVariantIds: selectedItems,
        address: {
          fullName: orderInfo.name,
          phone: orderInfo.phone,
          email: orderInfo.email,
          addressLine1: orderInfo.address,
          addressLine2: "",
          ward: orderInfo.ward,
          district: orderInfo.district,
          province: orderInfo.city,
          postalCode: "",
          notes: orderInfo.note,
        },
        shippingFee,
        discountAmount: 0,
        paymentMethod: orderInfo.payment,
      };

      const res = await http("POST", "/api/v1/client/orders/checkout", payload);

      if (res?.success) {
        await fetchCart();
        setNewOrderId(res.data.id);
        setShowSuccessModal(true);
      } else {
        showErrorToast(res?.message || "Lỗi đặt hàng");
      }
    } catch (err: any) {
      showErrorToast(err.message || "Lỗi không xác định");
    } finally {
      setIsProcessing(false);
    }
  };

  const stepIcons = [
    <MapPin className="w-5 h-5" />,
    <CreditCard className="w-5 h-5" />,
    <Check className="w-5 h-5" />,
  ];
  const paymentIcons = {
    cod: <Truck className="w-6 h-6" />,
    bank: <Building className="w-6 h-6" />,
    momo: <Smartphone className="w-6 h-6" />,
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfc]">
      <Layout>
        {/* Banner Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-green-100/50 to-transparent py-10 text-center">
          <div className="container mx-auto relative z-10 px-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight flex items-center justify-center gap-3">
              <ShoppingCart className="w-10 h-10 text-green-600" />
              Thanh toán
            </h1>
            <div className="flex items-center justify-center text-slate-500 text-sm md:text-base font-medium">
              <Link
                to="/"
                className="hover:text-green-600 transition-colors flex items-center gap-1"
              >
                <Home className="w-4 h-4" /> Trang chủ
              </Link>
              <span className="mx-3 opacity-30">/</span>
              <Link
                to="/cart"
                className="hover:text-green-600 transition-colors"
              >
                Giỏ hàng
              </Link>
              <span className="mx-3 opacity-30">/</span>
              <span className="text-green-700">Thanh toán</span>
            </div>
          </div>
        </section>

        {/* Steps Progress */}
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="max-w-3xl mx-auto flex items-center justify-center">
            {[1, 2, 3].map((step, idx) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center relative z-10">
                  <div
                    className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full border-4 transition-all duration-500 ${
                      currentStep >= step
                        ? "bg-green-600 border-green-100 text-white shadow-lg shadow-green-200"
                        : "bg-white border-slate-100 text-slate-400"
                    }`}
                  >
                    {stepIcons[step - 1]}
                  </div>
                  <span
                    className={`absolute top-16 whitespace-nowrap text-xs md:text-sm font-bold mt-2 transition-colors duration-500 ${
                      currentStep >= step ? "text-slate-800" : "text-slate-400"
                    }`}
                  >
                    {step === 1 && "Giao hàng"}
                    {step === 2 && "Thanh toán"}
                    {step === 3 && "Xác nhận"}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={`flex-1 h-1.5 mx-2 md:mx-4 rounded-full transition-all duration-500 ${
                      currentStep > step ? "bg-green-500" : "bg-slate-100"
                    }`}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow container mx-auto px-4 lg:px-8 py-10 pb-20">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-8 lg:gap-12">
            {/* LEFT SIDE — FORM */}
            <div className="lg:col-span-8">
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.06)] border border-slate-50 relative overflow-hidden min-h-[500px]"
              >
                {/* STEP 1: GIAO HÀNG */}
                {currentStep === 1 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                      <span className="bg-green-50 p-2.5 rounded-xl text-green-600">
                        <MapPin className="w-5 h-5" />
                      </span>
                      Thông tin người nhận
                    </h2>

                    {/* Địa chỉ đã lưu */}
                    {!loadingAddresses && savedAddresses.length > 0 && (
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <Save className="w-4 h-4" /> Chọn địa chỉ đã lưu
                          </h3>

                          {/* Nút thao tác bên phải */}
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={handleClearForm}
                              className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                              title="Xóa trắng form để nhập lại"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Hủy tự động
                              điền
                            </button>

                            {savedAddresses.length > 3 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setShowAllAddresses(!showAllAddresses)
                                }
                                className="text-sm font-bold text-green-600 hover:text-green-700 transition-colors border-l border-slate-200 pl-4"
                              >
                                {showAllAddresses ? "Thu gọn" : "Xem tất cả"}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {visibleAddresses.map((addr, index) => (
                            <div
                              key={index}
                              onClick={() => applySavedAddress(addr)}
                              className="p-4 rounded-2xl border-2 border-slate-100 hover:border-green-500 cursor-pointer transition-all hover:shadow-md hover:bg-green-50/30 group"
                            >
                              <p className="font-bold text-slate-800 mb-1 group-hover:text-green-700">
                                {addr.fullName} — {addr.phone}
                              </p>
                              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                {addr.addressLine1}, {addr.ward},{" "}
                                {addr.district}, {addr.province}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Form nhập liệu */}
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" /> Họ và
                            tên <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={orderInfo.name}
                            onChange={handleChange}
                            placeholder="VD: Nguyễn Văn A"
                            className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all font-medium ${errors.name ? "border-red-400" : "border-slate-100 focus:border-green-500"}`}
                          />
                          {errors.name && (
                            <p className="text-xs text-red-500 font-bold ml-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.name}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400" /> Số điện
                            thoại <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={orderInfo.phone}
                            onChange={handleChange}
                            placeholder="09xx xxx xxx"
                            className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all font-medium ${errors.phone ? "border-red-400" : "border-slate-100 focus:border-green-500"}`}
                          />
                          {errors.phone && (
                            <p className="text-xs text-red-500 font-bold ml-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" /> Email{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={orderInfo.email}
                          onChange={handleChange}
                          placeholder="name@example.com"
                          className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all font-medium ${errors.email ? "border-red-400" : "border-slate-100 focus:border-green-500"}`}
                        />
                        {errors.email && (
                          <p className="text-xs text-red-500 font-bold ml-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                            Tỉnh / Thành phố{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={orderInfo.city}
                            onFocus={loadCities}
                            onChange={(e) => {
                              const cityName = e.target.value;
                              const city = cities.find(
                                (c) => c.name === cityName,
                              );
                              setOrderInfo((prev) => ({
                                ...prev,
                                city: cityName,
                                district: "",
                                ward: "",
                              }));
                              setDistricts([]);
                              setWards([]);
                              if (city) loadDistricts(city.code);
                            }}
                            className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all font-medium appearance-none ${errors.city ? "border-red-400" : "border-slate-100 focus:border-green-500"}`}
                          >
                            <option value="">Chọn Tỉnh / Thành phố</option>
                            {cities.map((city) => (
                              <option key={city.code} value={city.name}>
                                {city.name}
                              </option>
                            ))}
                          </select>
                          {errors.city && (
                            <p className="text-xs text-red-500 font-bold ml-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.city}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                            Quận / Huyện <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={orderInfo.district}
                            onChange={(e) => {
                              const districtName = e.target.value;
                              const district = districts.find(
                                (d) => d.name === districtName,
                              );
                              setOrderInfo((prev) => ({
                                ...prev,
                                district: districtName,
                                ward: "",
                              }));
                              setWards([]);
                              if (district) loadWards(district.code);
                            }}
                            className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all font-medium appearance-none ${errors.district ? "border-red-400" : "border-slate-100 focus:border-green-500"}`}
                          >
                            <option value="">Chọn Quận / Huyện</option>
                            {districts.map((d) => (
                              <option key={d.code} value={d.name}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                          {errors.district && (
                            <p className="text-xs text-red-500 font-bold ml-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.district}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                            Phường / Xã <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={orderInfo.ward}
                            onChange={(e) =>
                              setOrderInfo((prev) => ({
                                ...prev,
                                ward: e.target.value,
                              }))
                            }
                            className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all font-medium appearance-none ${errors.ward ? "border-red-400" : "border-slate-100 focus:border-green-500"}`}
                          >
                            <option value="">Chọn Phường / Xã</option>
                            {wards.map((w) => (
                              <option key={w.code} value={w.name}>
                                {w.name}
                              </option>
                            ))}
                          </select>
                          {errors.ward && (
                            <p className="text-xs text-red-500 font-bold ml-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.ward}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" /> Địa chỉ
                          cụ thể <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={orderInfo.address}
                          onChange={handleChange}
                          placeholder="Số nhà, tên đường..."
                          className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all font-medium ${errors.address ? "border-red-400" : "border-slate-100 focus:border-green-500"}`}
                        />
                        {errors.address && (
                          <p className="text-xs text-red-500 font-bold ml-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.address}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" /> Ghi
                          chú cho đơn hàng
                        </label>
                        <textarea
                          name="note"
                          rows={3}
                          value={orderInfo.note}
                          onChange={handleChange}
                          placeholder="Ví dụ: Giao giờ hành chính..."
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white transition-all font-medium resize-none"
                        ></textarea>
                      </div>

                      <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
                        <button
                          type="button"
                          onClick={validateAndNext}
                          className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition-all duration-300 flex items-center gap-2 active:scale-95 shadow-lg"
                        >
                          Tiếp tục thanh toán{" "}
                          <ArrowRight className="w-5 h-5 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: THANH TOÁN */}
                {currentStep === 2 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                      <span className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                        <CreditCard className="w-5 h-5" />
                      </span>
                      Phương thức thanh toán
                    </h2>

                    <div className="space-y-4 mb-10">
                      {/* COD */}
                      <label
                        className={`flex items-center p-5 rounded-2xl cursor-pointer border-2 transition-all duration-300 ${orderInfo.payment === "cod" ? "border-green-500 bg-green-50/50 shadow-sm" : "border-slate-100 hover:border-green-200"}`}
                      >
                        <div className="relative flex items-center justify-center w-6 h-6 mr-4">
                          <input
                            type="radio"
                            name="payment"
                            value="cod"
                            checked={orderInfo.payment === "cod"}
                            onChange={handleChange}
                            className="peer appearance-none w-6 h-6 border-2 border-slate-300 rounded-full checked:border-green-600 checked:border-[7px] transition-all"
                          />
                        </div>
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-700 shadow-sm">
                            {paymentIcons.cod}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-lg">
                              Thanh toán khi nhận hàng (COD)
                            </p>
                            <p className="text-sm font-medium text-slate-500">
                              Trả tiền mặt cho shipper khi nhận được hàng.
                            </p>
                          </div>
                        </div>
                      </label>

                      {/* Bank (Disabled) */}
                      <label className="flex items-center p-5 rounded-2xl cursor-not-allowed border-2 border-slate-100 bg-slate-50/50 opacity-70">
                        <div className="w-6 h-6 border-2 border-slate-200 rounded-full mr-4"></div>
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                            {paymentIcons.bank}
                          </div>
                          <div>
                            <p className="font-bold text-slate-600 text-lg">
                              Chuyển khoản ngân hàng
                            </p>
                            <p className="text-sm font-medium text-slate-400">
                              Thanh toán qua quét mã QR an toàn.
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1.5 rounded-lg whitespace-nowrap">
                          Bảo trì
                        </span>
                      </label>

                      {/* MoMo (Disabled) */}
                      <label className="flex items-center p-5 rounded-2xl cursor-not-allowed border-2 border-slate-100 bg-slate-50/50 opacity-70">
                        <div className="w-6 h-6 border-2 border-slate-200 rounded-full mr-4"></div>
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-pink-400 shadow-sm">
                            {paymentIcons.momo}
                          </div>
                          <div>
                            <p className="font-bold text-slate-600 text-lg">
                              Ví điện tử MoMo
                            </p>
                            <p className="text-sm font-medium text-slate-400">
                              Thanh toán nhanh chóng qua app MoMo.
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1.5 rounded-lg whitespace-nowrap">
                          Sắp ra mắt
                        </span>
                      </label>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="text-slate-500 font-bold px-6 py-4 rounded-2xl hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
                      >
                        <ArrowLeft className="w-5 h-5 stroke-[3]" /> Trở lại
                      </button>
                      <button
                        type="button"
                        onClick={nextStep}
                        className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition-all duration-300 flex items-center gap-2 active:scale-95 shadow-lg"
                      >
                        Xác nhận <ArrowRight className="w-5 h-5 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: XÁC NHẬN */}
                {currentStep === 3 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                      <span className="bg-orange-50 p-2.5 rounded-xl text-orange-600">
                        <Check className="w-5 h-5 stroke-[3]" />
                      </span>
                      Xác nhận thông tin
                    </h2>

                    <div className="space-y-6 mb-10">
                      {/* Shipping Info Card */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative">
                        <button
                          onClick={() => setCurrentStep(1)}
                          className="absolute top-6 right-6 text-sm font-bold text-green-600 hover:text-green-800 underline"
                        >
                          Thay đổi
                        </button>
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
                          <User className="w-4 h-4 text-slate-400" /> Nhận hàng
                        </h3>
                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                              Họ tên
                            </p>
                            <p className="font-bold text-slate-900 text-lg">
                              {orderInfo.name}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                              Số điện thoại
                            </p>
                            <p className="font-bold text-slate-900 text-lg">
                              {orderInfo.phone}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                              Email
                            </p>
                            <p className="font-bold text-slate-900">
                              {orderInfo.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                              Địa chỉ
                            </p>
                            <p className="font-bold text-slate-900">
                              {orderInfo.address}, {orderInfo.ward},{" "}
                              {orderInfo.district}, {orderInfo.city}
                            </p>
                          </div>
                        </div>
                        {orderInfo.note && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                              Ghi chú
                            </p>
                            <p className="font-medium text-slate-700 italic">
                              {orderInfo.note}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Payment Card */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative">
                        <button
                          onClick={() => setCurrentStep(2)}
                          className="absolute top-6 right-6 text-sm font-bold text-green-600 hover:text-green-800 underline"
                        >
                          Thay đổi
                        </button>
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
                          <CreditCard className="w-4 h-4 text-slate-400" />{" "}
                          Thanh toán
                        </h3>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-700">
                            {paymentIcons.cod}
                          </div>
                          <p className="font-bold text-slate-900 text-lg">
                            Thanh toán tiền mặt khi nhận hàng (COD)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={prevStep}
                        disabled={isProcessing}
                        className="text-slate-500 font-bold px-6 py-4 rounded-2xl hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
                      >
                        <ArrowLeft className="w-5 h-5 stroke-[3]" /> Trở lại
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="bg-green-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition-all duration-300 flex items-center gap-3 active:scale-95 shadow-lg disabled:opacity-70"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" /> Đang
                            xử lý...
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5 stroke-[3]" /> Đặt hàng
                            ngay
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* RIGHT SIDE — ORDER SUMMARY */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.06)] border border-slate-50 sticky top-24">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <span className="bg-green-50 text-green-600 p-2.5 rounded-xl">
                    <Package className="w-5 h-5" />
                  </span>
                  Đơn hàng của bạn
                </h3>

                {/* Items List */}
                <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {checkoutItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100"
                    >
                      <img
                        src={item.product?.thumbnail || ""}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-white"
                        alt="product"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate text-sm mb-1">
                          {item.product?.title}
                        </h4>
                        {item.variant?.title && (
                          <p className="text-xs font-bold text-slate-500 mb-1">
                            {item.variant.title}
                          </p>
                        )}
                        {item.variant?.optionValues &&
                          item.variant.optionValues.length > 0 && (
                            <p className="text-[11px] text-slate-400 font-medium">
                              {item.variant.optionValues
                                .map((ov: any) => ov.value)
                                .join(" / ")}
                            </p>
                          )}
                        <div className="flex justify-between items-end mt-2">
                          <p className="text-xs font-bold text-slate-500 bg-slate-200/50 px-2 py-1 rounded-md">
                            Số lượng: {item.quantity}
                          </p>
                          <p className="font-black text-green-700">
                            {(
                              getEffectivePrice(item) * item.quantity
                            ).toLocaleString()}{" "}
                            đ
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Total */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex justify-between font-medium text-slate-500 text-sm">
                    <span>
                      Tạm tính ({checkoutItems.length} dòng sản phẩm):
                    </span>
                    <span className="font-bold text-slate-900">
                      {subtotal.toLocaleString()} đ
                    </span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-500 text-sm">
                    <span>Phí vận chuyển:</span>
                    <span className="font-bold text-slate-900">
                      {shippingFee.toLocaleString()} đ
                    </span>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-100">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                        Tổng cộng
                      </span>
                      <div className="text-right">
                        <span className="block text-3xl font-black text-green-600 leading-none">
                          {total.toLocaleString()} đ
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          (Đã bao gồm VAT)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-blue-800 leading-relaxed">
                    Bằng việc bấm <strong>Xác nhận đặt hàng</strong>, bạn xác
                    nhận đã đồng ý với các Điều khoản sử dụng & Chính sách bảo
                    mật của chúng tôi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Lớp nền mờ (Backdrop) */}
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => navigate(`/orders/${newOrderId}`)}
            ></div>

            {/* Hộp thoại Modal */}
            <div className="relative bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl max-w-md w-full text-center animate-in zoom-in-95 duration-300">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Check className="w-12 h-12 stroke-[3]" />
              </div>

              <h2 className="text-3xl font-black text-slate-900 mb-4">
                Đặt hàng thành công!
              </h2>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                Cảm ơn bạn đã tin tưởng FreshFruits. Đơn hàng của bạn đang được
                xử lý và sẽ sớm giao đến tay bạn trong thời gian nhanh nhất.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate(`/orders/${newOrderId}`)}
                  className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition-all active:scale-95 shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                >
                  <Package className="w-5 h-5" />
                  Xem chi tiết đơn hàng
                </button>
                <Link
                  to="/products"
                  className="w-full bg-slate-50 text-slate-700 py-4 rounded-2xl font-bold text-lg hover:bg-slate-100 border border-slate-100 transition-all active:scale-95"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>
            </div>
          </div>
        )}
      </Layout>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
