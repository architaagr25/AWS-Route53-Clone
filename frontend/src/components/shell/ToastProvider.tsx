"use client";

/**
 * Toast notification system (AWS "flash message" style).
 *
 * Wrap the app in <ToastProvider> once, then call `useToast().showToast(msg, type)`
 * from anywhere to pop a dismissible notification in the top-right. Toasts
 * auto-dismiss after a few seconds and can be closed manually.
 */
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

const STYLES: Record<ToastType, { bar: string; icon: string }> = {
  success: { bar: "border-aws-success", icon: "✓" },
  error: { bar: "border-aws-error", icon: "✕" },
  info: { bar: "border-aws-link", icon: "i" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  // Add a toast and auto-dismiss it after 5s (it can also be closed manually).
  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = Date.now() + Math.random();
      setToasts((list) => [...list, { id, type, message }]);
      setTimeout(() => remove(id), 5000);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed right-4 top-14 z-50 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2 rounded border-l-4 bg-aws-surface px-3 py-2 shadow-md ${STYLES[t.type].bar}`}
          >
            <span className="mt-0.5 font-bold text-aws-text-secondary">
              {STYLES[t.type].icon}
            </span>
            <p className="flex-1 text-sm text-aws-text">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="text-aws-text-secondary hover:text-aws-text"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
