"use client";

import React, { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp, RotateCw } from "lucide-react";

export interface AIErrorAlertProps {
  title?: string;
  message?: string;
  rawError?: string | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export function AIErrorAlert({
  title = "AI Service Notice",
  message = "The AI model is unavailable right now, please try again",
  rawError,
  onDismiss,
  onRetry,
  action,
  className = "",
}: AIErrorAlertProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className={`rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-900 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-rose-950">{title}</h4>
          <p className="mt-0.5 text-xs text-rose-900 font-medium leading-relaxed">
            {message}
          </p>

          {(onRetry || action) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
                >
                  <RotateCw className="h-3 w-3" />
                  <span>Try again</span>
                </button>
              )}
              {action}
            </div>
          )}

          {rawError && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 hover:text-rose-950 underline cursor-pointer"
              >
                <span>{showDetails ? "Hide details" : "Show details"}</span>
                {showDetails ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
              {showDetails && (
                <pre className="mt-2 p-3 rounded-xl bg-black/5 text-[10px] font-mono text-rose-950 whitespace-pre-wrap break-all overflow-x-auto max-h-40 border border-rose-500/10 leading-normal">
                  {rawError}
                </pre>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-rose-500 hover:text-rose-800 text-xs font-bold px-1.5 py-0.5 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
