"use client";

import { useState } from "react";
import { Plus, Database, Sparkles, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export function Header({ onNewContent }: { onNewContent?: () => void }) {
  const { user, seedDemo } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const router = useRouter();
  const handleSeed = async () => { setSeeding(true); const res = await seedDemo(); setSeeding(false); if (res.success) { setSeeded(true); setTimeout(() => setSeeded(false), 3000); router.refresh(); window.location.reload(); } };
  return (
    <header className="sticky top-3 z-20 mx-3 flex h-16 items-center justify-between rounded-[26px] border border-white/75 bg-white/55 px-4 shadow-[0_15px_45px_rgba(20,20,20,.07)] backdrop-blur-2xl sm:mx-5 sm:px-6 lg:ml-[276px] lg:mr-5">
      <div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#111214] text-white lg:hidden"><Sparkles className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-sm font-black tracking-tight text-[#111214] sm:text-base">Creator Workspace</p><span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#85868a]">{user?.creatorType || "Creator"}</span></div></div>
      <div className="flex items-center gap-2"><button onClick={handleSeed} disabled={seeding} className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/50 px-3 py-2 text-[10px] font-bold text-[#66686c] transition hover:bg-white hover:text-[#111214]">{seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : seeded ? <Check className="h-3.5 w-3.5" /> : <Database className="h-3.5 w-3.5" />}<span className="hidden sm:inline">{seeded ? "Demo Loaded" : "Load Demo"}</span></button><button onClick={onNewContent || (() => router.push("/dashboard/ideas?new=true"))} className="creator-button px-4 py-2.5 text-[10px] sm:text-xs"><Plus className="h-4 w-4" /><span className="hidden xs:inline">Create</span><span className="sm:inline"> New Content</span></button><div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#111214] text-xs font-bold text-white">{user?.name ? user.name.charAt(0).toUpperCase() : <Sparkles className="h-4 w-4" />}</div></div>
    </header>
  );
}
