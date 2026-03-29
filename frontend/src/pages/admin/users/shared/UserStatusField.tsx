import React from "react";

type UserStatusValue = "active" | "inactive";

interface UserStatusFieldProps {
  value: UserStatusValue;
  onChange: (value: UserStatusValue) => void;
  disabled?: boolean;
  disabledHint?: string;
}

const UserStatusField: React.FC<UserStatusFieldProps> = ({
  value,
  onChange,
  disabled = false,
  disabledHint,
}) => {
  return (
    <div className="pt-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Trạng thái
      </label>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="status"
            value="active"
            checked={value === "active"}
            onChange={() => onChange("active")}
            disabled={disabled}
            className="text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          />
          <span className="text-gray-800 dark:text-gray-200">Hoạt động</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="status"
            value="inactive"
            checked={value === "inactive"}
            onChange={() => onChange("inactive")}
            disabled={disabled}
            className="text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          />
          <span className="text-gray-800 dark:text-gray-200">Tạm dừng</span>
        </label>

        {disabled && disabledHint ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {disabledHint}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default UserStatusField;
