import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ChatRecommendation } from "../../../types/chat";
import { useCart } from "../../../context/CartContext";
import { useAuth } from "../../../context/AuthContext";

interface ChatRecommendationCardProps {
  item: ChatRecommendation;
}

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value));
};

type AddState = "idle" | "loading" | "success" | "error";

const ChatRecommendationCard: React.FC<ChatRecommendationCardProps> = ({
  item,
}) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [addState, setAddState] = useState<AddState>("idle");

  const price = formatCurrency(item.price);
  const compareAtPrice = formatCurrency(item.compareAtPrice);
  const href = item.slug
    ? `/products/${item.slug}`
    : item.productId
      ? `/products/${item.productId}`
      : "#";

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!item.productVariantId) {
      // Không có variantId → chuyển đến trang sản phẩm để chọn
      navigate(href);
      return;
    }

    if (addState === "loading" || addState === "success") return;

    setAddState("loading");
    try {
      await addToCart(item.productVariantId, 1);
      setAddState("success");
      // Reset về idle sau 2 giây
      setTimeout(() => setAddState("idle"), 2000);
    } catch {
      setAddState("error");
      setTimeout(() => setAddState("idle"), 2000);
    }
  };

  const renderAddButton = () => {
    if (addState === "loading") {
      return (
        <button
          type="button"
          disabled
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-green-600/80 px-3 py-2 text-sm font-medium text-white"
        >
          <svg
            className="h-3.5 w-3.5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Đang thêm...
        </button>
      );
    }

    if (addState === "success") {
      return (
        <button
          type="button"
          disabled
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-white"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          Đã thêm vào giỏ
        </button>
      );
    }

    if (addState === "error") {
      return (
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-600"
        >
          Thử lại
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={handleAddToCart}
        className="group flex w-full items-center justify-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 active:scale-[0.97]"
      >
        <svg
          className="h-3.5 w-3.5 transition-transform group-hover:scale-110"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        Thêm vào giỏ
      </button>
    );
  };

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {/* Thumbnail */}
      <Link to={href} className="block aspect-[4/3] w-full bg-slate-100">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Chưa có ảnh
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="space-y-2.5 p-3">
        {/* Title + variant */}
        <div>
          <Link to={href}>
            <h4 className="line-clamp-2 text-sm font-semibold text-slate-800 transition hover:text-green-700">
              {item.title}
            </h4>
          </Link>
          {item.variantTitle ? (
            <p className="mt-0.5 text-xs text-slate-500">
              {item.variantTitle}
            </p>
          ) : null}
        </div>

        {/* Reason */}
        {item.reason ? (
          <div className="flex gap-1.5 text-xs leading-5 text-slate-600">
            <span className="mt-0.5 flex-shrink-0 text-green-600">✓</span>
            <p className="line-clamp-2">{item.reason}</p>
          </div>
        ) : null}

        {/* Price row */}
        {price || compareAtPrice ? (
          <div className="flex items-center gap-2">
            {price ? (
              <span className="text-sm font-bold text-green-700">{price}</span>
            ) : null}
            {compareAtPrice ? (
              <span className="text-xs text-slate-400 line-through">
                {compareAtPrice}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {renderAddButton()}
          <Link
            to={href}
            className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ChatRecommendationCard;
