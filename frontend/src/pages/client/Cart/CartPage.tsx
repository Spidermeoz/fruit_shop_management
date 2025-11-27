import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../../components/client/layout/Layout";
import { useCart, type CartItem } from "../../../context/CartContext";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  Package, 
  ArrowRight,
  Check,
  ChevronLeft,
  Home
} from "lucide-react";

const CartPage: React.FC = () => {
  const { items, fetchCart, updateItem, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  // Danh sách sản phẩm được chọn
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  // Toggle chọn sản phẩm
  const toggleSelect = (productId: number) => {
    setSelectedItems((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Chọn tất cả/hủy chọn tất cả
  useEffect(() => {
    if (items.length > 0 && selectedItems.length === items.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedItems, items]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.productId));
    }
    setSelectAll(!selectAll);
  };

  // Hàm tính giá hiệu quả (sau khi giảm giá)
  const getEffectivePrice = (product: CartItem["product"]) => {
    if (!product || product.price === null) return 0;
    if (product.discountPercentage && product.discountPercentage > 0) {
      return product.price * (1 - product.discountPercentage / 100);
    }
    return product.price;
  };

  // NEW: Tính subtotal theo selected items
  const selectedProducts = items.filter((item) =>
    selectedItems.includes(item.productId)
  );

  const subtotal = selectedProducts.reduce(
    (acc, item) => acc + getEffectivePrice(item.product) * item.quantity,
    0
  );

  const shippingFee = selectedItems.length > 0 ? 20000 : 0;
  const total = subtotal + shippingFee;

  // Tăng/giảm số lượng
  const handleUpdateQty = (productId: number, delta: number) => {
    const item = items.find((i) => i.productId === productId);
    if (!item) return;
    const newQty = Math.max(1, item.quantity + delta);
    updateItem(productId, newQty);
  };

  // Xóa sản phẩm
  const handleRemove = (productId: number) => {
    removeItem(productId);
    setSelectedItems((prev) => prev.filter((id) => id !== productId));
  };

  // Điều hướng checkout
  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm trước khi thanh toán.");
      return;
    }
    navigate("/checkout", { state: { selectedItems } });
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
            Giỏ hàng của bạn
          </h1>
          <p className="text-gray-700">
            Kiểm tra sản phẩm trước khi thanh toán nhé!
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-10">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-6">
              <ShoppingCart className="h-24 w-24 mx-auto text-green-600" />
            </div>
            <h2 className="text-2xl text-gray-700 mb-4">
              Giỏ hàng của bạn đang trống
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                <ShoppingBag className="w-5 h-5" />
                Mua sắm ngay
              </Link>
              <Link
                to="/orders"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                <Package className="w-5 h-5" />
                Xem đơn hàng
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-10">
            {/* DANH SÁCH SẢN PHẨM */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Sản phẩm trong giỏ hàng ({items.length})
                    </h2>
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition"
                    >
                      {selectAll ? (
                        <>
                          <Check className="w-4 h-4" />
                          Bỏ chọn tất cả
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 border-2 border-white rounded"></div>
                          Chọn tất cả
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex flex-col md:flex-row items-center gap-4 p-4 ${
                        index !== items.length - 1 ? "border-b" : ""
                      } hover:bg-green-50 transition rounded-lg`}
                    >
                      {/* Checkbox chọn */}
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.productId)}
                        onChange={() => toggleSelect(item.productId)}
                        className="w-5 h-5 accent-green-600 rounded"
                      />

                      <img
                        src={item.product?.thumbnail || ""}
                        alt={item.product?.title ?? ""}
                        className="w-24 h-24 rounded-lg object-cover shadow-sm"
                      />

                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-green-800">
                          {item.product?.title}
                        </h3>
                        <div className="mt-1">
                          {item.product && item.product.discountPercentage && item.product.discountPercentage > 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-green-700 font-medium">
                                {getEffectivePrice(item.product).toLocaleString()} đ / kg
                              </span>
                              <span className="text-gray-500 line-through text-sm">
                                {(item.product.price || 0).toLocaleString()} đ
                              </span>
                              <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">
                                -{item.product.discountPercentage}%
                              </span>
                            </div>
                          ) : (
                            <p className="text-green-700 font-medium">
                              {(item.product?.price || 0).toLocaleString()} đ / kg
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Nút tăng giảm */}
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                          <button
                            onClick={() => handleUpdateQty(item.productId, -1)}
                            className="px-3 py-2 text-green-700 hover:bg-green-100 transition"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-3 py-2 border-l border-r border-gray-300 font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item.productId, 1)}
                            className="px-3 py-2 text-green-700 hover:bg-green-100 transition"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Giá & Xóa */}
                      <div className="text-right">
                        <div className="font-semibold text-green-700 text-lg">
                          {item.product && item.product.discountPercentage && item.product.discountPercentage > 0 ? (
                            <div>
                              <div>
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
                            </div>
                          ) : (
                            <div>
                              {(
                                (item.product?.price || 0) * item.quantity
                              ).toLocaleString()}{" "}
                              đ
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleRemove(item.productId)}
                          className="text-red-500 hover:text-red-700 mt-2 transition flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xoá
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Clear all */}
                <div className="p-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <Link
                    to="/products"
                    className="flex items-center text-green-700 hover:text-green-800 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Tiếp tục mua sắm
                  </Link>

                  <div className="flex gap-3">
                    {/* <Link
                      to="/orders"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 px-4 py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition"
                    >
                      <Package className="w-4 h-4" />
                      Đơn hàng của bạn
                    </Link> */}
                    <button
                      onClick={clearCart}
                      className="flex items-center gap-2 text-red-500 hover:text-red-700 px-4 py-2 border border-red-500 rounded-lg hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa tất cả
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* TỔNG THANH TOÁN (cập nhật theo selected items) */}
            <div>
              <div className="bg-gradient-to-br from-green-50 to-yellow-50 rounded-2xl p-6 shadow-md sticky top-6">
                <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Thông tin đơn hàng
                </h3>

                {selectedItems.length === 0 ? (
                  <div className="bg-white/70 rounded-lg p-4 mb-4">
                    <p className="text-gray-600 text-sm">
                      Vui lòng chọn sản phẩm để xem tổng tiền.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white/70 rounded-lg p-4 space-y-3 mb-6">
                    <div className="flex justify-between text-gray-700">
                      <span>Sản phẩm ({selectedItems.length}):</span>
                      <span>{subtotal.toLocaleString()} đ</span>
                    </div>

                    <div className="flex justify-between text-gray-700">
                      <span>Phí giao hàng:</span>
                      <span>{shippingFee.toLocaleString()} đ</span>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex justify-between text-green-800 font-bold text-lg">
                        <span>Tổng cộng:</span>
                        <span>{total.toLocaleString()} đ</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nút checkout */}
                <button
                  onClick={handleCheckout}
                  className={`block w-full text-center py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2
                    ${
                      selectedItems.length === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-lg transform hover:scale-105"
                    }`}
                >
                  Thanh toán ngay{" "}
                  {selectedItems.length > 0
                    ? `(${selectedItems.length} sản phẩm)`
                    : ""}
                  <ArrowRight className="w-5 h-5" />
                </button>

                {/* Thêm nút điều hướng đến trang Đơn hàng */}
                <Link
                  to="/orders"
                  className="block w-full text-center py-3 mt-3 rounded-lg font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Package className="w-5 h-5" />
                  Xem đơn hàng của bạn
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CartPage;