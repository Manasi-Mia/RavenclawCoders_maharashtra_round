"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Header } from "@/components/dashboard/Header";
import { AssistantDrawer } from "@/components/dashboard/AssistantDrawer";
import { Modal } from "@/components/ui/Modal";
import { Loader2, Plus, Sparkles } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPlatform, setNewPlatform] = useState("YouTube");
  const [newType, setNewType] = useState<"project" | "idea" | "script">("project");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const body = { title: newTitle, platform: newPlatform, ...(newType === "project" ? { status: "IDEA" } : {}) };
      const endpoint = newType === "project" ? "/api/projects" : newType === "idea" ? "/api/ideas" : "/api/scripts";
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) return;
      setCreateModalOpen(false);
      setNewTitle("");
      if (newType === "project" && data.project?._id) router.push(`/dashboard/projects/${data.project._id}`);
      else if (newType === "script" && data.script?._id) router.push(`/dashboard/scripts/${data.script._id}`);
      else router.push("/dashboard/ideas");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="creator-auth flex min-h-screen items-center justify-center">
        <div className="glass-panel flex flex-col items-center gap-3 px-8 py-7">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#111214] text-white"><Sparkles className="h-5 w-5 animate-pulse" /></div>
          <p className="text-xs font-semibold text-[#5f6064]">Entering your workspace…</p>
        </div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="creator-dashboard flex min-h-screen">
      <div className="creator-ambient" aria-hidden="true" />
      <Sidebar />
      <div className="relative z-10 flex min-h-screen flex-1 flex-col lg:pl-64">
        <Header onNewContent={() => setCreateModalOpen(true)} />
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-5 pb-24 sm:px-6 sm:py-7 lg:px-8 lg:pb-8">{children}</main>
      </div>
      <MobileNav />
      <AssistantDrawer />
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create something new">
        <form onSubmit={handleCreate} className="space-y-5 text-[#111214]">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#77797c]">What are you creating?</label>
            <div className="grid grid-cols-3 gap-2">
              {[{ id: "project", label: "Project" }, { id: "script", label: "Script" }, { id: "idea", label: "Idea" }].map((t) => (
                <button type="button" key={t.id} onClick={() => setNewType(t.id as typeof newType)} className={`rounded-2xl border px-3 py-3 text-xs font-bold transition ${newType === t.id ? "border-black bg-black text-white" : "border-black/10 bg-white/55 text-[#66686c] hover:bg-white"}`}>{t.label}</button>
              ))}
            </div>
          </div>
          <div><label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#77797c]">Title / topic</label><input required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. My next creator workflow" className="w-full px-4 py-3 text-sm" /></div>
          <div><label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#77797c]">Primary platform</label><select value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} className="w-full px-4 py-3 text-sm"><option>YouTube</option><option>Instagram</option><option>TikTok</option><option>LinkedIn</option><option>Multi-Platform</option></select></div>
          <div className="flex justify-end gap-2 border-t border-black/10 pt-4"><button type="button" onClick={() => setCreateModalOpen(false)} className="rounded-full px-5 py-2.5 text-xs font-semibold text-[#686a6e] hover:bg-black/5">Cancel</button><button type="submit" disabled={creating} className="creator-button px-5 py-2.5 text-xs">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create now</button></div>
        </form>
      </Modal>
    </div>
  );
}
