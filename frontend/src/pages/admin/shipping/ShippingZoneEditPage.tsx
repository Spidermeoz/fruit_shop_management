import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

interface ShippingZoneFormData {
  id?: number;
  code: string;
  name: string;
  province: string;
  district: string;
  ward: string;
  baseFee: string;
  freeShipThreshold: string;
  priority: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

type ApiDetail<T> = { success: true; data: T; meta?: any };

interface LocationItem {
  name: string;
  code: number;
}

const toFormData = (data: any): ShippingZoneFormData => ({
  id: data.id,
  code: data.code ?? "",
  name: data.name ?? "",
  province: data.province ?? "",
  district: data.district ?? "",
  ward: data.ward ?? "",
  baseFee:
    data.baseFee !== null && data.baseFee !== undefined
      ? String(data.baseFee)
      : "0",
  freeShipThreshold:
    data.freeShipThreshold !== null && data.freeShipThreshold !== undefined
      ? String(data.freeShipThreshold)
      : "",
  priority:
    data.priority !== null && data.priority !== undefined
      ? String(data.priority)
      : "0",
  status: data.status ?? "active",
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

const ShippingZoneEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] = useState<ShippingZoneFormData | null>(null);
  const [initialData, setInitialData] = useState<ShippingZoneFormData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fieldRefs = useRef<
    Record<string, HTMLInputElement | HTMLSelectElement | null>
  >({});

  const [cities, setCities] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);
  const [cityLoaded, setCityLoaded] = useState(false);

  const previewArea = useMemo(() => {
    if (!formData) return "";
    return [formData.ward, formData.district, formData.province]
      .filter(Boolean)
      .join(", ");
  }, [formData]);

