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
    throw new Error("useAdminToast must be used within a AdminToastProvider");
  }
  return context;
};

// ==========================
// ICONS
// ==========================
const SuccessIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className="h-7 w-7"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.3 2.3 4.7-5.3" />
  </svg>
);

const ErrorIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className="h-7 w-7"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5" />
    <path d="M12 16h.01" />
  </svg>
);

// ==========================
// PROVIDER COMPONENT
// ==========================
export const AdminToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState<ToastType>(null);
  const [toastContent, setToastContent] = useState<ToastOptions>({
    message: "",
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToast = (newType: ToastType, options: ToastOptions) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setType(newType);
    setToastContent({
      title:
        options.title ||
        (newType === "success" ? "Thao tác thành công" : "Có lỗi xảy ra"),
      message: options.message,
    });

    setShow(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setVisible(true);
      });
    });

    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setShow(false), 280);
    }, 2000);
  };

  const showSuccessToast = (options: ToastOptions) =>
    triggerToast("success", options);

  const showErrorToast = (message: string, title?: string) =>
    triggerToast("error", { message, title });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showSuccessToast, showErrorToast }}>
      {children}

      {show && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center px-4 backdrop-blur-[4px] ${
            type === "success" ? "bg-slate-950/20" : "bg-slate-950/25"
          }`}
        >
          <div
            className="relative w-full max-w-[440px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible
                ? "translateY(0) scale(1)"
                : "translateY(14px) scale(0.96)",
              transition:
                "opacity 0.28s ease, transform 0.28s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            {/* Accent top bar */}
            <div
              className={`h-1.5 w-full ${
                type === "success"
                  ? "bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"
                  : "bg-gradient-to-r from-rose-500 via-red-500 to-orange-500"
              }`}
            />

            {/* Background glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div
                className={`absolute -top-16 right-[-20px] h-36 w-36 rounded-full blur-3xl ${
                  type === "success" ? "bg-emerald-100" : "bg-rose-100"
                } opacity-70`}
              />
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-50 to-transparent" />
            </div>

            <div className="relative z-10 p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${
                    type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                      : "border-rose-200 bg-rose-50 text-rose-600"
                  }`}
                >
                  {type === "success" ? <SuccessIcon /> : <ErrorIcon />}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                    {toastContent.title}
                  </h3>

                  <div className="mt-2 text-sm sm:text-[15px] leading-6 text-slate-600">
                    {toastContent.message}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        type === "success"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                      }`}
                    >
                      {type === "success" ? "Success" : "Error"}
                    </span>

                    <span className="text-xs text-slate-400">
                      Hệ thống quản trị
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom subtle line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
