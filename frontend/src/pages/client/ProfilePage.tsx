import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: "Nguyễn Văn Test",
    email: "test@gmail.com",
    phone: "1234567890",
    avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
  });

  const handleLogout = () => {
    // Xử lý logout (xóa token, session, v.v.)
    console.log("Đã đăng xuất");
    navigate("/login");
  };

  const handleEdit = () => {
    alert("Tính năng chỉnh sửa sẽ sớm được cập nhật!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-10">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 w-full max-w-2xl">
        <div className="flex flex-col items-center">
          <img
            src={user.avatar}
            alt="Avatar"
            className="w-32 h-32 rounded-full shadow-md border-4 border-green-500 mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {user.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
          <p className="text-gray-600 dark:text-gray-300">{user.phone}</p>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleEdit}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl font-medium transition"
          >
            Chỉnh sửa thông tin
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl font-medium transition"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
