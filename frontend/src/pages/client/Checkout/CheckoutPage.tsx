import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import Footer from "../../../components/client/layouts/Footer";
import { useCart } from "../../../context/CartContext";
import { http } from "../../../services/http";
import { useToast } from "../../../context/ToastContext";
import {
  checkoutOrder,
  getCheckoutQuote,
  getClientBranches,
  CheckoutQuoteChangedError,
} from "../../../services/api/ordersClient";
import type { CheckoutQuote, DeliverySlotSummary } from "../../../types/orders";
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
  CalendarClock,
  Clock3,
  TicketPercent,
  CheckCircle2,
  Info,
  Loader2,
  ShieldAlert,
} from "lucide-react";

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

const formatMoney = (value: number) =>
  `${Number(value || 0).toLocaleString("vi-VN")} đ`;

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

  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [deliveryTimeSlotId, setDeliveryTimeSlotId] = useState<number | null>(
    null,
  );
  const [deliveryType] = useState<
    "standard" | "same_day" | "scheduled"
  >("scheduled");

  const [quote, setQuote] = useState<CheckoutQuote | any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string>("");
  const [quoteChangedPayload, setQuoteChangedPayload] = useState<any>(null);
  const [showQuoteChangedModal, setShowQuoteChangedModal] = useState(false);

  const [promotionCode, setPromotionCode] = useState<string>(
    location.state?.promotionCode || "",
  );
  const [promotionInput, setPromotionInput] = useState<string>(
    location.state?.promotionCode || "",
  );
  const [promotionTouched, setPromotionTouched] = useState(false);

  const [availableSlots, setAvailableSlots] = useState<DeliverySlotSummary[]>(
    [],
  );

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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        const rows = await getClientBranches();

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
      } catch (err) {
        console.error("Load branches failed", err);
      } finally {
        setLoadingBranches(false);
      }
    };

    void fetchBranches();
  }, []);

  useEffect(() => {
    if (!branches.length) return;

    if (fulfillmentType === "pickup") {
      const pickupBranches = branches.filter((b) => b.supportsPickup);

      if (!pickupBranches.length) {
        if (selectedBranchId !== null) setSelectedBranchId(null);
        return;
      }

      const currentValid = pickupBranches.some(
        (b) => b.id === selectedBranchId,
      );
      if (!currentValid) {
        setSelectedBranchId(pickupBranches[0].id);
      }
    }
  }, [fulfillmentType, branches, selectedBranchId]);

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

  const checkoutItems = useMemo(() => {
    return cartItems.filter((item) => {
      if (!item?.productVariantId) return false;
      return selectedItems.includes(item.productVariantId);
    });
  }, [cartItems, selectedItems]);

  const checkoutItemIdsKey = useMemo(
    () => checkoutItems.map((x) => x.productVariantId).join(","),
    [checkoutItems],
  );

  const invalidCheckoutItems = useMemo(() => {
    return checkoutItems.filter((item) => {
      const availableStock = getCheckoutItemAvailableStock(item);
      if (!item.productVariantId) return true;
      if (item.quantity <= 0) return true;
      if (availableStock <= 0) return true;
      if (item.quantity > availableStock) return true;
      return false;
    });
  }, [checkoutItems]);

  const hasInvalidCheckoutItems = invalidCheckoutItems.length > 0;

  const getEffectivePrice = (item: any) => {
    if (typeof item.unitPrice === "number") return item.unitPrice;
    if (typeof item.variant?.price === "number") return item.variant.price;
    return 0;
  };

  const subtotal = useMemo(() => {
    return checkoutItems.reduce(
      (acc, item) => acc + getEffectivePrice(item) * item.quantity,
      0,
    );
  }, [checkoutItems]);

  const shippingFee = Number(quote?.shippingFee ?? 0);
  const discountAmount = Number(quote?.discountAmount ?? 0);
  const shippingDiscountAmount = Number(quote?.shippingDiscountAmount ?? 0);
  const total = Number(quote?.finalPrice ?? subtotal);

  const appliedPromotions = Array.isArray(quote?.appliedPromotions)
    ? quote.appliedPromotions
    : [];

  const promotionMessages = Array.isArray(quote?.promotionMessages)
    ? quote.promotionMessages
    : [];

  const activePromotionCode = quote?.promotionCode ?? promotionCode ?? null;

  const selectedBranch = useMemo(() => {
    if (!selectedBranchId) return null;

    const quoteSelected =
      quote?.selectedBranch &&
      Number(quote.selectedBranch.id) === selectedBranchId
        ? quote.selectedBranch
        : null;

    if (quoteSelected) return quoteSelected;

    const candidate = Array.isArray(quote?.candidateBranches)
      ? quote.candidateBranches.find(
          (b: any) => Number(b.id) === Number(selectedBranchId),
        )
      : null;

    if (candidate) return candidate;

    return branches.find((b) => b.id === selectedBranchId) || null;
  }, [branches, quote, selectedBranchId]);

  const isDeliveryAddressReady =
    !!orderInfo.city &&
    !!orderInfo.district &&
    !!orderInfo.ward &&
    !!orderInfo.address;

  const buildQuotePayload = () => ({
    productVariantIds: checkoutItems.map((item) => item.productVariantId),
    branchId: selectedBranchId ?? null,
    fulfillmentType,
    deliveryType,
    deliveryDate: fulfillmentType === "delivery" ? deliveryDate || null : null,
    deliveryTimeSlotId:
      fulfillmentType === "delivery" ? (deliveryTimeSlotId ?? null) : null,
    promotionCode: promotionCode.trim() || null,
    address:
      fulfillmentType === "pickup"
        ? {
            fullName: orderInfo.name.trim(),
            phone: orderInfo.phone.trim(),
            email: orderInfo.email.trim(),
            addressLine1: selectedBranch?.addressLine1 || "Nhận tại chi nhánh",
            addressLine2: "",
            ward: "",
            district: selectedBranch?.district || "",
            province: selectedBranch?.province || "",
            postalCode: "",
            notes: orderInfo.note,
          }
        : {
            fullName: orderInfo.name.trim(),
            phone: orderInfo.phone.trim(),
            email: orderInfo.email.trim(),
            addressLine1: orderInfo.address.trim(),
            addressLine2: "",
            ward: orderInfo.ward.trim(),
            district: orderInfo.district.trim(),
            province: orderInfo.city.trim(),
            postalCode: "",
            notes: orderInfo.note.trim(),
          },
  });

  const handleApplyPromotion = () => {
    const normalized = promotionInput.trim().toUpperCase();
    if (!normalized) {
      setPromotionCode("");
      setPromotionTouched(true);
      return;
    }
    setPromotionCode(normalized);
    setPromotionTouched(true);
  };

  const handleClearPromotion = () => {
    setPromotionInput("");
    setPromotionCode("");
    setPromotionTouched(true);
  };

  useEffect(() => {
    let cancelled = false;

    const resetQuoteState = () => {
      if (!cancelled) {
        setQuote(null);
        setAvailableSlots([]);
        setQuoteError("");
      }
    };

    const runQuote = async () => {
      if (!checkoutItems.length) {
        resetQuoteState();
        return;
      }

      if (fulfillmentType === "pickup" && !selectedBranchId) {
        resetQuoteState();
        return;
      }

      if (fulfillmentType === "delivery") {
        if (!isDeliveryAddressReady || !deliveryDate) {
          resetQuoteState();
          return;
        }
      }

      try {
        if (!cancelled) {
          setQuoteLoading(true);
          setQuoteError("");
        }

        const data = await getCheckoutQuote(buildQuotePayload());

        if (cancelled) return;

        setQuote(data);
        setAvailableSlots(data.availableSlots || []);

        if (fulfillmentType === "delivery") {
          const resolvedBranchId =
            data.selectedBranch?.id !== undefined &&
            data.selectedBranch?.id !== null
              ? Number(data.selectedBranch.id)
              : null;

          // Chỉ tự gán branch mặc định khi user chưa chọn gì
          if (!selectedBranchId && resolvedBranchId) {
            setSelectedBranchId(resolvedBranchId);
          }
        }

        if (
          deliveryTimeSlotId &&
          !(data.availableSlots || []).some(
            (s: any) => Number(s.id) === Number(deliveryTimeSlotId),
          )
        ) {
          setDeliveryTimeSlotId(null);
        }
      } catch (err: any) {
        if (cancelled) return;
        setQuote(null);
        setAvailableSlots([]);
        setQuoteError(err?.message || "Không lấy được báo giá");
      } finally {
        if (!cancelled) {
          setQuoteLoading(false);
        }
      }
    };

    void runQuote();

    return () => {
      cancelled = true;
    };
  }, [
    checkoutItemIdsKey,
    selectedBranchId,
    fulfillmentType,
    deliveryType,
    deliveryDate,
    orderInfo.city,
    orderInfo.district,
    orderInfo.ward,
    orderInfo.address,
    promotionCode,
  ]);

  useEffect(() => {
    if (fulfillmentType !== "delivery") return;

    // Đổi địa chỉ giao hàng thì phải chọn lại branch và slot
    setSelectedBranchId(null);
    setDeliveryTimeSlotId(null);
  }, [
    fulfillmentType,
    orderInfo.city,
    orderInfo.district,
    orderInfo.ward,
    orderInfo.address,
  ]);

  useEffect(() => {
    if (fulfillmentType !== "delivery") return;

    // Đổi ngày giao hoặc branch giao thì phải chọn lại slot
    setDeliveryTimeSlotId(null);
  }, [fulfillmentType, deliveryDate, selectedBranchId]);

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

    if (fulfillmentType === "pickup" && !selectedBranchId) {
      newErrors.branch = "Vui lòng chọn chi nhánh";
    }

    if (fulfillmentType === "delivery") {
      if (!orderInfo.city) newErrors.city = "Vui lòng chọn Tỉnh/Thành phố";
      if (!orderInfo.district) newErrors.district = "Vui lòng chọn Quận/Huyện";
      if (!orderInfo.ward) newErrors.ward = "Vui lòng chọn Phường/Xã";

      if (!orderInfo.address) newErrors.address = "Địa chỉ là bắt buộc";
      else if (orderInfo.address.trim().length < 5)
        newErrors.address = "Địa chỉ quá ngắn";

      if (!deliveryDate) newErrors.deliveryDate = "Vui lòng chọn ngày giao";

      if (quote?.requiresBranchSelection && !selectedBranchId) {
        newErrors.branch =
          "Vui lòng chọn chi nhánh phù hợp cho khu vực giao hàng này";
      }

      if (!deliveryTimeSlotId) {
        newErrors.deliveryTimeSlotId = "Vui lòng chọn khung giờ giao";
      }
    }

    if (!quote && !quoteLoading && fulfillmentType === "delivery") {
      newErrors.quote = "Chưa lấy được báo giá giao hàng";
    }

    if (quoteError) {
      newErrors.quote = quoteError;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setCurrentStep(2);
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

    if (isProcessing || submitLockRef.current) return;
    submitLockRef.current = true;

    if (!checkoutItems.length) {
      showErrorToast("Không có sản phẩm hợp lệ để thanh toán.");
      submitLockRef.current = false;
      return;
    }

    if (fulfillmentType === "pickup" && !selectedBranchId) {
      showErrorToast("Vui lòng chọn chi nhánh.");
      submitLockRef.current = false;
      return;
    }

    if (
      fulfillmentType === "delivery" &&
      quote?.requiresBranchSelection &&
      !selectedBranchId
    ) {
      showErrorToast("Vui lòng chọn chi nhánh phù hợp để giao hàng.");
      submitLockRef.current = false;
      return;
    }

    if (fulfillmentType === "delivery" && !quote) {
      showErrorToast("Chưa có báo giá giao hàng hợp lệ.");
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
        ...buildQuotePayload(),
        deliveryNote: orderInfo.note,
        paymentMethod: orderInfo.payment,
        expectedQuoteMeta: quote?.quoteMeta
          ? {
              fingerprint: quote.quoteMeta.fingerprint,
              finalPrice: Number(quote.finalPrice ?? 0),
              shippingFee: Number(quote.shippingFee ?? 0),
              discountAmount: Number(quote.discountAmount ?? 0),
              shippingDiscountAmount: Number(quote.shippingDiscountAmount ?? 0),
            }
          : null,
      };

      const data = await checkoutOrder(payload);

      await fetchCart();
      setNewOrderId(String(data.id));
      setShowSuccessModal(true);
      showSuccessToast({
        title: "Đặt hàng thành công",
        message: "Đơn hàng của bạn đã được tạo.",
      });
    } catch (err: any) {
      if (err instanceof CheckoutQuoteChangedError) {
        setQuoteChangedPayload(err.payload ?? null);
        setShowQuoteChangedModal(true);

        if (err.payload?.currentQuote) {
          setQuote((prev: any) => ({
            ...(prev ?? {}),
            subtotal: Number(
              err.payload.currentQuote.subtotal ?? prev?.subtotal ?? 0,
            ),
            shippingFee: Number(
              err.payload.currentQuote.shippingFee ?? prev?.shippingFee ?? 0,
            ),
            discountAmount: Number(
              err.payload.currentQuote.discountAmount ??
                prev?.discountAmount ??
                0,
            ),
            shippingDiscountAmount: Number(
              err.payload.currentQuote.shippingDiscountAmount ??
                prev?.shippingDiscountAmount ??
                0,
            ),
            finalPrice: Number(
              err.payload.currentQuote.finalPrice ?? prev?.finalPrice ?? 0,
            ),
            selectedBranch:
              err.payload.currentQuote.selectedBranch ??
              prev?.selectedBranch ??
              null,
            selectedSlot:
              err.payload.currentQuote.selectedSlot ??
              prev?.selectedSlot ??
              null,
            promotionCode:
              err.payload.currentQuote.promotionCode ??
              prev?.promotionCode ??
              null,
            promotionMessages: Array.isArray(
              err.payload.currentQuote.promotionMessages,
            )
              ? err.payload.currentQuote.promotionMessages
              : (prev?.promotionMessages ?? []),
            quoteMeta: err.payload.currentQuote?.fingerprint
              ? {
                  fingerprint: err.payload.currentQuote.fingerprint,
                  computedAt: new Date().toISOString(),
                  expiresAt: null,
                  consistencyVersion: 1,
                }
              : (prev?.quoteMeta ?? null),
          }));
          if (err.payload.currentQuote?.selectedBranch?.id) {
            setSelectedBranchId(
              Number(err.payload.currentQuote.selectedBranch.id),
            );
          }

          if (err.payload.currentQuote?.selectedSlot?.id) {
            setDeliveryTimeSlotId(
              Number(err.payload.currentQuote.selectedSlot.id),
            );
          } else {
            setDeliveryTimeSlotId(null);
          }
        }

        showErrorToast(
          err.message ||
            "Giá đơn hàng vừa được cập nhật. Vui lòng xác nhận lại.",
        );
      } else {
        showErrorToast(err.message || "Lỗi không xác định");
      }
    } finally {
      submitLockRef.current = false;
      setIsProcessing(false);
    }
  };

  const stepIcons = [
    <MapPin key="map" className="w-5 h-5" />,
    <CreditCard key="card" className="w-5 h-5" />,
    <Check key="check" className="w-5 h-5" />,
  ];

  const paymentIcons = {
    cod: <Truck className="w-6 h-6" />,
    bank: <Building className="w-6 h-6" />,
    momo: <Smartphone className="w-6 h-6" />,
  };

  const availableBranches = useMemo(() => {
    if (fulfillmentType === "pickup") {
      return branches.filter((b) => b.supportsPickup);
    }

    if (
      Array.isArray(quote?.candidateBranches) &&
      quote.candidateBranches.length
    ) {
      return quote.candidateBranches.map((branch: any) => ({
        id: Number(branch.id),
        name: branch.name ?? "",
        code: branch.code ?? null,
        addressLine1: branch.addressLine1 ?? null,
        district: branch.district ?? null,
        province: branch.province ?? null,
        supportsPickup: !!branch.supportsPickup,
        supportsDelivery: !!branch.supportsDelivery,
      }));
    }

    return [];
  }, [branches, fulfillmentType, quote]);

  const quoteStatus = useMemo(() => {
    if (quoteLoading) {
      return {
        label: "Giá tạm tính đang cập nhật",
        tone: "bg-amber-50 border-amber-200 text-amber-700",
      };
    }
    if (quoteError) {
      return {
        label: "Chưa thể tính giá cho đơn hàng này",
        tone: "bg-red-50 border-red-200 text-red-700",
      };
    }
    if (quote) {
      return {
        label: "Giá tạm tính đã cập nhật",
        tone: "bg-emerald-50 border-emerald-200 text-emerald-700",
      };
    }
    return {
      label: "Hoàn tất thông tin để hệ thống tính giá",
      tone: "bg-slate-50 border-slate-200 text-slate-600",
    };
  }, [quoteLoading, quoteError, quote]);

  const promotionFeedbackTone = (msg: string) => {
    const lower = msg.toLowerCase();
    if (
      lower.includes("không hợp lệ") ||
      lower.includes("không áp dụng") ||
      lower.includes("hết hạn") ||
      lower.includes("không đủ")
    ) {
      return "warning";
    }
    if (
      lower.includes("đã áp dụng") ||
      lower.includes("thành công") ||
      lower.includes("miễn phí")
    ) {
      return "success";
    }
    return "info";
  };

  const renderSectionShell = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    content: React.ReactNode,
  ) => (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-5 md:p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-2xl bg-slate-50 p-3 text-slate-700">{icon}</div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      {content}
    </div>
  );

  const renderSavedAddressesBlock = () => {
    if (
      loadingAddresses ||
      !savedAddresses.length ||
      fulfillmentType !== "delivery"
    ) {
      return null;
    }

    return (
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-700">
            <Save className="h-4 w-4" />
            Địa chỉ đã lưu
          </h4>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleClearForm}
              className="flex items-center gap-1 text-sm font-bold text-slate-400 transition-colors hover:text-red-500"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Xóa tự động điền
            </button>

            {savedAddresses.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllAddresses(!showAllAddresses)}
                className="text-sm font-bold text-green-600 transition-colors hover:text-green-700"
              >
                {showAllAddresses ? "Thu gọn" : "Xem tất cả"}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibleAddresses.map((addr, index) => (
            <button
              key={index}
              type="button"
              onClick={() => applySavedAddress(addr)}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition-all hover:border-green-300 hover:bg-green-50/50 hover:shadow-sm"
            >
              <p className="font-bold text-slate-900">
                {addr.fullName} — {addr.phone}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {addr.addressLine1}, {addr.ward}, {addr.district},{" "}
                {addr.province}
              </p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-green-600">
                Dùng địa chỉ này
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderContactInfoBlock = () =>
    renderSectionShell(
      <User className="h-5 w-5" />,
      "Thông tin nhận hàng",
      "Điền thông tin người nhận và chọn nhanh từ địa chỉ đã lưu nếu có.",
      <div>
        {renderSavedAddressesBlock()}

        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="ml-1 flex items-center gap-2 text-sm font-bold text-slate-700">
                <User className="h-4 w-4 text-slate-400" />
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={orderInfo.name}
                onChange={handleChange}
                placeholder="VD: Nguyễn Văn A"
                className={`w-full rounded-2xl border px-5 py-4 font-medium transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-green-500/10 ${
                  errors.name
                    ? "border-red-400 bg-red-50/30"
                    : "border-slate-100 bg-slate-50"
                }`}
              />
              {errors.name && (
                <p className="ml-1 flex items-center gap-1 text-xs font-bold text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="ml-1 flex items-center gap-2 text-sm font-bold text-slate-700">
                <Phone className="h-4 w-4 text-slate-400" />
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={orderInfo.phone}
                onChange={handleChange}
                placeholder="09xx xxx xxx"
                className={`w-full rounded-2xl border px-5 py-4 font-medium transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-green-500/10 ${
                  errors.phone
                    ? "border-red-400 bg-red-50/30"
                    : "border-slate-100 bg-slate-50"
                }`}
              />
              {errors.phone && (
                <p className="ml-1 flex items-center gap-1 text-xs font-bold text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="ml-1 flex items-center gap-2 text-sm font-bold text-slate-700">
              <Mail className="h-4 w-4 text-slate-400" />
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={orderInfo.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className={`w-full rounded-2xl border px-5 py-4 font-medium transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-green-500/10 ${
                errors.email
                  ? "border-red-400 bg-red-50/30"
                  : "border-slate-100 bg-slate-50"
              }`}
            />
            {errors.email && (
              <p className="ml-1 flex items-center gap-1 text-xs font-bold text-red-500">
                <AlertCircle className="h-3 w-3" />
                {errors.email}
              </p>
            )}
          </div>

          {fulfillmentType === "delivery" && (
            <>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="ml-1 text-sm font-bold text-slate-700">
                    Tỉnh / Thành phố <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={orderInfo.city}
                    onFocus={loadCities}
                    onChange={(e) => {
                      const cityName = e.target.value;
                      const city = cities.find((c) => c.name === cityName);
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
                    className={`w-full appearance-none rounded-2xl border px-5 py-4 font-medium transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-green-500/10 ${
                      errors.city
                        ? "border-red-400 bg-red-50/30"
                        : "border-slate-100 bg-slate-50"
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
                    <p className="ml-1 flex items-center gap-1 text-xs font-bold text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {errors.city}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-sm font-bold text-slate-700">
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
                    className={`w-full appearance-none rounded-2xl border px-5 py-4 font-medium transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-green-500/10 ${
                      errors.district
                        ? "border-red-400 bg-red-50/30"
                        : "border-slate-100 bg-slate-50"
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
                    <p className="ml-1 flex items-center gap-1 text-xs font-bold text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {errors.district}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-sm font-bold text-slate-700">
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
                    className={`w-full appearance-none rounded-2xl border px-5 py-4 font-medium transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-green-500/10 ${
                      errors.ward
                        ? "border-red-400 bg-red-50/30"
                        : "border-slate-100 bg-slate-50"
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
                    <p className="ml-1 flex items-center gap-1 text-xs font-bold text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {errors.ward}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="ml-1 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  Địa chỉ cụ thể <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={orderInfo.address}
                  onChange={handleChange}
                  placeholder="Số nhà, tên đường..."
                  className={`w-full rounded-2xl border px-5 py-4 font-medium transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-green-500/10 ${
                    errors.address
                      ? "border-red-400 bg-red-50/30"
                      : "border-slate-100 bg-slate-50"
                  }`}
                />
                {errors.address && (
                  <p className="ml-1 flex items-center gap-1 text-xs font-bold text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    {errors.address}
                  </p>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="ml-1 flex items-center gap-2 text-sm font-bold text-slate-700">
              <FileText className="h-4 w-4 text-slate-400" />
              Ghi chú cho đơn hàng
            </label>
            <textarea
              name="note"
              rows={3}
              value={orderInfo.note}
              onChange={handleChange}
              placeholder="Ví dụ: Giao giờ hành chính..."
              className="w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 font-medium transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-green-500/10"
            />
          </div>
        </div>
      </div>,
    );

  const renderFulfillmentBlock = () =>
    renderSectionShell(
      <GitBranch className="h-5 w-5" />,
      "Phương thức nhận hàng",
      "Chọn cách bạn muốn nhận đơn hàng: giao tận nơi hoặc đến chi nhánh nhận trực tiếp.",
      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setFulfillmentType("delivery")}
          className={`rounded-[1.5rem] border-2 p-5 text-left transition-all ${
            fulfillmentType === "delivery"
              ? "border-purple-500 bg-purple-50 shadow-sm"
              : "border-slate-100 hover:border-purple-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white p-3 text-purple-600 shadow-sm">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Giao tận nơi</p>
              <p className="mt-1 text-sm text-slate-500">
                Hệ thống xác định chi nhánh phục vụ theo khu vực giao hàng.
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFulfillmentType("pickup")}
          className={`rounded-[1.5rem] border-2 p-5 text-left transition-all ${
            fulfillmentType === "pickup"
              ? "border-blue-500 bg-blue-50 shadow-sm"
              : "border-slate-100 hover:border-blue-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white p-3 text-blue-600 shadow-sm">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Nhận tại chi nhánh</p>
              <p className="mt-1 text-sm text-slate-500">
                Bạn chủ động chọn chi nhánh và đến nhận hàng trực tiếp.
              </p>
            </div>
          </div>
        </button>
      </div>,
    );

  const renderBranchBlock = () => {
    const title =
      fulfillmentType === "pickup"
        ? "Chọn chi nhánh nhận hàng"
        : "Chi nhánh / phạm vi giao";
    const subtitle =
      fulfillmentType === "pickup"
        ? "Chọn chi nhánh bạn muốn đến nhận hàng."
        : "Xác định chi nhánh phục vụ phù hợp cho địa chỉ giao hàng của bạn.";

    return renderSectionShell(
      <Building className="h-5 w-5" />,
      title,
      subtitle,
      <div className="space-y-4">
        {loadingBranches && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-500">
            Đang tải danh sách chi nhánh...
          </div>
        )}

        {fulfillmentType === "delivery" && !isDeliveryAddressReady && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="font-bold">
                  Hoàn tất địa chỉ để xác định chi nhánh
                </p>
                <p className="mt-1 leading-relaxed">
                  Sau khi bạn chọn đủ tỉnh/thành, quận/huyện, phường/xã và địa
                  chỉ cụ thể, hệ thống sẽ xác định chi nhánh có thể phục vụ đơn
                  hàng của bạn.
                </p>
              </div>
            </div>
          </div>
        )}

        {fulfillmentType === "delivery" &&
          isDeliveryAddressReady &&
          quoteLoading && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="flex items-start gap-3">
                <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-amber-600" />
                <div>
                  <p className="font-bold">Đang xác định chi nhánh phục vụ</p>
                  <p className="mt-1 leading-relaxed">
                    Hệ thống đang đối chiếu khu vực giao hàng để chọn chi nhánh
                    phù hợp và tính phí giao hàng chính xác.
                  </p>
                </div>
              </div>
            </div>
          )}

        {fulfillmentType === "delivery" &&
          quote?.requiresBranchSelection &&
          !quoteLoading && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-bold">Cần bạn chọn chi nhánh phục vụ</p>
                  <p className="mt-1 leading-relaxed">
                    Khu vực của bạn hiện có nhiều chi nhánh cùng phục vụ được.
                    Hãy chọn chi nhánh bạn muốn ưu tiên để hệ thống tính đúng
                    phí giao hàng và khung giờ khả dụng.
                  </p>
                </div>
              </div>
            </div>
          )}

        {fulfillmentType === "delivery" &&
          !quote?.requiresBranchSelection &&
          quote?.selectedBranch &&
          !quoteLoading && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-bold">
                    Chi nhánh phục vụ đã được xác định
                  </p>
                  <p className="mt-1 leading-relaxed">
                    Hệ thống đã chọn chi nhánh phù hợp theo khu vực giao hàng
                    của bạn. Bạn có thể tiếp tục chọn ngày và khung giờ giao.
                  </p>
                </div>
              </div>
            </div>
          )}

        {(fulfillmentType === "pickup" ||
          (fulfillmentType === "delivery" &&
            quote?.requiresBranchSelection &&
            availableBranches.length > 0)) && (
          <div className="grid gap-3">
            {availableBranches.map((branch: any) => {
              const isSelected = selectedBranchId === branch.id;
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => setSelectedBranchId(branch.id)}
                  className={`rounded-[1.35rem] border p-4 text-left transition-all ${
                    isSelected
                      ? "border-green-500 bg-green-50 shadow-sm"
                      : "border-slate-100 bg-white hover:border-green-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-900">
                        {branch.name}
                        {branch.code ? ` (${branch.code})` : ""}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">
                        {[branch.addressLine1, branch.district, branch.province]
                          .filter(Boolean)
                          .join(", ") || "Đang cập nhật địa chỉ chi nhánh"}
                      </p>
                    </div>

                    {isSelected ? (
                      <span className="rounded-xl bg-green-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-700">
                        Đã chọn
                      </span>
                    ) : (
                      <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Chọn
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selectedBranch && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-bold text-slate-900">
              {selectedBranch.name}
              {selectedBranch.code ? ` (${selectedBranch.code})` : ""}
            </p>
            <p className="mt-1 leading-relaxed">
              {[
                selectedBranch.addressLine1,
                selectedBranch.district,
                selectedBranch.province,
              ]
                .filter(Boolean)
                .join(", ") || "Đang cập nhật địa chỉ chi nhánh"}
            </p>
          </div>
        )}

        {errors.branch && (
          <p className="ml-1 flex items-center gap-1 text-xs font-bold text-red-500">
            <AlertCircle className="h-3 w-3" />
            {errors.branch}
          </p>
        )}
      </div>,
    );
  };

  const renderScheduleBlock = () => {
    if (fulfillmentType !== "delivery") return null;

    return renderSectionShell(
      <CalendarClock className="h-5 w-5" />,
      "Ngày giờ giao",
      "Chọn ngày và khung giờ bạn muốn nhận hàng. Các khung giờ không khả dụng sẽ hiển thị lý do cụ thể.",
      <div className="space-y-5">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="ml-1 text-sm font-bold text-slate-700">
              Ngày giao hàng <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={deliveryDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => {
                setDeliveryDate(e.target.value);
                setDeliveryTimeSlotId(null);
              }}
              className={`w-full rounded-2xl border px-5 py-4 font-medium transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-green-500/10 ${
                errors.deliveryDate
                  ? "border-red-400 bg-red-50/30"
                  : "border-slate-100 bg-slate-50"
              }`}
            />
            {errors.deliveryDate && (
              <p className="ml-1 text-xs font-bold text-red-500">
                {errors.deliveryDate}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-sm font-bold text-slate-700">
              Trạng thái khung giờ
            </label>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-600">
              {quoteLoading
                ? "Đang tải khung giờ khả dụng..."
                : !deliveryDate
                  ? "Chọn ngày giao để xem khung giờ"
                  : availableSlots.length
                    ? `${availableSlots.filter((slot) => slot.isAvailable).length} khung giờ có thể chọn`
                    : "Chưa có khung giờ khả dụng"}
            </div>
          </div>
        </div>

        {!deliveryDate ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="font-bold">Chọn ngày giao trước</p>
                <p className="mt-1 leading-relaxed">
                  Sau khi bạn chọn ngày giao hàng, hệ thống sẽ hiển thị danh
                  sách khung giờ phù hợp với chi nhánh phục vụ và năng lực giao
                  hàng.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {availableSlots.map((slot) => {
              const isSelected = deliveryTimeSlotId === Number(slot.id);
              const isDisabled = !slot.isAvailable;
              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() =>
                    !isDisabled && setDeliveryTimeSlotId(Number(slot.id))
                  }
                  className={`rounded-[1.35rem] border p-4 text-left transition-all ${
                    isDisabled
                      ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-70"
                      : isSelected
                        ? "border-green-500 bg-green-50 shadow-sm"
                        : "border-slate-100 bg-white hover:border-green-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-900">{slot.label}</p>
                      {(slot.startTime || slot.endTime) && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                          <Clock3 className="h-4 w-4" />
                          {slot.startTime} - {slot.endTime}
                        </p>
                      )}

                      {slot.remainingCapacity !== null &&
                        slot.remainingCapacity !== undefined && (
                          <p className="mt-2 text-xs font-semibold text-slate-500">
                            Còn lại: {slot.remainingCapacity} suất
                          </p>
                        )}

                      {isDisabled && slot.reason && (
                        <p className="mt-2 rounded-xl bg-white/80 px-3 py-2 text-xs font-medium leading-relaxed text-slate-600">
                          Lý do: {slot.reason}
                        </p>
                      )}
                    </div>

                    <div>
                      {isDisabled ? (
                        <span className="rounded-xl bg-slate-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Không khả dụng
                        </span>
                      ) : isSelected ? (
                        <span className="rounded-xl bg-green-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-700">
                          Đã chọn
                        </span>
                      ) : (
                        <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Chọn
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {errors.deliveryTimeSlotId && (
          <p className="ml-1 text-xs font-bold text-red-500">
            {errors.deliveryTimeSlotId}
          </p>
        )}
      </div>,
    );
  };

  const renderPromotionBlock = () =>
    renderSectionShell(
      <TicketPercent className="h-5 w-5" />,
      "Mã ưu đãi",
      "Nhập mã khuyến mãi nếu bạn có, hoặc kiểm tra các ưu đãi hệ thống đã tự áp dụng.",
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Nhập mã ưu đãi</p>
              <p className="mt-1 text-sm text-slate-500">
                Hệ thống sẽ kiểm tra điều kiện áp dụng cho đơn hàng hiện tại.
              </p>
            </div>

            {activePromotionCode ? (
              <span className="rounded-xl border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
                Đã áp mã
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={promotionInput}
              onChange={(e) => setPromotionInput(e.target.value.toUpperCase())}
              placeholder="VD: FREESHIP50"
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-500/10"
            />

            <button
              type="button"
              onClick={handleApplyPromotion}
              className="rounded-2xl bg-slate-900 px-5 py-3 font-bold text-white transition-all hover:bg-green-700"
            >
              Áp mã
            </button>
          </div>

          {(promotionTouched || activePromotionCode) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {activePromotionCode ? (
                <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-900">
                  {activePromotionCode}
                </span>
              ) : null}

              {activePromotionCode ? (
                <button
                  type="button"
                  onClick={handleClearPromotion}
                  className="text-sm font-bold text-red-500 hover:text-red-600"
                >
                  Xóa mã
                </button>
              ) : null}
            </div>
          )}
        </div>

        {appliedPromotions.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-bold text-slate-900">
              Ưu đãi đang áp dụng
            </div>

            <div className="grid gap-3">
              {appliedPromotions.map((promo: any) => (
                <div
                  key={`${promo.promotionId}-${promo.promotionCode || "auto"}`}
                  className="rounded-2xl border border-green-200 bg-green-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-green-800">
                        {promo.promotionName}
                      </p>
                      <p className="mt-1 text-sm text-green-700">
                        {promo.promotionScope === "shipping"
                          ? `Giảm phí vận chuyển ${formatMoney(
                              Number(promo.shippingDiscountAmount ?? 0),
                            )}`
                          : `Giảm ${formatMoney(Number(promo.discountAmount ?? 0))}`}
                      </p>
                    </div>

                    <span className="rounded-xl bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-700">
                      {promo.promotionScope === "shipping"
                        ? "Shipping"
                        : "Order"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {promotionMessages.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-bold text-slate-900">
              Thông báo ưu đãi
            </div>

            <div className="space-y-2">
              {promotionMessages.map((msg: string, idx: number) => {
                const tone = promotionFeedbackTone(msg);

                const toneClass =
                  tone === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : tone === "warning"
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : "border-slate-200 bg-slate-50 text-slate-700";

                const hint =
                  tone === "warning"
                    ? "Hãy kiểm tra lại điều kiện đơn hàng, chi nhánh phục vụ hoặc thử mã khác."
                    : tone === "success"
                      ? "Ưu đãi đã được tính vào báo giá hiện tại."
                      : "Thông tin này được hệ thống dùng để giải thích cách áp ưu đãi.";

                return (
                  <div
                    key={`${msg}-${idx}`}
                    className={`rounded-2xl border p-4 ${toneClass}`}
                  >
                    <div className="flex items-start gap-3">
                      {tone === "success" ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                      ) : tone === "warning" ? (
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                      ) : (
                        <Info className="mt-0.5 h-5 w-5 shrink-0" />
                      )}

                      <div>
                        <p className="font-bold">
                          {tone === "success"
                            ? "Ưu đãi đã áp dụng"
                            : tone === "warning"
                              ? "Mã chưa áp dụng được"
                              : "Thông tin ưu đãi"}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed">{msg}</p>
                        <p className="mt-2 text-xs font-medium opacity-80">
                          {hint}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>,
    );

  const renderDeliveryStep = () => (
    <div className="space-y-6">
      {renderContactInfoBlock()}
      {renderFulfillmentBlock()}
      {renderBranchBlock()}
      {renderScheduleBlock()}
      {renderPromotionBlock()}

      {errors.quote && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errors.quote}
        </div>
      )}

      <div className="flex justify-end border-t border-slate-100 pt-6">
        <button
          type="button"
          onClick={validateAndNext}
          className="flex items-center gap-2 rounded-2xl bg-slate-900 px-10 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:bg-green-700 active:scale-95"
        >
          Tiếp tục thanh toán <ArrowRight className="h-5 w-5 stroke-[3]" />
        </button>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="animate-in slide-in-from-right-4 duration-500">
      <h2 className="mb-8 flex items-center gap-3 text-2xl font-bold text-slate-900">
        <span className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
          <CreditCard className="h-5 w-5" />
        </span>
        Xác nhận thanh toán
      </h2>

      <div className="space-y-4">
        <label
          className={`flex cursor-pointer items-center rounded-2xl border-2 p-5 transition-all duration-300 ${
            orderInfo.payment === "cod"
              ? "border-green-500 bg-green-50/50 shadow-sm"
              : "border-slate-100 hover:border-green-200"
          }`}
        >
          <div className="relative mr-4 flex h-6 w-6 items-center justify-center">
            <input
              type="radio"
              name="payment"
              value="cod"
              checked={orderInfo.payment === "cod"}
              onChange={handleChange}
              className="peer h-6 w-6 appearance-none rounded-full border-2 border-slate-300 transition-all checked:border-[7px] checked:border-green-600"
            />
          </div>
          <div className="flex flex-1 items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-700 shadow-sm">
              {paymentIcons.cod}
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">
                Thanh toán khi nhận hàng (COD)
              </p>
              <p className="text-sm font-medium text-slate-500">
                Trả tiền mặt khi nhận được hàng.
              </p>
            </div>
          </div>
        </label>

        <label className="flex cursor-not-allowed items-center rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-5 opacity-70">
          <div className="mr-4 h-6 w-6 rounded-full border-2 border-slate-200"></div>
          <div className="flex flex-1 items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 shadow-sm">
              {paymentIcons.bank}
            </div>
            <div>
              <p className="text-lg font-bold text-slate-600">
                Chuyển khoản ngân hàng
              </p>
              <p className="text-sm font-medium text-slate-400">
                Thanh toán qua quét mã QR an toàn.
              </p>
            </div>
          </div>
          <span className="whitespace-nowrap rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-600">
            Bảo trì
          </span>
        </label>

        <label className="flex cursor-not-allowed items-center rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-5 opacity-70">
          <div className="mr-4 h-6 w-6 rounded-full border-2 border-slate-200"></div>
          <div className="flex flex-1 items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-white text-pink-400 shadow-sm">
              {paymentIcons.momo}
            </div>
            <div>
              <p className="text-lg font-bold text-slate-600">
                Ví điện tử MoMo
              </p>
              <p className="text-sm font-medium text-slate-400">
                Thanh toán nhanh chóng qua app MoMo.
              </p>
            </div>
          </div>
          <span className="whitespace-nowrap rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-600">
            Sắp ra mắt
          </span>
        </label>
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
        <button
          type="button"
          onClick={prevStep}
          className="flex items-center gap-2 rounded-2xl px-6 py-4 font-bold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5 stroke-[3]" /> Trở lại
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="flex items-center gap-2 rounded-2xl bg-slate-900 px-10 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:bg-green-700 active:scale-95"
        >
          Xác nhận <ArrowRight className="h-5 w-5 stroke-[3]" />
        </button>
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="animate-in slide-in-from-right-4 duration-500">
      <h2 className="mb-8 flex items-center gap-3 text-2xl font-bold text-slate-900">
        <span className="rounded-xl bg-orange-50 p-2.5 text-orange-600">
          <Check className="h-5 w-5 stroke-[3]" />
        </span>
        Xác nhận đơn hàng
      </h2>

      <div className="mb-10 space-y-6">
        <div className="relative rounded-2xl border border-slate-100 bg-slate-50 p-6">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="absolute right-6 top-6 text-sm font-bold text-green-600 underline hover:text-green-800"
          >
            Thay đổi
          </button>

          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-800">
            <User className="h-4 w-4 text-slate-400" />
            Người nhận & nhận hàng
          </h3>

          <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-slate-400">
                Họ tên
              </p>
              <p className="text-lg font-bold text-slate-900">
                {orderInfo.name}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-slate-400">
                Số điện thoại
              </p>
              <p className="text-lg font-bold text-slate-900">
                {orderInfo.phone}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-slate-400">
                Email
              </p>
              <p className="font-bold text-slate-900">{orderInfo.email}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-slate-400">
                Hình thức nhận
              </p>
              <p className="font-bold text-slate-900">
                {fulfillmentType === "pickup"
                  ? "Nhận tại chi nhánh"
                  : "Giao tận nơi"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="mb-1 text-xs font-bold uppercase text-slate-400">
                Chi nhánh phục vụ
              </p>
              <p className="font-bold text-slate-900">
                {selectedBranch?.name || "Chưa chọn chi nhánh"}
                {selectedBranch?.code ? ` (${selectedBranch.code})` : ""}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="mb-1 text-xs font-bold uppercase text-slate-400">
                Địa chỉ / điểm nhận
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
            {fulfillmentType === "delivery" && (
              <>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase text-slate-400">
                    Ngày giao
                  </p>
                  <p className="font-bold text-slate-900">
                    {deliveryDate || "Chưa chọn"}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase text-slate-400">
                    Khung giờ
                  </p>
                  <p className="font-bold text-slate-900">
                    {availableSlots.find(
                      (slot) => Number(slot.id) === Number(deliveryTimeSlotId),
                    )?.label || "Chưa chọn"}
                  </p>
                </div>
              </>
            )}
          </div>

          {orderInfo.note && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className="mb-1 text-xs font-bold uppercase text-slate-400">
                Ghi chú
              </p>
              <p className="font-medium italic text-slate-700">
                {orderInfo.note}
              </p>
            </div>
          )}
        </div>

        <div className="relative rounded-2xl border border-slate-100 bg-slate-50 p-6">
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className="absolute right-6 top-6 text-sm font-bold text-green-600 underline hover:text-green-800"
          >
            Thay đổi
          </button>

          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-800">
            <CreditCard className="h-4 w-4 text-slate-400" />
            Thanh toán
          </h3>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
              {paymentIcons.cod}
            </div>
            <p className="text-lg font-bold text-slate-900">
              Thanh toán tiền mặt khi nhận hàng (COD)
            </p>
          </div>
        </div>

        {!!quoteError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {quoteError}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-6">
        <button
          type="button"
          onClick={prevStep}
          disabled={isProcessing}
          className="flex items-center gap-2 rounded-2xl px-6 py-4 font-bold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5 stroke-[3]" /> Trở lại
        </button>

        <button
          type="submit"
          disabled={
            isProcessing ||
            !checkoutItems.length ||
            hasInvalidCheckoutItems ||
            (fulfillmentType === "pickup" && !selectedBranchId) ||
            (fulfillmentType === "delivery" &&
              (!!quoteError ||
                !quote ||
                (quote.requiresBranchSelection && !selectedBranchId)))
          }
          className="flex items-center gap-3 rounded-2xl bg-green-600 px-10 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:bg-green-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" /> Đang xử lý...
            </>
          ) : (
            <>
              <Check className="h-5 w-5 stroke-[3]" /> Đặt hàng ngay
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderOrderSummary = () => (
    <div className="sticky top-24 rounded-[2.5rem] border border-slate-50 bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.06)] md:p-8">
      <h3 className="mb-6 flex items-center gap-3 text-xl font-bold text-slate-900">
        <span className="rounded-xl bg-green-50 p-2.5 text-green-600">
          <Package className="h-5 w-5" />
        </span>
        Tóm tắt đơn hàng
      </h3>

      <div
        className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-medium ${quoteStatus.tone}`}
      >
        {quoteStatus.label}
      </div>

      {hasInvalidCheckoutItems && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-relaxed text-amber-700">
          Có sản phẩm trong đơn thanh toán hiện không còn đủ tồn kho. Vui lòng
          quay lại giỏ hàng để kiểm tra lại số lượng.
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
            {fulfillmentType === "delivery" && quote?.selectedBranch && (
              <p className="mt-1 text-xs text-slate-500">
                Được xác định theo khu vực giao hàng
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 max-h-[34vh] space-y-4 overflow-y-auto pr-2">
        {checkoutItems.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-3"
          >
            <img
              src={item.product?.thumbnail || ""}
              className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 bg-white object-cover"
              alt="product"
            />
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-bold text-slate-900">
                {item.product?.title || item.productTitle || "Sản phẩm"}
              </h4>
              {item.variant?.title && (
                <p className="mt-1 text-xs text-slate-500">
                  {item.variant.title}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-sm text-slate-500">
                  SL: {item.quantity}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {formatMoney(getEffectivePrice(item) * item.quantity)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {appliedPromotions.length > 0 && (
        <div className="mb-5">
          <div className="mb-3 text-sm font-bold text-slate-900">
            Ưu đãi đang áp dụng
          </div>
          <div className="space-y-2">
            {appliedPromotions.map((promo: any) => (
              <div
                key={`${promo.promotionId}-${promo.promotionCode || "auto"}-summary`}
                className="rounded-2xl border border-green-200 bg-green-50 p-3 text-sm"
              >
                <p className="font-bold text-green-700">
                  {promo.promotionName}
                </p>
                <p className="mt-1 text-green-600">
                  {promo.promotionScope === "shipping"
                    ? `Giảm ship ${formatMoney(Number(promo.shippingDiscountAmount ?? 0))}`
                    : `Giảm ${formatMoney(Number(promo.discountAmount ?? 0))}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!!quoteError && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {quoteError}
        </div>
      )}

      {quote?.shippingZone && (
        <div className="mb-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="font-bold text-slate-900">Khu vực giao hàng</p>
          <p className="mt-1">{quote.shippingZone.name}</p>
        </div>
      )}

      <div className="space-y-3 border-t border-slate-100 pt-5">
        <div className="flex justify-between text-sm text-slate-600">
          <span>Tạm tính</span>
          <span className="font-bold text-slate-900">
            {formatMoney(subtotal)}
          </span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-slate-600">
            <span>Giảm giá sản phẩm / đơn hàng</span>
            <span className="font-bold text-slate-900">
              -{formatMoney(discountAmount)}
            </span>
          </div>
        )}

        <div className="flex justify-between text-sm text-slate-600">
          <span>Phí vận chuyển</span>
          <span className="font-bold text-slate-900">
            {formatMoney(shippingFee)}
          </span>
        </div>

        {shippingDiscountAmount > 0 && (
          <div className="flex justify-between text-sm text-slate-600">
            <span>Giảm phí vận chuyển</span>
            <span className="font-bold text-slate-900">
              -{formatMoney(shippingDiscountAmount)}
            </span>
          </div>
        )}

        <div className="flex items-end justify-between border-t border-slate-100 pt-4">
          <span className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Tổng cộng
          </span>
          <span className="text-2xl font-black text-green-600">
            {formatMoney(total)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#fcfdfc]">
      <Layout>
        <section className="relative overflow-hidden bg-gradient-to-b from-green-100/50 to-transparent py-10 text-center">
          <div className="container relative z-10 mx-auto px-4">
            <h1 className="mb-4 flex items-center justify-center gap-3 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              <ShoppingCart className="h-10 w-10 text-green-600" />
              Thanh toán
            </h1>
            <div className="flex items-center justify-center text-sm font-medium text-slate-500 md:text-base">
              <Link
                to="/"
                className="flex items-center gap-1 transition-colors hover:text-green-600"
              >
                <Home className="h-4 w-4" /> Trang chủ
              </Link>
              <span className="mx-3 opacity-30">/</span>
              <Link
                to="/cart"
                className="transition-colors hover:text-green-600"
              >
                Giỏ hàng
              </Link>
              <span className="mx-3 opacity-30">/</span>
              <span className="text-green-700">Thanh toán</span>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-6 lg:px-8">
          <div className="mx-auto flex max-w-3xl items-center justify-center">
            {[1, 2, 3].map((step, idx) => (
              <React.Fragment key={step}>
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-4 transition-all duration-500 md:h-14 md:w-14 ${
                      currentStep >= step
                        ? "border-green-100 bg-green-600 text-white shadow-lg shadow-green-200"
                        : "border-slate-100 bg-white text-slate-400"
                    }`}
                  >
                    {stepIcons[step - 1]}
                  </div>
                  <span
                    className={`absolute top-16 mt-2 whitespace-nowrap text-xs font-bold transition-colors duration-500 md:text-sm ${
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
                    className={`mx-2 h-1.5 flex-1 rounded-full transition-all duration-500 md:mx-4 ${
                      currentStep > step ? "bg-green-500" : "bg-slate-100"
                    }`}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="container mx-auto flex-grow px-4 py-10 pb-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-8">
              <form
                onSubmit={handleSubmit}
                className="min-h-[500px] rounded-[2.5rem] border border-slate-50 bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.06)] md:p-10"
              >
                {currentStep === 1 && renderDeliveryStep()}
                {currentStep === 2 && renderPaymentStep()}
                {currentStep === 3 && renderConfirmStep()}
              </form>
            </div>

            <div className="lg:col-span-4">{renderOrderSummary()}</div>
          </div>
        </div>

        {showQuoteChangedModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl md:p-8">
              <h3 className="text-xl font-bold text-slate-900">
                Đơn hàng vừa được cập nhật
              </h3>

              <p className="mt-3 text-slate-600">
                Giá hoặc điều kiện áp dụng đã thay đổi trong lúc bạn thanh toán.
                Vui lòng kiểm tra lại trước khi đặt hàng.
              </p>

              <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Tổng trước đó</span>
                  <span className="font-semibold text-slate-700">
                    {formatMoney(
                      Number(
                        quoteChangedPayload?.previousQuote?.finalPrice ?? 0,
                      ),
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Tổng mới</span>
                  <span className="font-bold text-red-600">
                    {formatMoney(
                      Number(
                        quoteChangedPayload?.currentQuote?.finalPrice ?? 0,
                      ),
                    )}
                  </span>
                </div>

                {quoteChangedPayload?.currentQuote?.selectedBranch?.name && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Chi nhánh phục vụ</span>
                    <span className="font-semibold text-slate-700">
                      {quoteChangedPayload.currentQuote.selectedBranch.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowQuoteChangedModal(false)}
                  className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        )}

        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-2xl">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Check className="h-8 w-8" />
              </div>

              <h2 className="mb-3 text-2xl font-black text-slate-900">
                Đặt hàng thành công
              </h2>

              <p className="mb-8 font-medium leading-relaxed text-slate-500">
                Cảm ơn bạn đã tin tưởng. Đơn hàng của bạn đang được xử lý và sẽ
                sớm giao đến tay bạn trong thời gian nhanh nhất.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate(`/orders/${newOrderId}`)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 text-lg font-bold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-700 active:scale-95"
                >
                  <Package className="h-5 w-5" />
                  Xem chi tiết đơn hàng
                </button>
                <Link
                  to="/products"
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-4 text-lg font-bold text-slate-700 transition-all hover:bg-slate-100 active:scale-95"
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
