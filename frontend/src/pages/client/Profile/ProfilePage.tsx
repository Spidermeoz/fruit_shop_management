import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import { http } from "../../../services/http";

// --- GIỮ NGUYÊN INTERFACES ---
interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  avatar: string;
  role: {
    id: number;
    title: string;
  };
}

interface Address {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  ward: string;
  district: string;
  province: string;
  postalCode: string;
}

interface OrderItem {
  id: number;
  code: string;
  status: string;
  paymentStatus: string;
  shippingFee: number;
  discountAmount: number;
  totalPrice: number;
  finalPrice: number;
  createdAt: string;
  items: Array<{
    productId: number;
    productTitle: string;
    price: number;
    quantity: number;
  }>;
}

type PasswordErrors = {
  currentPassword?: string | null;
  newPassword?: string | null;
  confirmPassword?: string | null;
};

const ProfilePage: React.FC = () => {
  // --- GIỮ NGUYÊN TOÀN BỘ LOGIC, STATE VÀ API ---
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<PasswordErrors>({
    currentPassword: null,
    newPassword: null,
    confirmPassword: null,
  });

  const [profile, setProfile] = useState<UserProfile>({
    id: 0,
    full_name: "",
    email: "",
    phone: "",
    avatar: "",
    role: { id: 0, title: "" },
  });

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadProfile();
    loadAddresses();
    loadOrders();
  }, []);

  const loadProfile = async () => {
    try {
      setApiError(null);
      const res = await http("GET", "/api/v1/client/auth/me");
      const userData = res.data.user;

      setProfile({
        id: userData.id,
        full_name: userData.full_name,
        email: userData.email,
        phone: userData.phone || "",
        avatar: userData.avatar || "",
        role: userData.role,
      });
    } catch (err: any) {
      console.error("Failed to load profile", err);
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setApiError(
          "Không thể tải thông tin người dùng. Vui lòng thử lại sau.",
        );
      }
    }
  };

  const loadAddresses = async () => {
    try {
      const res = await http("GET", "/api/v1/client/orders/addresses");
      setAddresses(res.data);
    } catch (err: any) {
      console.error("Failed to load addresses", err);
      if (err.response?.status === 401) {
        navigate("/login");
      }
    }
  };

  const loadOrders = async () => {
    try {
      const res = await http("GET", "/api/v1/client/orders");
      if (Array.isArray(res.data)) {
        setOrders(res.data.map((order: any) => order.props));
      }
    } catch (err: any) {
      console.error("Failed to load orders", err);
      if (err.response?.status === 401) {
        navigate("/login");
      }
    }
  };

  const confirmPhoneNumber = (phoneNumber: string) => {
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    return phoneRegex.test(phoneNumber);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const isPhoneNumber = confirmPhoneNumber(profile.phone);
    if (!isPhoneNumber) {
      alert("Số điện thoại sai định dạng");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    try {
      const res = await http("PATCH", "/api/v1/client/auth/profile", {
        full_name: profile.full_name,
        phone: profile.phone,
        avatar: profile.avatar,
      });

      if (res.success) {
        alert("Cập nhật thông tin thành công!");
        setIsEditing(false);
      } else {
        alert(res.message || "Cập nhật thất bại");
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const validateNewPassword = (password: string) => {
    return password.length >= 6;
  };

  const haveErrorPassword = () => {
    const newErrors: PasswordErrors = {
      currentPassword: null,
      newPassword: null,
      confirmPassword: null,
    };

    if (!passwordData.currentPassword.trim()) {
      newErrors.currentPassword = "Chưa nhập mật khẩu hiện tại";
    }
    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = "Chưa nhập mật khẩu mới";
    }
    if (!passwordData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Chưa nhập xác nhận mật khẩu";
    }
    if (
      passwordData.currentPassword &&
      passwordData.newPassword &&
      passwordData.currentPassword === passwordData.newPassword
    ) {
      newErrors.newPassword = "Mật khẩu mới phải khác với mật khẩu hiện tại";
    }
    if (
      passwordData.newPassword &&
      !validateNewPassword(passwordData.newPassword)
    ) {
      newErrors.newPassword = "Mật khẩu phải tối thiểu 6 ký tự";
    }
    if (
      passwordData.newPassword &&
      passwordData.confirmPassword &&
      passwordData.newPassword !== passwordData.confirmPassword
    ) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return Object.values(newErrors).some((value) => value);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (haveErrorPassword()) return;

    setIsLoading(true);
    try {
      const res = await http("POST", "/api/v1/client/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (!res.success) {
        alert(res.message || "Đổi mật khẩu thất bại");
        return;
      }

      alert("Đổi mật khẩu thành công!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Lỗi khi đổi mật khẩu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ảnh phải nhỏ hơn 2MB!");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewAvatar(reader.result as string);
      setSelectedFile(file);
      setShowConfirmDialog(true);
    };
    reader.readAsDataURL(file);
  };

  const confirmUploadAvatar = async () => {
    if (!selectedFile) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("folder", "avatars");

      const uploadRes = await http("POST", "/api/v1/client/upload", formData);
      const imageUrl = uploadRes.url || uploadRes.data?.url;
      if (!imageUrl) {
        alert("Upload ảnh thất bại!");
        return;
      }

      const updateRes = await http("PATCH", "/api/v1/client/auth/profile", {
        avatar: imageUrl,
      });
      if (!updateRes.success) {
        alert(updateRes.message || "Không thể cập nhật avatar");
        return;
      }

      setProfile((prev) => ({ ...prev, avatar: imageUrl }));
      alert("Cập nhật ảnh đại diện thành công!");
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Lỗi upload avatar");
    } finally {
      setIsLoading(false);
      cancelUploadAvatar();
    }
  };

  const cancelUploadAvatar = () => {
    setShowConfirmDialog(false);
    setSelectedFile(null);
    setPreviewAvatar(null);
    const avatarInput = document.getElementById(
      "avatarInput",
    ) as HTMLInputElement;
    if (avatarInput) avatarInput.value = "";
  };

  // --- UI HELPERS ĐƯỢC LÀM ĐẸP LẠI ---
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          text: "Chờ xác nhận",
          bgColor: "bg-yellow-50 border-yellow-200",
          textColor: "text-yellow-700",
        };
      case "processing":
        return {
          text: "Đang xử lý",
          bgColor: "bg-blue-50 border-blue-200",
          textColor: "text-blue-700",
        };
      case "shipping":
        return {
          text: "Đang giao hàng",
          bgColor: "bg-purple-50 border-purple-200",
          textColor: "text-purple-700",
        };
      case "delivered":
        return {
          text: "Đã giao hàng",
          bgColor: "bg-green-50 border-green-200",
          textColor: "text-green-700",
        };
      case "completed":
        return {
          text: "Hoàn thành",
          bgColor: "bg-emerald-50 border-emerald-200",
          textColor: "text-emerald-700",
        };
      case "cancelled":
        return {
          text: "Đã hủy",
          bgColor: "bg-red-50 border-red-200",
          textColor: "text-red-700",
        };
      default:
        return {
          text: status,
          bgColor: "bg-slate-50 border-slate-200",
          textColor: "text-slate-700",
        };
    }
  };

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const getAvatarSrc = () => {
    if (previewAvatar) return previewAvatar;
    if (!profile.avatar) return "https://i.imgur.com/5Y2n5xR.jpg";
    return profile.avatar;
  };

  return (
    <Layout>
      <div className="bg-[#fcfdfc] min-h-screen text-slate-800 font-sans selection:bg-green-200 selection:text-green-900 pb-24">
        {/* ==================== 1. HEADER ==================== */}
        <section className="relative overflow-hidden bg-gradient-to-b from-green-50 to-transparent pt-12 pb-16 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green-200/30 rounded-[100%] blur-[100px] pointer-events-none -z-10"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex items-center justify-center text-slate-500 text-sm font-medium mb-6">
              <Link to="/" className="hover:text-green-600 transition-colors">
                Trang chủ
              </Link>
              <span className="mx-3 opacity-40">/</span>
              <span className="text-green-700 font-bold">Hồ sơ của tôi</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Tài khoản của bạn
            </h1>
            <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">
              Quản lý thông tin cá nhân, địa chỉ nhận hàng và theo dõi các đơn
              hàng đã đặt.
            </p>
          </div>
        </section>

        {/* ==================== MAIN CONTENT ==================== */}
        <div className="container mx-auto px-4 lg:px-8 -mt-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ==================== 2. SIDEBAR ==================== */}
            <aside className="lg:w-1/4">
              <div className="bg-white rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-50 overflow-hidden sticky top-24">
                {/* Avatar Section */}
                <div className="p-8 text-center bg-slate-50/50 border-b border-slate-100">
                  <div className="relative inline-block">
                    <div className="w-28 h-28 rounded-full p-1 bg-white shadow-md mx-auto mb-4">
                      <img
                        src={getAvatarSrc()}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-2 right-0 translate-x-1/4 translate-y-1/4">
                      <input
                        type="file"
                        id="avatarInput"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarSelected}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          document.getElementById("avatarInput")!.click()
                        }
                        className="bg-slate-900 text-white p-2.5 rounded-full hover:bg-green-600 shadow-lg transition-all active:scale-95"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          fill="none"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    {profile.full_name || "Thành viên"}
                  </h3>
                  <p className="text-sm font-medium text-slate-500">
                    {profile.email}
                  </p>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2">
                  {[
                    {
                      id: "info",
                      label: "Thông tin cá nhân",
                      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                    },
                    {
                      id: "orders",
                      label: "Đơn hàng của tôi",
                      icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
                    },
                    {
                      id: "addresses",
                      label: "Sổ địa chỉ",
                      icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
                    },
                    {
                      id: "security",
                      label: "Bảo mật",
                      icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all ${
                        activeTab === item.id
                          ? "bg-green-600 text-white shadow-md shadow-green-200"
                          : "text-slate-500 hover:bg-slate-50 hover:text-green-700"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={item.icon}
                        />
                        {item.id === "addresses" && (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        )}
                      </svg>
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* ==================== 3. MAIN CONTENT TABS ==================== */}
            <main className="lg:w-3/4">
              {apiError && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-xl mb-6 font-medium flex items-center gap-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  {apiError}
                </div>
              )}

              <div className="bg-white rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-50 overflow-hidden">
                {/* --- TAB: THÔNG TIN CÁ NHÂN --- */}
                {activeTab === "info" && (
                  <>
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                      <h2 className="text-2xl font-bold text-slate-900">
                        Chi tiết hồ sơ
                      </h2>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`font-bold transition-colors ${isEditing ? "text-slate-400 hover:text-slate-600" : "text-green-600 hover:text-green-700"}`}
                      >
                        {isEditing ? "Hủy chỉnh sửa" : "Chỉnh sửa"}
                      </button>
                    </div>

                    <div className="p-8">
                      {isEditing ? (
                        <form
                          onSubmit={handleSaveProfile}
                          className="max-w-xl space-y-6"
                        >
                          <div>
                            <label className="block text-slate-800 text-sm font-bold mb-3">
                              Họ và tên
                            </label>
                            <input
                              type="text"
                              name="full_name"
                              value={profile.full_name}
                              onChange={handleProfileChange}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-800 text-sm font-bold mb-3">
                              Email (Không thể thay đổi)
                            </label>
                            <input
                              type="email"
                              name="email"
                              value={profile.email}
                              disabled
                              className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-800 text-sm font-bold mb-3">
                              Số điện thoại
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              value={profile.phone}
                              onChange={handleProfileChange}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                            />
                          </div>
                          <div className="pt-4 flex gap-4">
                            <button
                              type="submit"
                              disabled={isLoading}
                              className="flex-1 bg-green-600 text-white py-3.5 rounded-xl font-bold hover:bg-green-700 transition-all active:scale-[0.98] disabled:opacity-70 shadow-sm"
                            >
                              {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                              Họ và tên
                            </p>
                            <p className="font-bold text-slate-900 text-lg">
                              {profile.full_name || "Chưa cập nhật"}
                            </p>
                          </div>
                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                              Email liên hệ
                            </p>
                            <p className="font-bold text-slate-900 text-lg">
                              {profile.email}
                            </p>
                          </div>
                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                              Số điện thoại
                            </p>
                            <p className="font-bold text-slate-900 text-lg">
                              {profile.phone || "Chưa cập nhật"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* --- TAB: ĐƠN HÀNG --- */}
                {activeTab === "orders" && (
                  <>
                    <div className="p-8 border-b border-slate-100 bg-slate-50/30">
                      <h2 className="text-2xl font-bold text-slate-900">
                        Lịch sử đơn hàng
                      </h2>
                    </div>
                    <div className="p-8">
                      {orders.length > 0 ? (
                        <div className="space-y-5">
                          {orders.map((order) => {
                            const statusInfo = getStatusInfo(order.status);
                            return (
                              <Link
                                key={order.id}
                                to={`/orders/${order.id}`}
                                className="block bg-white border border-slate-100 rounded-[1.5rem] p-6 hover:shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:border-green-100 transition-all group"
                              >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                  <div>
                                    <div className="flex items-center gap-3 mb-3">
                                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-green-700 transition-colors">
                                        Đơn hàng #{order.code}
                                      </h3>
                                      <span
                                        className={`border px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${statusInfo.bgColor} ${statusInfo.textColor}`}
                                      >
                                        {statusInfo.text}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-500">
                                      <span className="flex items-center gap-1.5">
                                        <svg
                                          className="w-4 h-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                          ></path>
                                        </svg>
                                        {new Date(
                                          order.createdAt,
                                        ).toLocaleDateString("vi-VN")}
                                      </span>
                                      <span className="flex items-center gap-1.5">
                                        <svg
                                          className="w-4 h-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                          ></path>
                                        </svg>
                                        {order.paymentStatus === "paid"
                                          ? "Đã thanh toán"
                                          : "Chưa thanh toán"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="md:text-right flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                                    <p className="text-xl font-black text-green-700 mb-1">
                                      {order.finalPrice.toLocaleString()} đ
                                    </p>
                                    <span className="text-sm font-bold text-slate-400 group-hover:text-green-600 transition-colors flex items-center gap-1">
                                      Chi tiết{" "}
                                      <span className="text-lg leading-none">
                                        &rarr;
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg
                              className="w-10 h-10"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                              ></path>
                            </svg>
                          </div>
                          <p className="text-slate-500 font-medium mb-6">
                            Bạn chưa có đơn hàng nào.
                          </p>
                          <Link
                            to="/products"
                            className="inline-flex items-center justify-center bg-green-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-green-700 transition-all active:scale-[0.98] shadow-sm"
                          >
                            Bắt đầu mua sắm ngay
                          </Link>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* --- TAB: SỔ ĐỊA CHỈ --- */}
                {activeTab === "addresses" && (
                  <>
                    <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-slate-900">
                        Sổ địa chỉ
                      </h2>
                    </div>
                    <div className="p-8">
                      {addresses.length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-5">
                          {addresses.map((address, index) => (
                            <div
                              key={index}
                              className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-green-300 transition-colors relative group"
                            >
                              <h3 className="font-bold text-slate-900 text-lg mb-2">
                                {address.fullName}
                              </h3>
                              <div className="space-y-1.5 text-sm font-medium text-slate-500">
                                <p className="flex items-center gap-2">
                                  <svg
                                    className="w-4 h-4 text-slate-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    ></path>
                                  </svg>
                                  {address.phone}
                                </p>
                                <p className="flex items-start gap-2 pt-1">
                                  <svg
                                    className="w-4 h-4 text-slate-400 shrink-0 mt-0.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    ></path>
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    ></path>
                                  </svg>
                                  <span>
                                    {address.addressLine1}, {address.ward},{" "}
                                    {address.district}, {address.province}
                                  </span>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-slate-500 font-medium">
                            Bạn chưa lưu địa chỉ nào.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* --- TAB: BẢO MẬT --- */}
                {activeTab === "security" && (
                  <>
                    <div className="p-8 border-b border-slate-100 bg-slate-50/30">
                      <h2 className="text-2xl font-bold text-slate-900">
                        Bảo mật tài khoản
                      </h2>
                    </div>
                    <div className="p-8">
                      <form
                        onSubmit={handlePasswordSubmit}
                        className="max-w-xl space-y-6"
                      >
                        {/* Current Password */}
                        <div>
                          <label className="block text-slate-800 text-sm font-bold mb-3">
                            Mật khẩu hiện tại
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword.current ? "text" : "password"}
                              name="currentPassword"
                              value={passwordData.currentPassword}
                              onChange={handlePasswordChange}
                              className={`w-full px-4 py-3 bg-slate-50 border ${errors.currentPassword ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-green-500"} rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:bg-white transition-all`}
                              placeholder="Nhập mật khẩu hiện tại"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPassword((p) => ({
                                  ...p,
                                  current: !p.current,
                                }))
                              }
                              className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                            >
                              {showPassword.current ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                          {errors.currentPassword && (
                            <p className="mt-2 text-xs font-bold text-red-500">
                              {errors.currentPassword}
                            </p>
                          )}
                        </div>

                        {/* New Password */}
                        <div>
                          <label className="block text-slate-800 text-sm font-bold mb-3">
                            Mật khẩu mới
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword.new ? "text" : "password"}
                              name="newPassword"
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              className={`w-full px-4 py-3 bg-slate-50 border ${errors.newPassword ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-green-500"} rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:bg-white transition-all`}
                              placeholder="Ít nhất 6 ký tự"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPassword((p) => ({ ...p, new: !p.new }))
                              }
                              className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                            >
                              {showPassword.new ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                          {errors.newPassword && (
                            <p className="mt-2 text-xs font-bold text-red-500">
                              {errors.newPassword}
                            </p>
                          )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label className="block text-slate-800 text-sm font-bold mb-3">
                            Xác nhận mật khẩu mới
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword.confirm ? "text" : "password"}
                              name="confirmPassword"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              className={`w-full px-4 py-3 bg-slate-50 border ${errors.confirmPassword ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-green-500"} rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:bg-white transition-all`}
                              placeholder="Nhập lại mật khẩu mới"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPassword((p) => ({
                                  ...p,
                                  confirm: !p.confirm,
                                }))
                              }
                              className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                            >
                              {showPassword.confirm ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                          {errors.confirmPassword && (
                            <p className="mt-2 text-xs font-bold text-red-500">
                              {errors.confirmPassword}
                            </p>
                          )}
                        </div>

                        <div className="pt-4">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-green-600 transition-all active:scale-[0.98] disabled:opacity-70 shadow-sm"
                          >
                            {isLoading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* ==================== MODAL AVATAR ==================== */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl transform transition-all">
            <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">
              Xác nhận ảnh đại diện
            </h3>
            <div className="flex justify-center mb-6">
              <div className="w-36 h-36 rounded-full p-1.5 bg-green-50 border-2 border-green-100">
                <img
                  src={previewAvatar || ""}
                  alt="Avatar preview"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <p className="text-slate-500 font-medium text-center mb-8">
              Bạn có chắc chắn muốn sử dụng hình ảnh này làm ảnh đại diện không?
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelUploadAvatar}
                className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmUploadAvatar}
                disabled={isLoading}
                className="flex-1 py-3.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-70 shadow-md shadow-green-200"
              >
                {isLoading ? "Đang tải..." : "Đồng ý"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProfilePage;
