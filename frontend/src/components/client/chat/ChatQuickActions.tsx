import React from "react";
import type { ChatQuickAction } from "../../../types/chat";

interface ChatQuickActionsProps {
  items: ChatQuickAction[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

const ChatQuickActions: React.FC<ChatQuickActionsProps> = ({
  items,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(item.prompt)}
          className="rounded-full border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default ChatQuickActions;
