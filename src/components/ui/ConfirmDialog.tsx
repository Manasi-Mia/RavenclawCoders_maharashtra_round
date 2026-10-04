"use client";

import React, { useEffect } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onCancel();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const confirmBtnStyles =
    variant === "danger"
      ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/20"
      : variant === "warning"
      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/20"
      : "bg-[#111214] hover:bg-[#23252a] text-white shadow-black/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!isLoading) onCancel();
        }}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-3xl border border-black/10 bg-[#f5f4f0]/95 p-6 shadow-2xl backdrop-blur-2xl text-[#111214]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {variant === "danger" && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            )}
            {variant === "warning" && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            )}
            <h3 className="text-base font-bold tracking-tight text-[#111214]">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl p-1.5 text-[#66686c] hover:bg-black/5 hover:text-[#111214] transition disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 text-xs leading-relaxed text-[#44464a]">{message}</div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-2xl border border-black/10 bg-white/80 px-4 py-2 text-xs font-semibold text-[#111214] shadow-xs hover:bg-white transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold shadow-md transition disabled:opacity-50 ${confirmBtnStyles}`}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
