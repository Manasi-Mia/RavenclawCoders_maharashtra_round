"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X, ChevronDown, ChevronUp } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  details?: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, details?: string) => void;
  success: (message: string) => void;
  error: (message: string, details?: string) => void;
  info: (message: string, details?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    setExpandedIds((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "info", details?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type, details }]);

    const duration = details ? 9000 : 4500;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const value = {
    toast: addToast,
    success: (msg: string) => addToast(msg, "success"),
    error: (msg: string, details?: string) => addToast(msg, "error", details),
    info: (msg: string, details?: string) => addToast(msg, "info", details),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const isExpanded = Boolean(expandedIds[t.id]);
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex flex-col rounded-2xl border p-3.5 shadow-xl backdrop-blur-xl transition-all ${
                t.type === "success"
                  ? "border-emerald-500/20 bg-[#f5f4f0]/95 text-emerald-950"
                  : t.type === "error"
                  ? "border-rose-500/20 bg-[#f5f4f0]/95 text-rose-950"
                  : "border-black/10 bg-[#f5f4f0]/95 text-[#111214]"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="shrink-0 mt-0.5">
                  {t.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                  {t.type === "error" && <AlertCircle className="h-4 w-4 text-rose-600" />}
                  {t.type === "info" && <Info className="h-4 w-4 text-indigo-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-relaxed">{t.message}</p>
                  {t.details && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedIds((prev) => ({ ...prev, [t.id]: !prev[t.id] }))
                      }
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                    >
                      <span>{isExpanded ? "Hide details" : "Show details"}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="shrink-0 rounded-lg p-1 text-[#77797c] hover:bg-black/5 hover:text-[#111214] transition"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {t.details && isExpanded && (
                <pre className="mt-2 p-2 rounded-xl bg-black/5 text-[10px] font-mono text-rose-900 whitespace-pre-wrap break-all max-h-32 overflow-y-auto border border-rose-500/10">
                  {t.details}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: (msg: string) => console.log(msg),
      success: (msg: string) => console.log(msg),
      error: (msg: string, details?: string) => console.error(msg, details),
      info: (msg: string) => console.log(msg),
    };
  }
  return ctx;
}
