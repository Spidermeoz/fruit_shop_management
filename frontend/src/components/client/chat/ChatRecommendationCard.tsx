import React from "react";
import { Link } from "react-router-dom";
import type { ChatRecommendation } from "../../../types/chat";

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

const ChatRecommendationCard: React.FC<ChatRecommendationCardProps> = ({
  item,
}) => {
  const price = formatCurrency(item.price);
  const compareAtPrice = formatCurrency(item.compareAtPrice);
  const href = item.slug
    ? `/products/${item.slug}`
    : item.productId
      ? `/products/${item.productId}`
      : "#";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="aspect-[4/3] w-full bg-slate-100">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Chưa có ảnh
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h4 className="line-clamp-2 text-sm font-semibold text-slate-800">
            {item.title}
          </h4>
          {item.variantTitle ? (
            <p className="mt-1 text-xs text-slate-500">
              Gợi ý quy cách: {item.variantTitle}
            </p>
          ) : null}
        </div>

        {item.reason ? (
          <p className="line-clamp-3 text-xs leading-5 text-slate-600">
            {item.reason}
          </p>
        ) : null}

        {price || compareAtPrice ? (
          <div className="flex items-center gap-2">
            {price ? (
              <span className="text-sm font-semibold text-green-700">
                {price}
              </span>
            ) : null}
            {compareAtPrice ? (
              <span className="text-xs text-slate-400 line-through">
                {compareAtPrice}
              </span>
            ) : null}
          </div>
        ) : null}

        <Link
          to={href}
          className="inline-flex items-center justify-center rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700"
        >
          Xem sản phẩm
        </Link>
      </div>
    </div>
  );
};

export default ChatRecommendationCard;
