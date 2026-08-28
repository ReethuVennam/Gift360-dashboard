import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastKind = "ok" | "err";
interface ToastItem {
  id: number;
  msg: string;
  kind: ToastKind;
  leaving: boolean;
}

interface ToastContextValue {
  toast: (msg: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((msg: string, kind: ToastKind = "ok") => {
    const id = ++idRef.current;
    setItems((prev) => [...prev, { id, msg, kind, leaving: false }]);
    setTimeout(() => {
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 200);
    }, 3400);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-stack">
        {items.map((t) => (
          <div
            key={t.id}
            className={"toast" + (t.kind === "err" ? " err" : "")}
            style={t.leaving ? { opacity: 0, transform: "translateY(6px)", transition: "all .18s ease" } : undefined}
          >
            {t.kind === "err" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5M12 16h.01" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue["toast"] {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx.toast;
}
