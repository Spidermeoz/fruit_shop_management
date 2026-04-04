import React from "react";
import {
  CheckCircle2,
  GitBranch,
  MapPinned,
  AlertTriangle,
} from "lucide-react";
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
  const unselectedBranches = branches.filter(
    (b) => !selectedBranchIds.includes(b.id),
  );

  const hasPrimarySelected =
    primaryBranchId !== "" &&
    selectedBranchIds.includes(Number(primaryBranchId));

  if (!branches.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/40">
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

  const renderBranchCard = (branch: BranchOption, checked: boolean) => {
    const isPrimary = checked && Number(primaryBranchId) === branch.id;

    return (
      <label
        key={branch.id}
        className={`rounded-xl border p-3 transition-all ${
          readonly ? "cursor-default" : "cursor-pointer"
        } ${
          checked
            ? "border-blue-500 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20"
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {branch.name}
              </p>

              {isPrimary ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  <CheckCircle2 className="w-3 h-3" />
                  Chính
                </span>
              ) : null}
            </div>

            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <MapPinned className="w-3.5 h-3.5" />
              <span>{branch.code}</span>
            </div>
          </div>

          <input
            type="checkbox"
            checked={checked}
            disabled={readonly}
            onChange={() => onToggleBranch?.(branch.id)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      </label>
    );
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {title}{" "}
              {required ? <span className="text-red-500">*</span> : null}
            </h3>
          </div>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Chọn các chi nhánh người dùng được phép truy cập và xác định một chi
            nhánh chính để làm phạm vi mặc định.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">
            Đã chọn: {selectedBranches.length}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-medium">
            Khả dụng: {branches.length}
          </span>
        </div>
      </div>

      {selectedBranches.length > 0 ? (
        <div className="mb-5">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
            Chi nhánh đã chọn
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedBranches.map((branch) => renderBranchCard(branch, true))}
          </div>
        </div>
      ) : (
        <div className="mb-5 rounded-xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Chưa có chi nhánh nào được chọn.
            </p>
          </div>
        </div>
      )}

      {unselectedBranches.length > 0 ? (
        <div className="mb-5">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
            Chi nhánh khả dụng
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unselectedBranches.map((branch) =>
              renderBranchCard(branch, false),
            )}
          </div>
        </div>
      ) : null}

      {errors?.branches ? (
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">
          {errors.branches}
        </p>
      ) : null}

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/40">
        <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
          Chi nhánh chính{" "}
          {required ? <span className="text-red-500">*</span> : null}
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Chi nhánh chính được dùng làm scope mặc định trong nhiều luồng vận
          hành.
        </p>

        <select
          value={primaryBranchId}
          disabled={readonly || selectedBranches.length === 0}
          onChange={(e) =>
            onPrimaryBranchChange?.(
              e.target.value ? Number(e.target.value) : "",
            )
          }
          className={`w-full border rounded-md p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
            errors?.primaryBranchId
              ? "border-red-500 dark:border-red-500"
              : "border-gray-300 dark:border-gray-600"
          }`}
        >
          <option value="">
            {selectedBranches.length
              ? "-- Chọn chi nhánh chính --"
              : "-- Chọn ít nhất 1 chi nhánh trước --"}
          </option>
          {selectedBranches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} ({branch.code})
            </option>
          ))}
        </select>

        {errors?.primaryBranchId ? (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            {errors.primaryBranchId}
          </p>
        ) : null}

        {!errors?.primaryBranchId &&
        selectedBranches.length > 0 &&
        !hasPrimarySelected ? (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
            Hãy chọn một chi nhánh chính để hoàn tất cấu hình access scope.
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default UserBranchAssignment;
