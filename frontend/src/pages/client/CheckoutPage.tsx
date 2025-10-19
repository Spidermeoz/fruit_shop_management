import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

interface OrderInfo {
  name: string;
  phone: string;
  address: string;
  note: string;
  payment: string;
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();

  const [orderInfo, setOrderInfo] = useState<OrderInfo>({
    name: "",
    phone: "",
    address: "",
    note: "",
    payment: "cod",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setOrderInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Đặt hàng thành công!");
    navigate("/shop");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Banner */}
      <section className="bg-green-100 py-8 text-center">
        <h1 className="text-3xl font-bold text-green-800">Thanh toán</h1>
        <p className="text-gray-700 mt-2">Điền thông tin để hoàn tất đơn hàng</p>
      </section>

      <div className="container mx-auto px-6 py-10 grid md:grid-cols-3 gap-10">
        {/* Form thanh toán */}
        <form
          onSubmit={handleSubmit}
          className="md:col-span-2 bg-white border rounded-2xl shadow-sm p-6"
        >
          <h2 className="text-xl font-semibold text-green-800 mb-4">
            Thông tin người nhận
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="name"
              placeholder="Họ và tên"
              value={orderInfo.name}
              onChange={handleChange}
              required
              className="border rounded-lg p-3 focus:ring-2 focus:ring-green-500"
            />
            <input
              name="phone"
              placeholder="Số điện thoại"
              value={orderInfo.phone}
              onChange={handleChange}
              required
              className="border rounded-lg p-3 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <input
            name="address"
            placeholder="Địa chỉ giao hàng"
            value={orderInfo.address}
            onChange={handleChange}
            required
            className="border rounded-lg p-3 w-full mt-4 focus:ring-2 focus:ring-green-500"
          />

          <textarea
            name="note"
            placeholder="Ghi chú thêm (tuỳ chọn)"
            value={orderInfo.note}
            onChange={handleChange}
            className="border rounded-lg p-3 w-full mt-4 focus:ring-2 focus:ring-green-500"
          />

          <h3 className="text-lg font-semibold text-green-800 mt-6 mb-2">
            Phương thức thanh toán
          </h3>
          <select
            name="payment"
            value={orderInfo.payment}
            onChange={handleChange}
            className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-green-500"
          >
            <option value="cod">Thanh toán khi nhận hàng (COD)</option>
            <option value="bank">Chuyển khoản ngân hàng</option>
            <option value="momo">Ví MoMo</option>
          </select>

          <button
            type="submit"
            className="mt-6 bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800 transition w-full md:w-auto"
          >
            Xác nhận đặt hàng
          </button>
        </form>

        {/* Thông tin đơn hàng */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-green-800 mb-4">
            Đơn hàng của bạn
          </h3>
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-gray-700">
              <span>Rau cải xanh (x2)</span>
              <span>30.000 đ</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Cà rốt Đà Lạt (x1)</span>
              <span>18.000 đ</span>
            </div>
          </div>
          <div className="flex justify-between text-gray-700 mb-2">
            <span>Phí giao hàng:</span>
            <span>20.000 đ</span>
          </div>
          <div className="flex justify-between text-green-800 font-semibold text-lg">
            <span>Tổng cộng:</span>
            <span>68.000 đ</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
