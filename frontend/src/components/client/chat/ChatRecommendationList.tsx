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
      <div>
        <h3 className="text-sm font-semibold text-slate-800">Gợi ý cho bạn</h3>
        <p className="text-xs text-slate-500">
          Dựa trên nhu cầu bạn vừa mô tả.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3">
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
