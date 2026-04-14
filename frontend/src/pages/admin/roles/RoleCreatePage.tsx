import React, { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  LayoutTemplate,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Lightbulb,
  Info,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// ==========================================
// TYPES & CONSTANTS
// ==========================================
interface RoleFormData {
  title: string;
  description: string;
}

type NextStep = "workspace" | "matrix" | "board";

type ApiOk<T> = { success: true; data: T; meta?: any; message?: string };
type ApiErr = { success: false; message?: string; errors?: any };

// ==========================================
// HELPERS
// ==========================================
const getNextStepButtonLabel = (step: NextStep) => {
  switch (step) {
    case "workspace":
      return "Tạo và mở workspace";
    case "matrix":
      return "Tạo và đi tới ma trận";
    case "board":
      return "Tạo role";
  }
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const RoleCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccessToast } = useAdminToast();

  // --- States: Form & UI ---
  const [formData, setFormData] = useState<RoleFormData>({
    title: "",
    description: "",
  });
  const [nextStep, setNextStep] = useState<NextStep>("workspace");

  // --- States: API & Validation ---
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof RoleFormData | "general", string>>
  >({});

  // --- Handlers ---
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof RoleFormData | "general", string>> =
      {};
    if (!formData.title.trim()) {
      newErrors.title = "Vui lòng nhập tên vai trò.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrors({});

      const payload = {
        title: formData.title,
        description: formData.description,
      };

      const res = await http<ApiOk<any> | ApiErr>(
        "POST",
        "/api/v1/admin/roles/create",
        payload,
      );

      if (res.success) {
        showSuccessToast({ message: "Khởi tạo vai trò thành công!" });

        // Điều hướng theo định hướng Next Step
        const newRoleId =
          (res as ApiOk<any>).data?.id || (res as ApiOk<any>).data?.role?.id;

        if (nextStep === "workspace") {
          if (newRoleId) navigate(`/admin/roles/edit/${newRoleId}`);
          else navigate("/admin/roles"); // Fallback an toàn
        } else if (nextStep === "matrix") {
          navigate("/admin/roles/permissions");
        } else {
          navigate("/admin/roles");
        }
      } else {
        if (res.errors) {
          setErrors(res.errors);
        } else {
          setErrors({ general: res.message || "Không thể khởi tạo vai trò." });
        }
      }
    } catch (err: any) {
      console.error("Create role error:", err);
      const message =
        err?.data?.message || err?.message || "Lỗi kết nối server!";
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="w-full pb-10 space-y-6">
      {/* A. Header Định hướng */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-4 z-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => navigate("/admin/roles")}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 transition"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Khởi tạo vai trò truy cập
            </h1>
            <span className="hidden md:inline-flex px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 ml-2">
              Role Setup
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 ml-10 text-sm max-w-2xl">
            Thiết lập một access profile mới và cấu hình bước tiếp theo.
          </p>
        </div>
        <div className="ml-10 md:ml-0 flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/roles/permissions")}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <LayoutTemplate className="w-4 h-4" /> Ma trận quyền
          </button>
        </div>
      </div>

      {/* B. Top Setup Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 border-gray-200 dark:border-gray-700 flex items-start gap-3 bg-gray-50/50 dark:bg-gray-800/30">
          <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">
              1. Định danh
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Đặt tên và mô tả rõ mục đích sử dụng của nhóm quyền này.
            </p>
          </div>
        </Card>
        <Card className="p-4 border-gray-200 dark:border-gray-700 flex items-start gap-3 bg-gray-50/50 dark:bg-gray-800/30">
          <div className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">
              2. Tiếp nối
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Mở ngay workspace hoặc ma trận để hoàn thiện phân quyền.
            </p>
          </div>
        </Card>
      </div>

      <form onSubmit={handleSubmit}>
        {/* C. Main Layout 2 Cột */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* === CỘT TRÁI: FORM SETUP (2/3) === */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Thông tin cơ bản */}
            <Card className="!p-0 overflow-hidden border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-2">
                <Info className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Thông tin cơ bản
                </h2>
              </div>
              <div className="p-5 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                    Tên vai trò <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Vd: Nhân viên sale, Kế toán trưởng..."
                    className={`w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.title
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                    Tên hiển thị dùng để phân biệt role trong quản trị người
                    dùng và phân quyền.
                  </p>
                  {errors.title && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1.5">
                      {errors.title}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                    Mô tả vai trò
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Nhập mô tả vai trò..."
                    className={`w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-y ${
                      errors.description
                        ? "border-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                    Mô tả ngắn mục đích sử dụng, phạm vi áp dụng hoặc nhóm người
                    dùng phù hợp.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* === CỘT PHẢI: REVIEW & GUIDANCE (1/3) === */}
          <div className="space-y-6">
            {/* Tóm tắt thiết lập */}
            <Card className="border-gray-200 dark:border-gray-700 !p-0 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Tóm tắt thiết lập
                </h3>
              </div>
              <div className="p-4 space-y-4 text-sm font-medium">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">
                    Tên role
                  </span>
                  <span className="text-gray-900 dark:text-white text-right line-clamp-2">
                    {formData.title || (
                      <span className="text-gray-400 italic">Chưa nhập</span>
                    )}
                  </span>
                </div>
              </div>
            </Card>

            {/* Bước tiếp theo */}
            <Card className="border-gray-200 dark:border-gray-700 !p-0 overflow-hidden ring-1 ring-blue-500/20">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-blue-50/50 dark:bg-blue-900/10">
                <h3 className="font-bold text-blue-900 dark:text-blue-400">
                  Bước tiếp theo sau khi tạo
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="nextStep"
                    checked={nextStep === "workspace"}
                    onChange={() => setNextStep("workspace")}
                    className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div>
                    <span className="block text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      Mở workspace của role
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Kiểm tra thông tin và tổng quan sức khỏe của role. (Khuyên
                      dùng)
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="nextStep"
                    checked={nextStep === "matrix"}
                    onChange={() => setNextStep("matrix")}
                    className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div>
                    <span className="block text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      Đi tới ma trận phân quyền
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Bắt đầu gán quyền chi tiết ngay lập tức.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="nextStep"
                    checked={nextStep === "board"}
                    onChange={() => setNextStep("board")}
                    className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div>
                    <span className="block text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      Quay lại roles board
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Lưu lại và cấu hình sau.
                    </span>
                  </div>
                </label>
              </div>
            </Card>

            {/* Gợi ý thiết lập */}
            <Card className="border-gray-200 dark:border-gray-700 bg-amber-50/30 dark:bg-amber-900/10">
              <div className="flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-500">
                <Lightbulb className="w-5 h-5" />
                <h3 className="font-bold text-sm">Gợi ý thiết lập</h3>
              </div>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2 list-disc pl-4">
                <li>
                  Role nên phản ánh <strong>nhóm trách nhiệm</strong>, không
                  phản ánh cá nhân cụ thể.
                </li>
                <li>
                  Sau khi tạo, hãy rà soát lại các{" "}
                  <strong>quyền nhạy cảm</strong> (xóa, cấp quyền) trong ma trận
                  phân quyền.
                </li>
              </ul>
            </Card>

            {/* General Error (if any) */}
            {errors.general && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {errors.general}
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 font-bold shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Đang thiết
                    lập...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />{" "}
                    {getNextStepButtonLabel(nextStep)}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin/roles")}
                className="w-full mt-3 px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold"
              >
                Hủy thao tác
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RoleCreatePage;
