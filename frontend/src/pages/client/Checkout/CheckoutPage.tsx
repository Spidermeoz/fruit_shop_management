import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import { useCart } from "../../../context/CartContext";
import { http } from "../../../services/http";
import { useToast } from "../../../context/ToastContext";
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
  Truck,
  Building,
  Smartphone,
  RefreshCw,
  Save,
  FileText,
  Store,
  GitBranch,
} from "lucide-react";
import Footer from "../../../components/client/layouts/Footer";

interface LocationItem {
  name: string;
  code: number;
}

interface Branch {
  id: number;
  name: string;
  code?: string | null;
  status?: string | null;
  supportsPickup?: boolean;
  supportsDelivery?: boolean;
  addressLine1?: string | null;
  district?: string | null;
  province?: string | null;
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

const getCheckoutItemAvailableStock = (item: any) => {
  const raw =
    item?.variant?.availableStock !== undefined &&
    item?.variant?.availableStock !== null
      ? item.variant.availableStock
      : item?.variant?.stock;

  if (raw === undefined || raw === null || raw === "") {
    return item?.quantity > 0 ? item.quantity : 0;
  }

  const stock = Number(raw);
  if (!Number.isFinite(stock)) {
    return item?.quantity > 0 ? item.quantity : 0;
  }

  return Math.max(0, stock);
};

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items: cartItems, fetchCart } = useCart();
  const { showErrorToast, showSuccessToast } = useToast();

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

  const [cities, setCities] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);
  const [cityLoaded, setCityLoaded] = useState(false);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">(
    "delivery",
  );
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newOrderId, setNewOrderId] = useState<string | null>(null);

  const submitLockRef = useRef(false);

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
    setErrors({});
    setDistricts([]);
    setWards([]);
  };

  useEffect(() => {
    if (!selectedItems.length) {
      navigate("/cart");
    }
  }, [navigate, selectedItems.length]);

  useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

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

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await http(
          "GET",
          "/api/v1/client/orders/branches",
        );

        if (res?.success) {
          const rows = Array.isArray(res.data) ? res.data : [];
          const mapped = rows.map((b: any) => ({
            id: Number(b.id),
            name: b.name,
            code: b.code ?? null,
            status: b.status ?? null,
            supportsPickup: !!b.supportsPickup,
            supportsDelivery: !!b.supportsDelivery,
            addressLine1: b.addressLine1 ?? null,
            district: b.district ?? null,
            province: b.province ?? null,
          }));

          setBranches(mapped);

          const firstDelivery =
            mapped.find((b: Branch) => b.supportsDelivery) ?? mapped[0] ?? null;
          const firstPickup =
            mapped.find((b: Branch) => b.supportsPickup) ?? mapped[0] ?? null;

          if (fulfillmentType === "delivery") {
            setSelectedBranchId(firstDelivery?.id ?? null);
          } else {
            setSelectedBranchId(firstPickup?.id ?? null);
          }
        }
      } catch (err) {
        console.error("Load branches failed", err);
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, []);

  useEffect(() => {
    if (!branches.length) return;

    const available =
      fulfillmentType === "pickup"
        ? branches.filter((b) => b.supportsPickup)
        : branches.filter((b) => b.supportsDelivery);

    if (!available.length) {
      setSelectedBranchId(null);
      return;
    }

    if (
      !selectedBranchId ||
      !available.some((b) => b.id === selectedBranchId)
    ) {
      setSelectedBranchId(available[0].id);
    }
  }, [fulfillmentType, branches]);

  const visibleAddresses = showAllAddresses
    ? savedAddresses
    : savedAddresses.slice(0, 3);

  const applySavedAddress = async (addr: any) => {
    try {
      let cityList = cities;

      if (!cityList.length) {
        const res = await fetch("https://provinces.open-api.vn/api/p/");
        cityList = await res.json();
        setCities(cityList);
        setCityLoaded(true);
      }

      const city = cityList.find((c) => c.name === addr.province);
      let districtList: LocationItem[] = [];

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
          setWards(wardData.wards || []);
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

  const checkoutItems = cartItems.filter((item) => {
    if (!item?.productVariantId) return false;
    return selectedItems.includes(item.productVariantId);
  });

  const invalidCheckoutItems = checkoutItems.filter((item) => {
    const availableStock = getCheckoutItemAvailableStock(item);

    if (!item.productVariantId) return true;
    if (item.quantity <= 0) return true;
    if (availableStock <= 0) return true;
    if (item.quantity > availableStock) return true;

    return false;
  });

  const hasInvalidCheckoutItems = invalidCheckoutItems.length > 0;

  const getEffectivePrice = (item: any) => {
    if (typeof item.unitPrice === "number") return item.unitPrice;
    if (typeof item.variant?.price === "number") return item.variant.price;
    return 0;
  };

  const subtotal = checkoutItems.reduce(
    (acc, item) => acc + getEffectivePrice(item) * item.quantity,
    0,
  );

  const shippingFee = useMemo(() => {
    if (!checkoutItems.length) return 0;
    return fulfillmentType === "pickup" ? 0 : 20000;
  }, [checkoutItems.length, fulfillmentType]);

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

    if (!selectedBranchId) {
      newErrors.branch = "Vui lòng chọn chi nhánh";
    }

    if (fulfillmentType === "delivery") {
      if (!orderInfo.city) newErrors.city = "Vui lòng chọn Tỉnh/Thành phố";
      if (!orderInfo.district) newErrors.district = "Vui lòng chọn Quận/Huyện";
      if (!orderInfo.ward) newErrors.ward = "Vui lòng chọn Phường/Xã";

      if (!orderInfo.address) newErrors.address = "Địa chỉ là bắt buộc";
      else if (orderInfo.address.trim().length < 5)
        newErrors.address = "Địa chỉ quá ngắn";
    }

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

  const selectedBranch =
    branches.find((b) => b.id === selectedBranchId) || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isProcessing || submitLockRef.current) return;
    submitLockRef.current = true;

    if (!checkoutItems.length) {
      showErrorToast("Không có sản phẩm hợp lệ để thanh toán.");
      submitLockRef.current = false;
      return;
    }

    if (!selectedBranchId) {
      showErrorToast("Vui lòng chọn chi nhánh.");
      submitLockRef.current = false;
      return;
    }

    const exceededItem = checkoutItems.find((item) => {
      const availableStock = getCheckoutItemAvailableStock(item);
      return item.quantity > availableStock;
    });

    if (exceededItem) {
      showErrorToast(
        "Có sản phẩm vượt quá tồn kho hiện có. Vui lòng kiểm tra lại giỏ hàng.",
      );
      submitLockRef.current = false;
      return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        productVariantIds: checkoutItems.map((item) => item.productVariantId),
        branchId: selectedBranchId,
        fulfillmentType,
        address:
          fulfillmentType === "pickup"
            ? {
                fullName: orderInfo.name,
                phone: orderInfo.phone,
                email: orderInfo.email,
                addressLine1:
                  selectedBranch?.addressLine1 || "Nhận tại chi nhánh",
                addressLine2: "",
                ward: "",
                district: selectedBranch?.district || "",
                province: selectedBranch?.province || "",
                postalCode: "",
                notes: orderInfo.note,
              }
            : {
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
        setNewOrderId(String(res.data.id));
        setShowSuccessModal(true);
        showSuccessToast({
          title: "Đặt hàng thành công",
          message: "Đơn hàng của bạn đã được tạo.",
        });
      } else {
        showErrorToast(res?.message || "Lỗi đặt hàng");
      }
    } catch (err: any) {
      showErrorToast(err.message || "Lỗi không xác định");
    } finally {
      submitLockRef.current = false;
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

  const availableBranches =
    fulfillmentType === "pickup"
      ? branches.filter((b) => b.supportsPickup)
      : branches.filter((b) => b.supportsDelivery);

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfc]">
      <Layout>
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

        <div className="flex-grow container mx-auto px-4 lg:px-8 py-10 pb-20">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-8">
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.06)] border border-slate-50 relative overflow-hidden min-h-[500px]"
              >
                {currentStep === 1 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                      <span className="bg-green-50 p-2.5 rounded-xl text-green-600">
                        <MapPin className="w-5 h-5" />
                      </span>
                      Thông tin người nhận
                    </h2>

                    <div className="mb-8">
                      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-4">
                        <GitBranch className="w-4 h-4" /> Hình thức nhận hàng &
                        chi nhánh
                      </h3>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <button
                          type="button"
                          onClick={() => setFulfillmentType("delivery")}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${
                            fulfillmentType === "delivery"
                              ? "border-purple-500 bg-purple-50"
                              : "border-slate-100 hover:border-purple-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Truck className="w-5 h-5 text-purple-600" />
                            <div>
                              <p className="font-bold text-slate-900">
                                Giao tận nơi
                              </p>
                              <p className="text-sm text-slate-500">
                                Giao từ chi nhánh phù hợp
                              </p>
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFulfillmentType("pickup")}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${
                            fulfillmentType === "pickup"
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-100 hover:border-blue-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Store className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-bold text-slate-900">
                                Nhận tại chi nhánh
                              </p>
                              <p className="text-sm text-slate-500">
                                Tự đến lấy hàng
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                          Chọn chi nhánh <span className="text-red-500">*</span>
                        </label>

                        {loadingBranches ? (
                          <div className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500">
                            Đang tải chi nhánh...
                          </div>
                        ) : (
                          <select
                            value={selectedBranchId ?? ""}
                            onChange={(e) =>
                              setSelectedBranchId(
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                            className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all font-medium appearance-none ${
                              errors.branch
                                ? "border-red-400"
                                : "border-slate-100 focus:border-green-500"
                            }`}
                          >
                            <option value="">Chọn chi nhánh</option>
                            {availableBranches.map((branch) => (
                              <option key={branch.id} value={branch.id}>
                                {branch.name}
                                {branch.code ? ` (${branch.code})` : ""}
                              </option>
                            ))}
                          </select>
                        )}

                        {errors.branch && (
                          <p className="text-xs text-red-500 font-bold ml-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.branch}
                          </p>
                        )}

                        {selectedBranch && (
                          <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-600">
                            <p className="font-bold text-slate-900">
                              {selectedBranch.name}
                              {selectedBranch.code
                                ? ` (${selectedBranch.code})`
                                : ""}
                            </p>
                            <p className="mt-1">
                              {[
                                selectedBranch.addressLine1,
                                selectedBranch.district,
                                selectedBranch.province,
                              ]
                                .filter(Boolean)
                                .join(", ") ||
                                "Đang cập nhật địa chỉ chi nhánh"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {!loadingAddresses &&
                      savedAddresses.length > 0 &&
                      fulfillmentType === "delivery" && (
                        <div className="mb-8">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                              <Save className="w-4 h-4" /> Chọn địa chỉ đã lưu
                            </h3>

                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={handleClearForm}
                                className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                                title="Xóa trắng form để nhập lại"
                              >
                                <RefreshCw className="w-3.5 h-3.5" /> Hủy tự
                                động điền
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
                            className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all font-medium ${
                              errors.name
                                ? "border-red-400"
                                : "border-slate-100 focus:border-green-500"
                            }`}
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
                            className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all font-medium ${
                              errors.phone
                                ? "border-red-400"
                                : "border-slate-100 focus:border-green-500"
                            }`}
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
                          className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all font-medium ${
                            errors.email
                              ? "border-red-400"
                              : "border-slate-100 focus:border-green-500"
                          }`}
                        />
                        {errors.email && (
                          <p className="text-xs text-red-500 font-bold ml-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {fulfillmentType === "delivery" ? (
                        <>
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
                                className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all font-medium appearance-none ${
                                  errors.city
                                    ? "border-red-400"
                                    : "border-slate-100 focus:border-green-500"
                                }`}
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
                                Quận / Huyện{" "}
                                <span className="text-red-500">*</span>
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
                                className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all font-medium appearance-none ${
                                  errors.district
                                    ? "border-red-400"
                                    : "border-slate-100 focus:border-green-500"
                                }`}
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
                                Phường / Xã{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={orderInfo.ward}
                                onChange={(e) =>
                                  setOrderInfo((prev) => ({
                                    ...prev,
                                    ward: e.target.value,
                                  }))
                                }
                                className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all font-medium appearance-none ${
                                  errors.ward
                                    ? "border-red-400"
                                    : "border-slate-100 focus:border-green-500"
                                }`}
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
                              <MapPin className="w-4 h-4 text-slate-400" /> Địa
                              chỉ cụ thể <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="address"
                              value={orderInfo.address}
                              onChange={handleChange}
                              placeholder="Số nhà, tên đường..."
                              className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all font-medium ${
                                errors.address
                                  ? "border-red-400"
                                  : "border-slate-100 focus:border-green-500"
                              }`}
                            />
                            {errors.address && (
                              <p className="text-xs text-red-500 font-bold ml-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.address}
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                          <div className="flex items-start gap-3">
                            <Store className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="font-bold text-blue-900">
                                Bạn chọn nhận tại chi nhánh
                              </p>
                              <p className="text-sm text-blue-700 mt-1">
                                Không cần nhập địa chỉ giao hàng. Bạn sẽ đến
                                nhận hàng tại:
                              </p>
                              <p className="mt-2 font-semibold text-slate-900">
                                {selectedBranch?.name || "Chưa chọn chi nhánh"}
                              </p>
                              <p className="text-sm text-slate-600 mt-1">
                                {[
                                  selectedBranch?.addressLine1,
                                  selectedBranch?.district,
                                  selectedBranch?.province,
                                ]
                                  .filter(Boolean)
                                  .join(", ") || "Đang cập nhật địa chỉ"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

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

                {currentStep === 2 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                      <span className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                        <CreditCard className="w-5 h-5" />
                      </span>
                      Phương thức thanh toán
                    </h2>

                    <div className="space-y-4 mb-10">
                      <label
                        className={`flex items-center p-5 rounded-2xl cursor-pointer border-2 transition-all duration-300 ${
                          orderInfo.payment === "cod"
                            ? "border-green-500 bg-green-50/50 shadow-sm"
                            : "border-slate-100 hover:border-green-200"
                        }`}
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
                              Trả tiền mặt khi nhận được hàng.
                            </p>
                          </div>
                        </div>
                      </label>

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

                {currentStep === 3 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                      <span className="bg-orange-50 p-2.5 rounded-xl text-orange-600">
                        <Check className="w-5 h-5 stroke-[3]" />
                      </span>
                      Xác nhận thông tin
                    </h2>

                    <div className="space-y-6 mb-10">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative">
                        <button
                          type="button"
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
                              Hình thức nhận
                            </p>
                            <p className="font-bold text-slate-900">
                              {fulfillmentType === "pickup"
                                ? "Nhận tại chi nhánh"
                                : "Giao tận nơi"}
                            </p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                              Chi nhánh
                            </p>
                            <p className="font-bold text-slate-900">
                              {selectedBranch?.name || "Chưa chọn chi nhánh"}
                              {selectedBranch?.code
                                ? ` (${selectedBranch.code})`
                                : ""}
                            </p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                              Địa chỉ
                            </p>
                            <p className="font-bold text-slate-900">
                              {fulfillmentType === "pickup"
                                ? [
                                    selectedBranch?.addressLine1,
                                    selectedBranch?.district,
                                    selectedBranch?.province,
                                  ]
                                    .filter(Boolean)
                                    .join(", ") || "Nhận tại chi nhánh"
                                : `${orderInfo.address}, ${orderInfo.ward}, ${orderInfo.district}, ${orderInfo.city}`}
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

                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative">
                        <button
                          type="button"
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
                        disabled={
                          isProcessing ||
                          !checkoutItems.length ||
                          hasInvalidCheckoutItems ||
                          !selectedBranchId
                        }
                        className="bg-green-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition-all duration-300 flex items-center gap-3 active:scale-95 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
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

            <div className="lg:col-span-4">
              <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.06)] border border-slate-50 sticky top-24">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <span className="bg-green-50 text-green-600 p-2.5 rounded-xl">
                    <Package className="w-5 h-5" />
                  </span>
                  Đơn hàng của bạn
                </h3>

                {hasInvalidCheckoutItems && (
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 font-medium leading-relaxed">
                    Có sản phẩm trong đơn thanh toán hiện không còn đủ tồn kho.
                    Vui lòng quay lại giỏ hàng để kiểm tra lại số lượng.
                  </div>
                )}

                <div className="mb-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Hình thức nhận
                      </p>
                      <p className="mt-1 font-bold text-slate-900">
                        {fulfillmentType === "pickup"
                          ? "Nhận tại chi nhánh"
                          : "Giao tận nơi"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Chi nhánh
                      </p>
                      <p className="mt-1 font-bold text-slate-900">
                        {selectedBranch?.name || "Chưa chọn"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {checkoutItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100"
                    >
                      <img
                        src={item.product?.thumbnail || ""}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                        alt="product"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate text-sm">
                          {item.product?.title ||
                            item.productTitle ||
                            "Sản phẩm"}
                        </h4>
                        {item.variant?.title && (
                          <p className="text-xs text-slate-500 mt-1">
                            {item.variant.title}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2 gap-2">
                          <span className="text-sm text-slate-500">
                            SL: {item.quantity}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {(
                              getEffectivePrice(item) * item.quantity
                            ).toLocaleString()}{" "}
                            đ
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-5 space-y-3">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Tạm tính</span>
                    <span className="font-bold text-slate-900">
                      {subtotal.toLocaleString()} đ
                    </span>
                  </div>

                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Phí vận chuyển</span>
                    <span className="font-bold text-slate-900">
                      {shippingFee.toLocaleString()} đ
                    </span>
                  </div>

                  <div className="flex justify-between items-end pt-4 border-t border-slate-100">
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-400">
                      Tổng cộng
                    </span>
                    <span className="text-2xl font-black text-green-600">
                      {total.toLocaleString()} đ
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showSuccessModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
            <div className="bg-white rounded-[2rem] p-8 max-w-md w-full text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-5">
                <Check className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-3">
                Đặt hàng thành công
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
