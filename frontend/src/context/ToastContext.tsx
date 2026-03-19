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

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// ==========================
// PROVIDER COMPONENT
// ==========================
export const ToastProvider: React.FC<{ children: ReactNode }> = ({
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
        (newType === "success" ? "Thành công!" : "Thao tác thất bại"),
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
      setTimeout(() => setShow(false), 300);
    }, 3000); // Tự động ẩn sau 3 giây
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

      {/* RENDER TOAST UI TẠI ĐÂY ĐỂ PHỦ LÊN TOÀN APP */}
      {show && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-[3px] px-4 ${
            type === "success" ? "bg-green-900/10" : "bg-red-900/10"
          }`}
        >
          <div
            className={`relative w-full max-w-md overflow-hidden rounded-[2rem] border shadow-[0_24px_70px_rgba(0,0,0,0.18)] ${
              type === "success"
                ? "border-green-200/70 bg-gradient-to-br from-white via-green-50 to-emerald-50"
                : "border-red-200/70 bg-gradient-to-br from-white via-red-50 to-rose-50"
            }`}
            style={{
              opacity: visible ? 1 : 0,
              transform: visible
                ? "scale(1) translateY(0)"
                : "scale(0.92) translateY(18px)",
              transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            }}
          >
            {/* Glow nền */}
            <div className="pointer-events-none absolute inset-0">
              <div
                className={`absolute -top-10 -left-10 h-32 w-32 rounded-full blur-3xl ${type === "success" ? "bg-green-300/20" : "bg-red-300/20"}`}
              ></div>
              <div
                className={`absolute -bottom-10 -right-10 h-36 w-36 rounded-full blur-3xl ${type === "success" ? "bg-emerald-300/20" : "bg-rose-300/20"}`}
              ></div>
            </div>

            {/* Icon mờ làm background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden text-[0.05] opacity-[0.08]">
              {type === "success" ? (
                <>
                  <div className="absolute -top-4 -left-4 text-7xl rotate-[-12deg]">
                    🍊
                  </div>
                  <div className="absolute top-3 right-5 text-6xl rotate-[8deg]">
                    🍎
                  </div>
                  <div className="absolute bottom-2 left-6 text-6xl rotate-[10deg]">
                    🍐
                  </div>
                  <div className="absolute bottom-2 right-3 text-7xl rotate-[-8deg]">
                    🥝
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute -top-4 -left-4 text-7xl rotate-[-12deg]">
                    ⚠️
                  </div>
                  <div className="absolute top-3 right-5 text-6xl rotate-[8deg]">
                    🚫
                  </div>
                  <div className="absolute bottom-2 left-6 text-6xl rotate-[10deg]">
                    ❗
                  </div>
                  <div className="absolute bottom-2 right-3 text-7xl rotate-[-8deg]">
                    ❌
                  </div>
                </>
              )}
            </div>

            {/* Nội dung chính */}
            <div className="relative z-10 px-8 py-8 text-center">
              <div
                className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl shadow-sm ring-1 ${
                  type === "success"
                    ? "bg-gradient-to-br from-green-100 to-emerald-100 shadow-green-500/15 ring-green-200/60"
                    : "bg-gradient-to-br from-red-100 to-rose-100 shadow-red-500/15 ring-red-200/60"
                }`}
              >
                {type === "success" ? "🛒" : "⚠️"}
              </div>

              <h3 className="text-2xl font-black text-slate-900 leading-tight">
                {toastContent.title}
              </h3>

              <div className="mt-3 text-sm sm:text-base font-medium text-slate-600 leading-relaxed">
                {toastContent.message}
              </div>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
