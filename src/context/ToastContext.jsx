import React, { createContext, useContext, useCallback, useState } from "react";

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, type = "info", opts = {}) => {
    const id = crypto?.randomUUID?.() ?? String(Date.now() + Math.random());
    const duration = opts.duration ?? 3000;

    const toast = { id, message, type };
    setToasts((prev) => [...prev, toast]);

    window.setTimeout(() => removeToast(id), duration);
    return id;
  }, [removeToast]);

  const api = {
    show,
    success: (msg, opts) => show(msg, "success", opts),
    error: (msg, opts) => show(msg, "error", opts),
    info: (msg, opts) => show(msg, "info", opts),
  };

  const styleByType = (type) => {
    if (type === "success") return "bg-green-600";
    if (type === "error") return "bg-red-600";
    return "bg-gray-900";
  };

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div className="fixed top-20 right-4 z-[9999] space-y-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styleByType(t.type)} text-white px-4 py-3 rounded-xl shadow-lg flex items-start gap-3 min-w-[260px] max-w-[360px]`}
          >
            <div className="text-sm leading-snug flex-1">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-white/90 hover:text-white font-bold"
              aria-label="Close"
              type="button"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
