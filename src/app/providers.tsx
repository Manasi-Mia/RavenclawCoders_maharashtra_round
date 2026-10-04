"use client";

import { useEffect } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";

const workflowRoutes: Record<string, string> = {
  IDEA: "/dashboard/ideas",
  SCRIPT: "/dashboard/scripts",
  ASSETS: "/dashboard/assets",
  FOOTAGE: "/dashboard/video-intelligence",
  CLIPS: "/dashboard/video-intelligence",
  EDIT: "/dashboard/studio",
  REPURPOSE: "/dashboard/repurpose",
  PUBLISH: "/dashboard/calendar",
  ANALYTICS: "/dashboard/analytics",
};

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleWorkflowClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("#workflow button") as HTMLButtonElement | null;
      if (!button) return;

      const stage = button.textContent?.trim().toUpperCase();
      const route = stage ? workflowRoutes[stage] : undefined;
      if (!route) return;

      event.preventDefault();
      window.location.href = route;
    };

    document.addEventListener("click", handleWorkflowClick);
    return () => document.removeEventListener("click", handleWorkflowClick);
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
