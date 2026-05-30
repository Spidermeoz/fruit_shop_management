import React from "react";
import type { ChatRecommendation } from "../../../types/chat";
import ChatRecommendationCard from "./ChatRecommendationCard";

interface ChatRecommendationListProps {
  items: ChatRecommendation[];
}

const ChatRecommendationList: React.FC<ChatRecommendationListProps> = ({
  items,
}) => {
  if (!items.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Gợi ý cho bạn</h3>
          <p className="text-xs text-slate-500">
            {items.length} sản phẩm phù hợp với nhu cầu của bạn.
          </p>
        </div>
        {items.length > 1 ? (
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
            {items.length} gợi ý
          </span>
        ) : null}
      </div>

      {/* 2 cột khi có ≥ 2 sản phẩm, 1 cột khi chỉ có 1 */}
      <div
        className={
          items.length === 1
            ? "grid grid-cols-1 gap-3"
            : "grid grid-cols-2 gap-2.5"
        }
      >
        {items.map((item) => (
          <ChatRecommendationCard
            key={item.id ?? `${item.title}-${item.productId ?? 0}`}
            item={item}
          />
        ))}
      </div>
    </div>
  );
};

export default ChatRecommendationList;