  const isDirty = useMemo(() => {
    if (!formData || !initialData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  const setFieldRef =
    (name: string) => (el: HTMLInputElement | HTMLSelectElement | null) => {
      fieldRefs.current[name] = el;
    };

  const scrollToFirstError = (nextErrors: Record<string, string>) => {
    const firstKey = Object.keys(nextErrors)[0];
    if (!firstKey) return;
    fieldRefs.current[firstKey]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    fieldRefs.current[firstKey]?.focus?.();
  };

  const loadCities = async () => {
    if (cityLoaded) return cities;

    const res = await fetch("https://provinces.open-api.vn/api/p/");
    const data = await res.json();
    setCities(data);
    setCityLoaded(true);
    return data;
  };

  const loadDistricts = async (cityCode: number) => {
    const res = await fetch(
      `https://provinces.open-api.vn/api/p/${cityCode}?depth=2`,
    );
    const data = await res.json();
    const nextDistricts = data.districts || [];
    setDistricts(nextDistricts);
    return nextDistricts;
  };

  const loadWards = async (districtCode: number) => {
    const res = await fetch(
      `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`,
    );
    const data = await res.json();
    const nextWards = data.wards || [];
    setWards(nextWards);
    return nextWards;
  };

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await http<ApiDetail<any>>(
        "GET",
        `/api/v1/admin/shipping-zones/edit/${id}`,
      );

      if (res?.success && res.data) {
        const mapped = toFormData(res.data);
        setFormData(mapped);
        setInitialData(mapped);
      } else {
        showErrorToast("Không thể tải dữ liệu vùng giao hàng.");
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Lỗi tải dữ liệu vùng giao hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  useEffect(() => {
    const syncAddressOptions = async () => {
      if (!formData) return;

      const cityList = await loadCities();
      const city = cityList.find(
        (c: LocationItem) => c.name === formData.province,
      );

      if (!city) {
        setDistricts([]);
        setWards([]);
        return;
      }

      const districtList = await loadDistricts(city.code);
      const district = districtList.find(
        (d: LocationItem) => d.name === formData.district,
      );

      if (!district) {
        setWards([]);
        return;
      }

      await loadWards(district.code);
    };

    void syncAddressOptions();
  }, [formData?.province, formData?.district]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!formData) return;

    const { name, value } = e.target;
    const nextValue = name === "code" ? value.toUpperCase() : value;

    setFormData((prev) => (prev ? { ...prev, [name]: nextValue } : prev));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    if (!formData) return false;

    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Vui lòng nhập tên vùng giao hàng.";
    }

    if (!formData.code.trim()) {
      nextErrors.code = "Vui lòng nhập mã vùng giao hàng.";
    }

    if (formData.ward.trim() && !formData.district.trim()) {
      nextErrors.district = "Nếu có phường/xã thì phải nhập quận/huyện.";
    }

    if (
      (formData.district.trim() || formData.ward.trim()) &&
      !formData.province.trim()
    ) {
      nextErrors.province =
        "Nếu có quận/huyện hoặc phường/xã thì phải nhập tỉnh/thành phố.";
    }

    if (formData.baseFee.trim() === "") {
      nextErrors.baseFee = "Vui lòng nhập phí giao hàng cơ bản.";
    } else {
      const baseFee = Number(formData.baseFee);
      if (!Number.isFinite(baseFee) || baseFee < 0) {
        nextErrors.baseFee = "Phí giao hàng cơ bản phải là số >= 0.";
      }
    }

    if (formData.freeShipThreshold.trim() !== "") {
      const threshold = Number(formData.freeShipThreshold);
      if (!Number.isFinite(threshold) || threshold < 0) {
        nextErrors.freeShipThreshold = "Ngưỡng freeship phải là số >= 0.";
      }
    }

    if (formData.priority.trim() === "") {
      nextErrors.priority = "Vui lòng nhập độ ưu tiên.";
    } else {
      const priority = Number(formData.priority);
      if (!Number.isInteger(priority) || priority < 0) {
        nextErrors.priority = "Độ ưu tiên phải là số nguyên >= 0.";
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstError(nextErrors);
      return false;
    }

    return true;
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        province: formData.province.trim() || null,
        district: formData.district.trim() || null,
        ward: formData.ward.trim() || null,
        baseFee: Number(formData.baseFee),
        freeShipThreshold:
          formData.freeShipThreshold.trim() === ""
            ? null
            : Number(formData.freeShipThreshold),
        priority: Number(formData.priority),
        status: formData.status,
      };

      const res = await http<any>(
        "PATCH",
        `/api/v1/admin/shipping-zones/edit/${formData.id}`,
        payload,
      );

      if (res?.success) {
        showSuccessToast({ message: "Cập nhật vùng giao hàng thành công!" });
        navigate("/admin/shipping/zones");
      } else {
        showErrorToast(res?.message || "Cập nhật vùng giao hàng thất bại.");
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Lỗi kết nối server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải dữ liệu...
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chỉnh sửa vùng giao hàng
        </h1>
        <button
          onClick={() => navigate("/admin/shipping/zones")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <Card>
        <form onSubmit={handleSave} className="space-y-6 p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tên vùng <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("name")}
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.name
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.name && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mã vùng <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("code")}
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.code
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.code && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.code}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tỉnh / Thành phố
              </label>
              <select
                ref={setFieldRef("province")}
                name="province"
                value={formData.province}
                onFocus={() => {
                  void loadCities();
                }}
                onChange={async (e) => {
                  const provinceName = e.target.value;
                  const city = cities.find((c) => c.name === provinceName);

                  setFormData((prev) =>
                    prev
                      ? {
                          ...prev,
                          province: provinceName,
                          district: "",
                          ward: "",
                        }
                      : prev,
                  );

                  setDistricts([]);
                  setWards([]);

                  if (errors.province || errors.district || errors.ward) {
                    setErrors((prev) => ({
                      ...prev,
                      province: "",
                      district: "",
                      ward: "",
                    }));
                  }

                  if (city) {
                    await loadDistricts(city.code);
                  }
                }}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.province
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                <option value="">Chọn tỉnh / thành phố</option>
                {cities.map((city) => (
                  <option key={city.code} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
              {errors.province && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.province}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quận / Huyện
              </label>
              <select
                ref={setFieldRef("district")}
                name="district"
                value={formData.district}
                onChange={async (e) => {
                  const districtName = e.target.value;
                  const district = districts.find(
                    (d) => d.name === districtName,
                  );

                  setFormData((prev) =>
                    prev
                      ? {
                          ...prev,
                          district: districtName,
                          ward: "",
                        }
                      : prev,
                  );

                  setWards([]);

                  if (errors.district || errors.ward) {
                    setErrors((prev) => ({
                      ...prev,
                      district: "",
                      ward: "",
                    }));
                  }

                  if (district) {
                    await loadWards(district.code);
                  }
                }}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.district
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                <option value="">Chọn quận / huyện</option>
                {districts.map((district) => (
                  <option key={district.code} value={district.name}>
                    {district.name}
                  </option>
                ))}
              </select>
              {errors.district && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.district}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phường / Xã
              </label>
              <select
                ref={setFieldRef("ward")}
                name="ward"
                value={formData.ward}
                onChange={(e) => {
                  setFormData((prev) =>
                    prev ? { ...prev, ward: e.target.value } : prev,
                  );

                  if (errors.ward) {
                    setErrors((prev) => ({ ...prev, ward: "" }));
                  }
                }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Chọn phường / xã</option>
                {wards.map((ward) => (
                  <option key={ward.code} value={ward.name}>
                    {ward.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-800/40">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Xem trước khu vực áp dụng:
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {previewArea || "Vùng mặc định / toàn khu vực theo rule"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phí giao hàng cơ bản <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("baseFee")}
                type="number"
                min="0"
                step="1000"
                name="baseFee"
                value={formData.baseFee}
                onChange={handleChange}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.baseFee
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.baseFee && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.baseFee}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ngưỡng freeship
              </label>
              <input
                ref={setFieldRef("freeShipThreshold")}
                type="number"
                min="0"
                step="1000"
                name="freeShipThreshold"
                value={formData.freeShipThreshold}
                onChange={handleChange}
                placeholder="Để trống nếu không có"
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.freeShipThreshold
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.freeShipThreshold && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.freeShipThreshold}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Độ ưu tiên <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("priority")}
                type="number"
                step="1"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.priority
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.priority && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.priority}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trạng thái
              </label>
              <select
                ref={setFieldRef("status")}
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm dừng</option>
              </select>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-700 dark:text-blue-300">
            Số ưu tiên càng nhỏ thì càng được match trước khi tính phí ship.
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formData.updatedAt && (
                <span>
                  Cập nhật gần nhất:{" "}
                  {new Date(formData.updatedAt).toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/admin/shipping/zones")}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white transition-colors"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={saving || !isDirty}
                className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ShippingZoneEditPage;
