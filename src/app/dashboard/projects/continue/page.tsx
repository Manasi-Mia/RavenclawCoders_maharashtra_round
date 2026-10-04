"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ContinueProjectPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Adding your project to Projects...");

  useEffect(() => {
    let active = true;

    async function createProject() {
      try {
        const raw = sessionStorage.getItem("creatorai_pending_project");
        if (!raw) {
          router.replace("/dashboard/projects");
          return;
        }

        const pending = JSON.parse(raw) as {
          title?: string;
          description?: string;
          targetAudience?: string;
        };

        if (!pending.title?.trim()) {
          sessionStorage.removeItem("creatorai_pending_project");
          router.replace("/dashboard/projects");
          return;
        }

        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: pending.title.trim(),
            description: pending.description || "",
            targetAudience: pending.targetAudience || "",
            platform: "YouTube",
            status: "IDEA",
            progress: 10,
          }),
        });

        if (!res.ok) {
          if (active) setMessage("We could not create the project. Please try again.");
          return;
        }

        sessionStorage.removeItem("creatorai_pending_project");
        router.replace("/dashboard/projects");
      } catch {
        if (active) setMessage("We could not create the project. Please try again.");
      }
    }

    createProject();
    return () => { active = false; };
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="rounded-3xl border border-black/10 bg-white/70 px-8 py-7 text-center shadow-sm">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#111214]" />
        <p className="mt-4 text-sm font-semibold text-[#111214]">{message}</p>
      </div>
    </div>
  );
}
