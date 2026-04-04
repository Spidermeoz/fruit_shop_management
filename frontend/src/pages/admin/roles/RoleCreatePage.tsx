import React, {
  useState,
  useEffect,
  useMemo,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  FilePlus,
  Copy,
  LayoutTemplate,
  CheckCircle2,
  Settings2,
  ShieldCheck,
  AlertCircle,
  Lightbulb,
  Info,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import RichTextEditor from "../../../components/admin/common/RichTextEditor";
import { http } from "../../../services/http";
import { uploadImagesInContent } from "../../../utils/uploadImagesInContent";
import { useAdminToast } from "../../../context/AdminToastContext";

// ==========================================
// TYPES & CONSTANTS
// ==========================================
interface RoleFormData {
  title: string;
  description: string;
}

interface ExistingRole {
  id: number;
  title: string;
  description?: string;
  is_system?: boolean;
}

type SetupMode = "blank" | "copy" | "starter";
type NextStep = "workspace" | "matrix" | "board";

type ApiOk<T> = { success: true; data: T; meta?: any; message?: string };
type ApiErr = { success: false; message?: string; errors?: any };
type ApiList<T> = { success: true; data: T[]; meta?: any };

const STARTER_PRESETS = [
  {
    id: "ops",
    title: "Vận hành cơ bản",
    desc: "Xử lý đơn hàng, kho bãi cơ bản. Không có quyền xóa.",
  },
  {
    id: "admin_branch",
    title: "Quản lý chi nhánh",
    desc: "Toàn quyền tại một chi nhánh cụ thể.",
  },
  {
    id: "cskh",
    title: "Chăm sóc khách hàng",
    desc: "Xem thông tin khách hàng, khiếu nại, lịch sử đơn.",
  },
  {
    id: "inventory",
    title: "Quản lý kho",
    desc: "Nhập xuất tồn, kiểm kho, điều chuyển nội bộ.",
  },
];

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
  const location = useLocation();
  const { showSuccessToast } = useAdminToast();

  // --- States: Form & UI ---
  const [formData, setFormData] = useState<RoleFormData>({
    title: "",
    description: "",
  });
  const [setupMode, setSetupMode] = useState<SetupMode>("blank");
  const [copyFromRoleId, setCopyFromRoleId] = useState<number | null>(null);
  const [starterPreset, setStarterPreset] = useState<string | null>(null);
  const [nextStep, setNextStep] = useState<NextStep>("workspace");

  // --- States: API & Validation ---
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof RoleFormData | "general", string>>
  >({});

  // --- States: Existing Roles (For Copy Mode) ---
  const [existingRoles, setExistingRoles] = useState<ExistingRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // --- Initialization ---
  useEffect(() => {
    // Lấy danh sách role hiện có để phục vụ tính năng "Sao chép"
    const fetchRoles = async () => {
      setRolesLoading(true);
      try {
        const res = await http<ApiList<ExistingRole>>(
          "GET",
          "/api/v1/admin/roles",
        );
        if (res.success && Array.isArray(res.data)) {
          setExistingRoles(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch existing roles for copy mode", error);
      } finally {
        setRolesLoading(false);
      }
    };

    fetchRoles();

    // Parse query param nếu navigate từ action "Nhân bản"
    const searchParams = new URLSearchParams(location.search);
    const copyFromParam = searchParams.get("copyFrom");
    if (copyFromParam && !isNaN(Number(copyFromParam))) {
      setSetupMode("copy");
      setCopyFromRoleId(Number(copyFromParam));
    }
  }, [location.search]);

  // --- Derived Data (useMemo) ---
  const selectedSourceRole = useMemo(() => {
    return existingRoles.find((r) => r.id === copyFromRoleId);
  }, [existingRoles, copyFromRoleId]);

  const selectedPreset = useMemo(() => {
    return STARTER_PRESETS.find((p) => p.id === starterPreset);
  }, [starterPreset]);

  // --- Handlers ---
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDescriptionChange = (content: string) => {
    setFormData((prev) => ({ ...prev, description: content }));
    if (errors.description) {
      setErrors((prev) => ({ ...prev, description: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof RoleFormData | "general", string>> = {};
    if (!formData.title.trim()) {
      newErrors.title = "Vui lòng nhập tên vai trò.";
    }
    if (setupMode === "copy" && !copyFromRoleId) {
      newErrors.general = "Vui lòng chọn một role để sao chép.";
    }
    if (setupMode === "starter" && !starterPreset) {
      newErrors.general = "Vui lòng chọn một mẫu gợi ý.";
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

      const processedDescription = await uploadImagesInContent(
        formData.description,
      );

      // Payload base
      const payload: any = {
        title: formData.title,
        description: processedDescription,
      };

      // TODO: Tích hợp logic copy hoặc template khi Backend hỗ trợ các field này.
      // Hiện tại chỉ đính kèm dưới dạng tham số mềm (nếu API chấp nhận payload linh hoạt)
      // hoặc frontend sẽ phải tự gọi thêm API patch permissions sau khi create.
      if (setupMode === "copy" && copyFromRoleId) {
        payload.copy_from_id = copyFromRoleId; // Chờ API support
      } else if (setupMode === "starter" && starterPreset) {
        payload.template_id = starterPreset; // Chờ API support
      }

      const res = await http<ApiOk<any> | ApiErr>(
        "POST",
        "/api/v1/admin/roles/create",
        payload,
      );

      if (res.success) {
        showSuccessToast({ message: "Khởi tạo vai trò thành công!" });

        // Điều hướng theo định hướng Next Step
        // Cố gắng lấy ID role mới từ response (res.data.id hoặc res.data.role.id)
        const newRoleId =
          (res as ApiOk<any>).data?.id || (res as ApiOk<any>).data?.role?.id;

        if (nextStep === "workspace") {
          if (newRoleId) navigate(`/admin/roles/edit/${newRoleId}`);
          else navigate("/admin/roles"); // Fallback an toàn
        } else if (nextStep === "matrix") {
          // Có thể truyền thêm query ?roleId=newRoleId nếu ma trận hỗ trợ focus
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
            Thiết lập một access profile mới, chọn chiến lược khởi tạo và cấu
            hình bước tiếp theo.
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="p-2 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg shrink-0">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">
              2. Chiến lược
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Tạo mới hoàn toàn hoặc kế thừa từ một cấu hình có sẵn.
            </p>
          </div>
        </Card>
        <Card className="p-4 border-gray-200 dark:border-gray-700 flex items-start gap-3 bg-gray-50/50 dark:bg-gray-800/30">
          <div className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">
              3. Tiếp nối
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
            {/* Section 1: Chiến lược khởi tạo */}
            <Card className="!p-0 overflow-hidden border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Chiến lược khởi tạo
                </h2>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Mode: Blank */}
                  <div
                    onClick={() => setSetupMode("blank")}
                    className={`cursor-pointer border rounded-xl p-4 transition-all ${setupMode === "blank" ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-500" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`p-2 rounded-lg ${setupMode === "blank" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}
                      >
                        <FilePlus className="w-4 h-4" />
                      </div>
                      <h3
                        className={`font-bold text-sm ${setupMode === "blank" ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        Tạo role trống
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      Bắt đầu từ đầu, tự gán từng quyền hạn sau khi tạo.
                    </p>
                  </div>

                  {/* Mode: Copy */}
                  <div
                    onClick={() => setSetupMode("copy")}
                    className={`cursor-pointer border rounded-xl p-4 transition-all ${setupMode === "copy" ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-500" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`p-2 rounded-lg ${setupMode === "copy" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}
                      >
                        <Copy className="w-4 h-4" />
                      </div>
                      <h3
                        className={`font-bold text-sm ${setupMode === "copy" ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        Sao chép từ role hiện có
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      Dùng một role làm điểm khởi đầu rồi tinh chỉnh tiếp.
                    </p>
                  </div>

                  {/* Mode: Starter */}
                  <div
                    onClick={() => setSetupMode("starter")}
                    className={`cursor-pointer border rounded-xl p-4 transition-all ${setupMode === "starter" ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-500" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`p-2 rounded-lg ${setupMode === "starter" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}
                      >
                        <LayoutTemplate className="w-4 h-4" />
                      </div>
                      <h3
                        className={`font-bold text-sm ${setupMode === "starter" ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        Theo mẫu gợi ý
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      Áp dụng nhanh các khuôn mẫu phân quyền phổ biến.
                    </p>
                  </div>
                </div>

                {/* Conditional UI based on Setup Mode */}
                {setupMode === "copy" && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Chọn role nguồn để sao chép
                    </label>
                    {rolesLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải dữ
                        liệu roles...
                      </div>
                    ) : (
                      <select
                        value={copyFromRoleId || ""}
                        onChange={(e) =>
                          setCopyFromRoleId(Number(e.target.value))
                        }
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="" disabled>
                          -- Chọn một vai trò --
                        </option>
                        {existingRoles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title} {r.is_system ? "(Hệ thống)" : ""}
                          </option>
                        ))}
                      </select>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Lưu ý: Tính năng này sẽ sao chép toàn bộ quyền hiện tại
                      của role nguồn sang role mới.
                    </p>
                  </div>
                )}

                {setupMode === "starter" && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
                      Chọn mẫu cấu hình (Presets)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {STARTER_PRESETS.map((preset) => (
                        <div
                          key={preset.id}
                          onClick={() => setStarterPreset(preset.id)}
                          className={`cursor-pointer px-4 py-3 rounded-lg border transition-all flex flex-col gap-1 ${starterPreset === preset.id ? "border-blue-500 bg-white dark:bg-gray-800 shadow-sm ring-1 ring-blue-500" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"}`}
                        >
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                            {preset.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {preset.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Section 2: Thông tin cơ bản */}
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
                  <div
                    className={`rounded-lg border overflow-hidden ${errors.description ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                  >
                    <RichTextEditor
                      value={formData.description}
                      onChange={handleDescriptionChange}
                    />
                  </div>
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
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">
                    Chiến lược
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {setupMode === "blank" && "Tạo role trống"}
                    {setupMode === "copy" && "Sao chép"}
                    {setupMode === "starter" && "Mẫu gợi ý"}
                  </span>
                </div>

                {setupMode === "copy" && (
                  <div className="flex justify-between items-start gap-4 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                    <span className="text-gray-500 dark:text-gray-400 shrink-0">
                      Nguồn
                    </span>
                    <span className="text-gray-900 dark:text-white text-right line-clamp-2">
                      {selectedSourceRole?.title || (
                        <span className="text-red-500">Chưa chọn</span>
                      )}
                    </span>
                  </div>
                )}

                {setupMode === "starter" && (
                  <div className="flex justify-between items-start gap-4 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                    <span className="text-gray-500 dark:text-gray-400 shrink-0">
                      Mẫu (Preset)
                    </span>
                    <span className="text-gray-900 dark:text-white text-right line-clamp-2">
                      {selectedPreset?.title || (
                        <span className="text-red-500">Chưa chọn</span>
                      )}
                    </span>
                  </div>
                )}
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
                  Ưu tiên sao chép từ role gần giống thay vì tạo hoàn toàn từ
                  đầu để giảm sai sót.
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
