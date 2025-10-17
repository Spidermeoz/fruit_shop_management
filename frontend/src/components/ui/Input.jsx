import React from "react";

export function Input({ className = "", icon: Icon, ...props }) {
  return (
    <div className="relative w-full">
      {Icon && <Icon className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />}
      <input
        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${Icon ? "pl-10" : ""} ${className}`}
        {...props}
      />
    </div>
  );
}
