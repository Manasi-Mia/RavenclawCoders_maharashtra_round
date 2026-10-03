"use client";

import { useState } from "react";
import { Plus, Database, Sparkles, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export function Header({
  onNewContent,
}: {
  onNewContent?: () => void;
}) {
  const { user, seedDemo } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const router = useRouter();

  const handleSeed = async () => {
    setSeeding(true);
    const res = await seedDemo();
    setSeeding(false);
    if (res.success) {
      setSeeded(true);
      setTimeout(() => setSeeded(false), 3000);
      router.refresh();
      // Reload current page to refresh all data
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-white/[0.08] bg-[#07090e]/80 px-4 sm:px-8 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <span>Creator Workspace</span>
          <span className="hidden sm:inline-block rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[11px] font-medium text-indigo-300">
            {user?.creatorType || "Creator"}
          </span>
        </h1>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Seed Demo Button */}
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white transition disabled:opacity-50"
          title="Seed realistic demo data (scripts, ideas, clips, assets, analytics)"
        >
          {seeding ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
          ) : seeded ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Database className="h-3.5 w-3.5 text-purple-400" />
          )}
          <span className="hidden sm:inline">{seeded ? "Demo Loaded" : "Load Demo Data"}</span>
        </button>

        {/* Primary CTA: Create New Content */}
        <button
          onClick={onNewContent || (() => router.push("/dashboard/ideas?new=true"))}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Content</span>
        </button>

        {/* User Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-xs font-bold text-white shadow-sm">
          {user?.name ? user.name.charAt(0).toUpperCase() : <Sparkles className="h-4 w-4 text-white" />}
        </div>
      </div>
    </header>
  );
}
