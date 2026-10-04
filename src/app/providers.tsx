"use client";

import { useEffect } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleCreateProject = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button") as HTMLButtonElement | null;
      if (!button || button.textContent?.trim() !== "Create project") return;

      const panel = button.parentElement;
      const inputs = panel ? Array.from(panel.querySelectorAll("input")) : [];
      const pending = {
        title: inputs[0]?.value?.trim() || "",
        description: inputs[1]?.value?.trim() || "",
        targetAudience: inputs[2]?.value?.trim() || "",
      };

      if (!pending.title) {
        inputs[0]?.focus();
        return;
      }

      event.preventDefault();
      sessionStorage.setItem("creatorai_pending_project", JSON.stringify(pending));
      window.location.href = "/login?redirect=/dashboard/projects/continue";
    };

    document.addEventListener("click", handleCreateProject);
    return () => document.removeEventListener("click", handleCreateProject);
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
