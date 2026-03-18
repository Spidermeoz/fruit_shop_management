import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../../components/client/layout/Layout";
import { http } from "../../../services/http";

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
    role: {
      id: 0,
      title: "",
    },
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

  // State cho avatar
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // ==========================
  // 📌 LOAD PROFILE + ORDERS + ADDRESSES
  // ==========================
  useEffect(() => {
    loadProfile();
    loadAddresses();
    loadOrders();
  }, []);

  const loadProfile = async () => {
    try {
      setApiError(null);
      const res = await http("GET", "/api/v1/client/auth/me");
      // ✅ SỬA: Dùng res.data.user thay vì res.data.data
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
      // ✅ SỬA: Dùng res.data thay vì res.data.data
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
      // ✅ SỬA: Dùng res.data thay vì res.data.data và thêm kiểm tra mảng
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

  // validate phone number
  const confirmPhoneNumber = (phoneNumber: string) => {
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    return phoneRegex.test(phoneNumber);
  };

  // ==========================
  // 📌 SAVE PROFILE
  // ==========================
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

  // ==========================
  // CHANGE PASSWORD
  // ==========================
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (haveErrorPassword()) {
      return;
    }

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

  // ==========================
  // 📌 HANDLE AVATAR
  // ==========================
  const handleAvatarSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ảnh phải nhỏ hơn 2MB!");
      return;
    }

    // Tạo preview ảnh
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

      // Tạo FormData
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("folder", "avatars");

      // Gửi lên Cloudinary backend
      const uploadRes = await http("POST", "/api/v1/client/upload", formData);

      const imageUrl = uploadRes.url || uploadRes.data?.url;
      if (!imageUrl) {
        alert("Upload ảnh thất bại!");
        return;
      }

      // Cập nhật profile
      const updateRes = await http("PATCH", "/api/v1/client/auth/profile", {
        avatar: imageUrl,
      });

      if (!updateRes.success) {
        alert(updateRes.message || "Không thể cập nhật avatar");
        return;
      }

      // Update UI
      setProfile((prev) => ({
        ...prev,
        avatar: imageUrl,
      }));

      alert("Cập nhật ảnh đại diện thành công!");
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Lỗi upload avatar");
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
      setSelectedFile(null);
      setPreviewAvatar(null);
      // Reset input
      const avatarInput = document.getElementById(
        "avatarInput",
      ) as HTMLInputElement;
      if (avatarInput) avatarInput.value = "";
    }
  };

  const cancelUploadAvatar = () => {
    setShowConfirmDialog(false);
    setSelectedFile(null);
    setPreviewAvatar(null);
    // Reset input
    const avatarInput = document.getElementById(
      "avatarInput",
    ) as HTMLInputElement;
    if (avatarInput) avatarInput.value = "";
  };

  // ==========================
  // 📌 UI
  // ==========================
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          text: "Chờ xác nhận",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-700",
        };
      case "processing":
        return {
          text: "Đang xử lý",
          bgColor: "bg-blue-100",
          textColor: "text-blue-700",
        };
      case "shipping":
        return {
          text: "Đang giao hàng",
          bgColor: "bg-purple-100",
          textColor: "text-purple-700",
        };
      case "delivered":
        return {
          text: "Đã giao hàng",
          bgColor: "bg-green-100",
          textColor: "text-green-700",
        };
      case "completed":
        return {
          text: "Hoàn thành",
          bgColor: "bg-green-100",
          textColor: "text-green-700",
        };
      case "cancelled":
        return {
          text: "Đã hủy",
          bgColor: "bg-red-100",
          textColor: "text-red-700",
        };
      default:
        return {
          text: status,
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
        };
    }
  };

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: null,
    }));
  };

  // Hàm xử lý avatar
  const getAvatarSrc = () => {
    if (previewAvatar) {
      return previewAvatar;
    }
    if (!profile.avatar) {
      return "https://i.imgur.com/5Y2n5xR.jpg"; // Ảnh mặc định
    }
    return profile.avatar;
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
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            Thông tin cá nhân
          </h1>
          <p className="text-gray-700">Quản lý thông tin tài khoản của bạn</p>
          <div className="flex items-center justify-center text-gray-600 mt-2">
            <Link to="/" className="hover:text-green-600 transition">
              Trang chủ
            </Link>
            <span className="mx-2">/</span>
            <span className="text-green-700">Thông tin cá nhân</span>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-10">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="p-6 text-center">
                <div className="relative inline-block">
                  <img
                    src={getAvatarSrc()}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <div className="absolute bottom-3 right-0">
                    {/* INPUT FILE ẨN */}
                    <input
                      type="file"
                      id="avatarInput"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarSelected}
                    />

                    {/* NÚT CAMERA */}
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("avatarInput")!.click()
                      }
                      className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition"
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
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {profile.full_name}
                </h3>
                <p className="text-gray-600">{profile.email}</p>
              </div>

              <div className="border-t">
                <nav className="p-4 space-y-1">
                  <button
                    onClick={() => setActiveTab("info")}
                    className={`w-full text-left px-4 py-2 rounded-lg transition ${
                      activeTab === "info"
                        ? "bg-green-50 text-green-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Thông tin cá nhân
                  </button>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className={`w-full text-left px-4 py-2 rounded-lg transition ${
                      activeTab === "orders"
                        ? "bg-green-50 text-green-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Đơn hàng của tôi
                  </button>
                  <button
                    onClick={() => setActiveTab("addresses")}
                    className={`w-full text-left px-4 py-2 rounded-lg transition ${
                      activeTab === "addresses"
                        ? "bg-green-50 text-green-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Sổ địa chỉ
                  </button>
                  <button
                    onClick={() => setActiveTab("security")}
                    className={`w-full text-left px-4 py-2 rounded-lg transition ${
                      activeTab === "security"
                        ? "bg-green-50 text-green-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Bảo mật
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {/* Hiển thị thông báo lỗi API nếu có */}
            {apiError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {apiError}
              </div>
            )}

            {/* Thông tin cá nhân */}
            {activeTab === "info" && (
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Thông tin cá nhân
                  </h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-green-600 hover:text-green-700 font-medium transition"
                  >
                    {isEditing ? "Hủy" : "Chỉnh sửa"}
                  </button>
                </div>

                <div className="p-6">
                  {isEditing ? (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Họ và tên
                        </label>
                        <input
                          type="text"
                          name="full_name"
                          value={profile.full_name}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={profile.email}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Số điện thoại
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={profile.phone}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-600 text-sm">Họ và tên</p>
                          <p className="font-medium text-gray-800">
                            {profile.full_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Email</p>
                          <p className="font-medium text-gray-800">
                            {profile.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Số điện thoại</p>
                          <p className="font-medium text-gray-800">
                            {profile.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Đơn hàng của tôi */}
            {activeTab === "orders" && (
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Đơn hàng của tôi
                  </h2>
                </div>

                <div className="p-6">
                  {orders.length > 0 ? (
                    <>
                      <div className="space-y-4">
                        {orders.map((order) => {
                          const statusInfo = getStatusInfo(order.status);
                          return (
                            <Link
                              key={order.id}
                              to={`/orders/${order.id}`}
                              className="block border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-medium text-gray-800">
                                      Đơn hàng #{order.code}
                                    </h3>
                                    <span
                                      className={`${statusInfo.bgColor} ${statusInfo.textColor} px-2 py-1 rounded-full text-xs font-medium`}
                                    >
                                      {statusInfo.text}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Ngày đặt:{" "}
                                    {new Date(
                                      order.createdAt,
                                    ).toLocaleDateString()}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Trạng thái thanh toán:{" "}
                                    {order.paymentStatus === "paid"
                                      ? "Đã thanh toán"
                                      : "Chưa thanh toán"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-green-700">
                                    {order.finalPrice.toLocaleString()} đ
                                  </p>
                                  <span className="text-sm text-green-600 hover:text-green-700 transition">
                                    Xem chi tiết →
                                  </span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>

                      <div className="text-center mt-6">
                        <Link
                          to="/orders"
                          className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                          Xem tất cả đơn hàng
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Bạn chưa có đơn hàng nào.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sổ địa chỉ */}
            {activeTab === "addresses" && (
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Sổ địa chỉ
                  </h2>
                </div>

                <div className="p-6">
                  {addresses.length > 0 ? (
                    <div className="space-y-4">
                      {addresses.map((address, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 hover:shadow-md transition"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium text-gray-800">
                                  {address.fullName}
                                </h3>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                {address.phone}
                              </p>
                              <p className="text-sm text-gray-600">
                                {address.addressLine1}, {address.ward},{" "}
                                {address.district}, {address.province}
                              </p>
                              {address.postalCode && (
                                <p className="text-sm text-gray-600">
                                  Mã bưu chính: {address.postalCode}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Bạn chưa có địa chỉ nào.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bảo mật */}
            {activeTab === "security" && (
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Bảo mật
                  </h2>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    Đổi mật khẩu
                  </h3>

                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Mật khẩu hiện tại
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.current ? "text" : "password"}
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Nhập mật khẩu hiện tại"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((prev) => ({
                              ...prev,
                              current: !prev.current,
                            }))
                          }
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
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
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    {errors.currentPassword && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.currentPassword}
                      </p>
                    )}
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Mật khẩu mới
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.new ? "text" : "password"}
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Nhập mật khẩu mới"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((prev) => ({
                              ...prev,
                              new: !prev.new,
                            }))
                          }
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
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
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    {errors.newPassword && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.newPassword}
                      </p>
                    )}

                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Xác nhận mật khẩu mới
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.confirm ? "text" : "password"}
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Xác nhận mật khẩu mới"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((prev) => ({
                              ...prev,
                              confirm: !prev.confirm,
                            }))
                          }
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
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
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.confirmPassword}
                      </p>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                      >
                        {isLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog xác nhận thay đổi avatar */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Xác nhận thay đổi ảnh đại diện
            </h3>
            <div className="flex justify-center mb-4">
              <img
                src={previewAvatar || ""}
                alt="Avatar preview"
                className="w-32 h-32 rounded-full object-cover"
              />
            </div>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn cập nhật ảnh đại diện này không?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelUploadAvatar}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={confirmUploadAvatar}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {isLoading ? "Đang tải lên..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProfilePage;
