import React from "react";
import { GitBranch } from "lucide-react";
import type { BranchOption } from "./userMappers";

interface UserBranchAssignmentProps {
  branches: BranchOption[];
  selectedBranchIds: number[];
  primaryBranchId: number | "";
  errors?: {
    branches?: string;
    primaryBranchId?: string;
  };
  readonly?: boolean;
  emptyMessage?: string;
  title?: string;
  required?: boolean;

  onToggleBranch?: (branchId: number) => void;
  onPrimaryBranchChange?: (branchId: number | "") => void;
}

const UserBranchAssignment: React.FC<UserBranchAssignmentProps> = ({
  branches,
  selectedBranchIds,
  primaryBranchId,
  errors,
  readonly = false,
  emptyMessage = "Người dùng này chưa có chi nhánh nào.",
  title = "Phân quyền chi nhánh",
  required = true,
  onToggleBranch,
  onPrimaryBranchChange,
}) => {
  const selectedBranches = branches.filter((b) =>
    selectedBranchIds.includes(b.id),
  );

  if (!branches.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/40">
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
            {title}
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <GitBranch className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
          {title} {required ? <span className="text-red-500">*</span> : null}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {branches.map((branch) => {
          const checked = selectedBranchIds.includes(branch.id);

          return (
            <label
              key={branch.id}
              className={`flex items-center justify-between rounded-md border p-3 transition-colors ${
                readonly ? "cursor-default" : "cursor-pointer"
              } ${
                checked
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            >
              <div>
                <p className="font-medium text-gray-800 dark:text-white">
                  {branch.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {branch.code}
                </p>
              </div>

              <input
                type="checkbox"
                checked={checked}
                disabled={readonly}
                onChange={() => onToggleBranch?.(branch.id)}
              />
            </label>
          );
        })}
      </div>

      {errors?.branches ? (
        <p className="text-sm text-red-600 dark:text-red-400 mt-2">
          {errors.branches}
        </p>
      ) : null}

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Chi nhánh chính{" "}
          {required ? <span className="text-red-500">*</span> : null}
        </label>

        <select
          value={primaryBranchId}
          disabled={readonly}
          onChange={(e) =>
            onPrimaryBranchChange?.(
              e.target.value ? Number(e.target.value) : "",
            )
          }
          className={`w-full border ${
            errors?.primaryBranchId
              ? "border-red-500 dark:border-red-500"
              : "border-gray-300 dark:border-gray-600"
          } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
        >
          <option value="">-- Chọn chi nhánh chính --</option>
          {selectedBranches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} ({branch.code})
            </option>
          ))}
        </select>

        {errors?.primaryBranchId ? (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {errors.primaryBranchId}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default UserBranchAssignment;
