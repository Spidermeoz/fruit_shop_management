import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
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
} from "lucide-react";
import { useToast } from "../../../context/ToastContext";
import Footer from "../../../components/client/layouts/Footer";

const CartPage: React.FC = () => {
  const { items, fetchCart, updateItem, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  // Danh sách sản phẩm được chọn
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [qtyInputs, setQtyInputs] = useState<Record<number, number>>({});

  const { showErrorToast } = useToast();

  useEffect(() => {
    fetchCart();
  }, []);

  // Toggle chọn sản phẩm
  const toggleSelect = (productId: number) => {
    setSelectedItems((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
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
      setSelectedItems(items.map((item) => item.productId));
    }
    setSelectAll(!selectAll);
  };

  useEffect(() => {
    const map: Record<number, number> = {};
    items.forEach((item) => {
      map[item.productId] = item.quantity;
    });
    setQtyInputs(map);
  }, [items]);

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
    selectedItems.includes(item.productId),
  );

  const subtotal = selectedProducts.reduce(
    (acc, item) => acc + getEffectivePrice(item.product) * item.quantity,
    0,
  );

  const shippingFee = selectedItems.length > 0 ? 20000 : 0;
  const total = subtotal + shippingFee;

  // Tăng/giảm số lượng
  const handleUpdateQty = (productId: number, delta: number) => {
    const item = items.find((i) => i.productId === productId);
    if (!item) return;

    const stock = item.product?.stock || 9999;

    const current = qtyInputs[productId] ?? item.quantity;
    let newQty = current + delta;

    if (newQty < 1) newQty = 1;
    if (newQty > stock) {
      showErrorToast(`Chỉ còn ${stock} sản phẩm`);
      newQty = stock;
    }

    setQtyInputs((prev) => ({
      ...prev,
      [productId]: newQty,
    }));

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
      showErrorToast("Vui lòng chọn ít nhất một sản phẩm trước khi thanh toán.");
      return;
    }
    navigate("/checkout", { state: { selectedItems } });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfc]">
      <Layout>
        {/* Banner Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-green-100/50 to-transparent py-12 text-center">
          <div className="flex items-center justify-center text-slate-500 text-sm font-medium mb-6">
            <Link to="/" className="hover:text-green-600 transition-colors">
              Trang chủ
            </Link>
            <span className="mx-3 opacity-40">/</span>
            <span className="text-green-700">Giỏ hàng</span>
          </div>
          <div className="container mx-auto relative z-10 px-4">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-green-50 text-green-600">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                Giỏ hàng của bạn
              </h1>
            </div>
            <p className="text-slate-500 font-medium text-sm md:text-base">
              Kiểm tra kỹ các sản phẩm tươi ngon trước khi đặt hàng nhé!
            </p>
          </div>
        </section>

        {/* Main Content */}
        <div className="flex-grow container mx-auto px-4 lg:px-8 py-10 pb-20">
          <div className="max-w-7xl mx-auto">
            {items.length === 0 ? (
              // Empty Cart State
              <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-[0_30px_80px_rgba(0,0,0,0.06)] border border-slate-50 max-w-2xl mx-auto">
                <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
                  <ShoppingCart className="h-10 w-10" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  Giỏ hàng đang trống
                </h2>
                <p className="text-slate-500 font-medium mb-10">
                  Bạn chưa chọn sản phẩm nào. Hãy quay lại cửa hàng để khám phá
                  những loại trái cây tươi ngon nhất hôm nay!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/products"
                    className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-green-700 hover:shadow-[0_15px_30px_rgba(34,197,94,0.3)] transition-all duration-300 transform active:scale-95"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Mua sắm ngay
                  </Link>
                  <Link
                    to="/orders"
                    className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 px-8 py-4 rounded-2xl font-bold border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600 transition-all duration-300 transform active:scale-95"
                  >
                    <Package className="w-5 h-5" />
                    Xem đơn hàng
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid lg:grid-cols-12 gap-8 lg:gap-10">
                {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
                <div className="lg:col-span-8">
                  <div className="bg-white rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.06)] border border-slate-50 overflow-hidden">
                    {/* Header Giỏ hàng */}
                    <div className="bg-slate-900 px-6 md:px-8 py-5 flex justify-between items-center">
                      <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <span className="bg-white/20 p-2 rounded-lg">
                          <ShoppingCart className="w-5 h-5" />
                        </span>
                        Sản phẩm ({items.length})
                      </h2>
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center gap-2 text-sm font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors"
                      >
                        {selectAll ? (
                          <>
                            <Check className="w-4 h-4" /> Bỏ chọn tất cả
                          </>
                        ) : (
                          <>
                            <div className="w-4 h-4 border-2 border-white/50 rounded flex items-center justify-center"></div>
                            Chọn tất cả
                          </>
                        )}
                      </button>
                    </div>

                    {/* Danh sách Item */}
                    <div className="p-4 md:p-6 space-y-4">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-4 rounded-[1.5rem] border border-slate-100 hover:border-green-200 hover:bg-green-50/30 transition-colors group"
                        >
                          {/* Checkbox */}
                          <div className="flex-shrink-0 pt-1 sm:pt-0">
                            <label
                              className="relative flex cursor-pointer items-center rounded-full p-1"
                              htmlFor={`check-${item.productId}`}
                            >
                              <input
                                type="checkbox"
                                id={`check-${item.productId}`}
                                checked={selectedItems.includes(item.productId)}
                                onChange={() => toggleSelect(item.productId)}
                                className="peer h-6 w-6 cursor-pointer appearance-none rounded-md border-2 border-slate-300 checked:border-green-600 checked:bg-green-600 transition-all"
                              />
                              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                                <Check className="h-4 w-4 stroke-[3]" />
                              </div>
                            </label>
                          </div>

                          {/* Thumbnail */}
                          <Link
                            to={`/products/${item.productId}`}
                            className="flex-shrink-0 relative overflow-hidden rounded-2xl w-24 h-24 sm:w-28 sm:h-28 border border-slate-100 bg-white"
                          >
                            <img
                              src={item.product?.thumbnail || ""}
                              alt={item.product?.title ?? ""}
                              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                            />
                          </Link>

                          {/* Info */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between w-full">
                            <Link
                              to={`/products/${item.productId}`}
                              className="text-lg font-bold text-slate-900 hover:text-green-600 transition-colors truncate block mb-1"
                            >
                              {item.product?.title}
                            </Link>

                            <div className="mb-4 sm:mb-0">
                              {item.product &&
                              item.product.discountPercentage &&
                              item.product.discountPercentage > 0 ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-green-600 font-black text-lg">
                                    {getEffectivePrice(
                                      item.product,
                                    ).toLocaleString()}{" "}
                                    đ
                                  </span>
                                  <span className="text-slate-400 line-through text-sm font-medium">
                                    {(item.product.price || 0).toLocaleString()}{" "}
                                    đ
                                  </span>
                                  <span className="bg-red-500 text-white px-2 py-0.5 rounded-md text-xs font-bold">
                                    -{item.product.discountPercentage}%
                                  </span>
                                </div>
                              ) : (
                                <p className="text-green-600 font-black text-lg">
                                  {(item.product?.price || 0).toLocaleString()}{" "}
                                  đ
                                </p>
                              )}
                              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                Đơn vị: kg
                              </p>
                            </div>

                            {/* Qty & Actions Mobile */}
                            <div className="flex sm:hidden items-center justify-between mt-4 border-t border-slate-100 pt-4 w-full">
                              {/* Group: Nút tăng giảm - tái sử dụng */}
                              <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-1">
                                <button
                                  onClick={() =>
                                    handleUpdateQty(item.productId, -1)
                                  }
                                  className="w-8 h-8 flex items-center justify-center text-slate-500 bg-white rounded-lg shadow-sm hover:text-green-600 transition-colors active:scale-95"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max={item.product?.stock || 9999}
                                  value={
                                    qtyInputs[item.productId] ?? item.quantity
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (!/^\d*$/.test(val)) return;
                                    setQtyInputs((prev) => ({
                                      ...prev,
                                      [item.productId]: Number(val),
                                    }));
                                  }}
                                  onBlur={(e) => {
                                    let qty = Number(e.target.value);
                                    if (!qty || qty <= 0) qty = 1;
                                    const stock = item.product?.stock || 9999;
                                    if (qty > stock) {
                                      showErrorToast(`Chỉ còn ${stock} sản phẩm`);
                                      qty = stock;
                                    }
                                    setQtyInputs((prev) => ({
                                      ...prev,
                                      [item.productId]: qty,
                                    }));
                                    updateItem(item.productId, qty);
                                  }}
                                  className="w-10 h-8 text-center font-bold text-slate-900 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                  onClick={() =>
                                    handleUpdateQty(item.productId, 1)
                                  }
                                  className="w-8 h-8 flex items-center justify-center text-slate-500 bg-white rounded-lg shadow-sm hover:text-green-600 transition-colors active:scale-95"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                              <button
                                onClick={() => handleRemove(item.productId)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          {/* Desktop Qty & Total */}
                          <div className="hidden sm:flex flex-col items-end gap-4 ml-auto min-w-[120px]">
                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Thành tiền
                              </p>
                              <p className="font-black text-slate-900 text-lg">
                                {(
                                  getEffectivePrice(item.product) *
                                  item.quantity
                                ).toLocaleString()}{" "}
                                đ
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-1">
                                <button
                                  onClick={() =>
                                    handleUpdateQty(item.productId, -1)
                                  }
                                  className="w-8 h-8 flex items-center justify-center text-slate-500 bg-white rounded-lg shadow-sm hover:text-green-600 transition-colors active:scale-95"
                                >
                                  <Minus className="w-4 h-4 stroke-[3]" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max={item.product?.stock || 9999}
                                  value={
                                    qtyInputs[item.productId] ?? item.quantity
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (!/^\d*$/.test(val)) return;
                                    setQtyInputs((prev) => ({
                                      ...prev,
                                      [item.productId]: Number(val),
                                    }));
                                  }}
                                  onBlur={(e) => {
                                    let qty = Number(e.target.value);
                                    if (!qty || qty <= 0) qty = 1;
                                    const stock = item.product?.stock || 9999;
                                    if (qty > stock) {
                                      showErrorToast(`Chỉ còn ${stock} sản phẩm`);
                                      qty = stock;
                                    }
                                    setQtyInputs((prev) => ({
                                      ...prev,
                                      [item.productId]: qty,
                                    }));
                                    updateItem(item.productId, qty);
                                  }}
                                  className="w-12 h-8 text-center font-bold text-slate-900 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                  onClick={() =>
                                    handleUpdateQty(item.productId, 1)
                                  }
                                  className="w-8 h-8 flex items-center justify-center text-slate-500 bg-white rounded-lg shadow-sm hover:text-green-600 transition-colors active:scale-95"
                                >
                                  <Plus className="w-4 h-4 stroke-[3]" />
                                </button>
                              </div>

                              <button
                                onClick={() => handleRemove(item.productId)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                title="Xoá sản phẩm"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-slate-50 p-4 md:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100">
                      <Link
                        to="/products"
                        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-green-600 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 stroke-[3]" />
                        Tiếp tục mua sắm
                      </Link>

                      <button
                        onClick={clearCart}
                        className="flex items-center gap-2 text-sm font-bold text-red-500 bg-white px-5 py-3 rounded-xl border border-red-100 hover:bg-red-50 hover:border-red-200 transition-all active:scale-95 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa tất cả giỏ hàng
                      </button>
                    </div>
                  </div>
                </div>

                {/* CỘT PHẢI: TỔNG THANH TOÁN */}
                <div className="lg:col-span-4 relative h-full">
                  {/* ĐÂY LÀ THẺ SẼ DÍNH LẠI KHI CUỘN: top-[100px] để chừa khoảng trống cho header */}
                  <div className="sticky top-[100px] z-10 self-start h-fit pb-10">
                    <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.06)] border border-slate-50">
                      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                        <span className="bg-green-50 text-green-600 p-2.5 rounded-xl">
                          <ShoppingBag className="w-5 h-5" />
                        </span>
                        Tóm tắt đơn hàng
                      </h3>

                      {selectedItems.length === 0 ? (
                        <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100 border-dashed mb-6">
                          <p className="text-slate-500 font-medium text-sm">
                            Vui lòng check chọn sản phẩm bên trái để xem tổng
                            tiền và thanh toán.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4 mb-8">
                          <div className="flex justify-between items-center text-slate-600 font-medium">
                            <span>Sản phẩm ({selectedItems.length})</span>
                            <span className="font-bold text-slate-900">
                              {subtotal.toLocaleString()} đ
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-slate-600 font-medium">
                            <span>Phí giao hàng dự kiến</span>
                            <span className="font-bold text-slate-900">
                              {shippingFee.toLocaleString()} đ
                            </span>
                          </div>

                          <div className="border-t border-slate-100 pt-4">
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
                      )}

                      {/* Nút checkout */}
                      <div className="space-y-3">
                        <button
                          onClick={handleCheckout}
                          disabled={selectedItems.length === 0}
                          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2
            ${
              selectedItems.length === 0
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-green-700 hover:shadow-[0_15px_30px_rgba(34,197,94,0.3)] active:scale-95"
            }`}
                        >
                          Thanh toán ngay
                          {selectedItems.length > 0 && (
                            <ArrowRight className="w-5 h-5 stroke-[3]" />
                          )}
                        </button>

                        <Link
                          to="/orders"
                          className="w-full py-4 rounded-2xl font-bold text-slate-700 bg-white border-2 border-slate-100 hover:border-blue-500 hover:text-blue-600 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
                        >
                          <Package className="w-5 h-5" />
                          Lịch sử đơn hàng
                        </Link>
                      </div>

                      {/* Trust Badges */}
                      <div className="mt-8 flex justify-center gap-4 border-t border-slate-100 pt-6">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                          <svg
                            className="w-4 h-4 text-green-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                          Bảo mật 100%
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                          <svg
                            className="w-4 h-4 text-green-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                          </svg>
                          Đổi trả dễ dàng
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
      <Footer />
    </div>
  );
};

export default CartPage;
