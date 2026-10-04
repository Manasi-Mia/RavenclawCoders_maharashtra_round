"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const value = {
    toast: addToast,
    success: (msg: string) => addToast(msg, "success"),
    error: (msg: string) => addToast(msg, "error"),
    info: (msg: string) => addToast(msg, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2.5 rounded-2xl border p-3.5 shadow-xl backdrop-blur-xl transition-all ${
              t.type === "success"
                ? "border-emerald-500/20 bg-[#f5f4f0]/95 text-emerald-950"
                : t.type === "error"
                ? "border-rose-500/20 bg-[#f5f4f0]/95 text-rose-950"
                : "border-black/10 bg-[#f5f4f0]/95 text-[#111214]"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              {t.type === "error" && <AlertCircle className="h-4 w-4 text-rose-600" />}
              {t.type === "info" && <Info className="h-4 w-4 text-indigo-600" />}
            </div>
            <p className="flex-1 text-xs font-medium leading-relaxed">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 rounded-lg p-1 text-[#77797c] hover:bg-black/5 hover:text-[#111214] transition"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback if rendered outside provider: logs or safe no-op
    return {
      toast: (msg: string) => console.log(msg),
      success: (msg: string) => console.log(msg),
      error: (msg: string) => console.error(msg),
      info: (msg: string) => console.log(msg),
    };
  }
  return ctx;
}
