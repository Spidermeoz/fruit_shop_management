import React from "react";

export function Button({ children, className = "", variant = "primary", ...props }) {
  const base =
    "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-400",
    secondary:
      "bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-gray-300",
    outline:
      "border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-gray-300",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
