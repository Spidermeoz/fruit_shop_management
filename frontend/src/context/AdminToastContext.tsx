import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from "react";

// ==========================
// TYPES
// ==========================
type ToastType = "success" | "error" | null;

interface ToastOptions {
  title?: string;
  message: ReactNode;
}

interface ToastContextType {
  showSuccessToast: (options: ToastOptions) => void;
  showErrorToast: (message: string, title?: string) => void;
}

// ==========================
// CONTEXT SETUP
// ==========================
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useAdminToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useAdminToast must be used within an AdminToastProvider");
  }
  return context;
};

// ==========================
// ICONS (Gọn gàng, tối giản hơn)
// ==========================
const SuccessIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className="h-5 w-5"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ErrorIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className="h-5 w-5"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className="h-4 w-4"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ==========================
// PROVIDER COMPONENT
// ==========================
export const AdminToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [show, setShow] = useState(false); // Quản lý việc render component vào DOM
  const [visible, setVisible] = useState(false); // Quản lý hiệu ứng animation CSS
  const [type, setType] = useState<ToastType>(null);
  const [toastContent, setToastContent] = useState<ToastOptions>({
    message: "",
  });

  // Dùng để reset animation của progress bar khi bị "spam click"
  const [toastKey, setToastKey] = useState(0);

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const TOAST_DURATION = 3000; // Thời gian hiển thị (2 giây)
  const ANIM_DURATION = 300; // Khớp với duration-300 của Tailwind

  const triggerToast = (newType: ToastType, options: ToastOptions) => {
    // 1. Dọn dẹp các timer cũ nếu đang có toast hiển thị (xử lý spam click)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (removeTimerRef.current) clearTimeout(removeTimerRef.current);

    // 2. Cập nhật nội dung và loại toast
    setType(newType);
    setToastContent({
      title:
        options.title ||
        (newType === "success" ? "Thành công" : "Có lỗi xảy ra"),
      message: options.message,
    });

    // Tăng key để ép React render lại Progress Bar từ đầu
    setToastKey((prev) => prev + 1);

    // 3. Mount component (nếu chưa)
    setShow(true);

    // 4. Kích hoạt animation trượt vào
    // Dùng setTimeout nhỏ để đảm bảo DOM đã render xong state `show` trước khi thêm class `visible`
    setTimeout(() => setVisible(true), 10);

    // 5. Cài đặt hẹn giờ tự động ẩn
    hideTimerRef.current = setTimeout(() => {
      setVisible(false); // Kích hoạt animation trượt ra

      // Chờ animation hoàn tất rồi mới unmount khỏi DOM
      removeTimerRef.current = setTimeout(() => {
        setShow(false);
      }, ANIM_DURATION);
    }, TOAST_DURATION);
  };

  const showSuccessToast = (options: ToastOptions) =>
    triggerToast("success", options);

  const showErrorToast = (message: string, title?: string) =>
    triggerToast("error", { message, title });

  // Đóng toast thủ công bằng nút X
  const handleClose = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (removeTimerRef.current) clearTimeout(removeTimerRef.current);

    setVisible(false);
    removeTimerRef.current = setTimeout(() => {
      setShow(false);
    }, ANIM_DURATION);
  };

  // Cleanup cẩn thận khi unmount Provider để tránh memory leak
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (removeTimerRef.current) clearTimeout(removeTimerRef.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showSuccessToast, showErrorToast }}>
      {children}

      {/* Inline style cho thanh tiến trình (để không phải cấu hình tailwind.config) */}
      <style>{`
        @keyframes shrink-progress {
          0% { transform: scaleX(1); }
          100% { transform: scaleX(0); }
        }
      `}</style>

      {show && (
        <div
          // Lớp vỏ chứa cố định ở góc trên bên phải
          className="fixed top-6 right-6 z-[9999] flex flex-col items-end pointer-events-none"
        >
          <div
            // Animation trượt ngang & mờ
            className={`pointer-events-auto relative flex w-80 sm:w-96 flex-col overflow-hidden rounded-lg border bg-white shadow-xl transition-all duration-300 ease-in-out ${
              visible
                ? "translate-x-0 opacity-100"
                : "translate-x-[120%] opacity-0"
            } ${
              type === "success"
                ? "border-emerald-100/80"
                : "border-rose-100/80"
            }`}
          >
            {/* Thanh accent mảnh bên trái */}
            <div
              className={`absolute bottom-0 left-0 top-0 w-1 ${
                type === "success" ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />

            {/* Nội dung Toast */}
            <div className="flex items-start gap-3 p-4 pl-5">
              {/* Icon */}
              <div
                className={`mt-0.5 shrink-0 ${
                  type === "success" ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {type === "success" ? <SuccessIcon /> : <ErrorIcon />}
              </div>

              {/* Text: Title & Message */}
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-800">
                  {toastContent.title}
                </h4>
                <div className="mt-1 text-sm text-slate-500 leading-snug break-words">
                  {toastContent.message}
                </div>
              </div>

              {/* Nút đóng */}
              <button
                onClick={handleClose}
                className="inline-flex shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Thanh Progress bar chạy lùi tự động ẩn */}
            <div className="h-[3px] w-full bg-slate-100">
              <div
                key={toastKey} // Đổi key ép React reset lại div & keyframes khi spam click
                className={`h-full w-full origin-left ${
                  type === "success" ? "bg-emerald-500" : "bg-rose-500"
                }`}
                style={{
                  animation: `shrink-progress ${TOAST_DURATION}ms linear forwards`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
