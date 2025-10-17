import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ current, total, onChange }) {
  const pages = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center mt-6 space-x-2">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1 rounded-lg border text-sm ${
            current === p
              ? "bg-blue-600 text-white border-blue-600"
              : "hover:bg-gray-100 border-gray-300"
          }`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
