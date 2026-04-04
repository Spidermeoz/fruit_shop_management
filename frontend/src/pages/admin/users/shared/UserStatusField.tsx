import React from "react";
import { CheckCircle2, PauseCircle } from "lucide-react";

interface UserStatusFieldProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  disabledHint?: string;
}

const UserStatusField = <T extends string>({
  value,
  onChange,
  disabled = false,
  disabledHint,
}: UserStatusFieldProps<T>) => {
  const options: Array<{
    value: "active" | "inactive";
    label: string;
    description: string;
    icon: React.ReactNode;
    activeClass: string;
  }> = [
    {
      value: "active",
      label: "Hoạt động",
      description:
        "Tài khoản có thể đăng nhập và sử dụng đầy đủ quyền được cấp.",
      icon: <CheckCircle2 className="w-4 h-4" />,
      activeClass:
        "border-green-500 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300",
    },
    {
      value: "inactive",
      label: "Tạm dừng",
      description:
        "Tài khoản tạm ngưng hoạt động nhưng vẫn được lưu trong hệ thống.",
      icon: <PauseCircle className="w-4 h-4" />,
      activeClass:
        "border-yellow-500 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300",
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
        Trạng thái
      </label>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Xác định tài khoản đang hoạt động bình thường hay đang ở trạng thái tạm
        dừng.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((option) => {
          const active = (value as string) === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value as unknown as T)}
              className={`text-left rounded-xl border p-4 transition-all ${
                disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
              } ${
                active
                  ? option.activeClass
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                {option.icon}
                <span>{option.label}</span>
              </div>
              <p className="mt-2 text-sm opacity-90">{option.description}</p>
            </button>
          );
        })}
      </div>

      {disabled && disabledHint ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          {disabledHint}
        </p>
      ) : null}
    </div>
  );
};

export default UserStatusField;
