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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPlatform, setNewPlatform] = useState("YouTube");
  const [newType, setNewType] = useState<"project" | "idea" | "script">("project");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);

    try {
      if (newType === "project") {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newTitle,
            platform: newPlatform,
            status: "IDEA",
          }),
        });
        const data = await res.json();
        if (res.ok && data.project?._id) {
          setCreateModalOpen(false);
          router.push(`/dashboard/projects/${data.project._id}`);
          return;
        }
      } else if (newType === "idea") {
        await fetch("/api/ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newTitle,
            platform: newPlatform,
            status: "IDEA",
          }),
        });
        setCreateModalOpen(false);
        router.push("/dashboard/ideas");
      } else if (newType === "script") {
        const res = await fetch("/api/scripts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newTitle,
            platform: newPlatform,
          }),
        });
        const data = await res.json();
        if (res.ok && data.script?._id) {
          setCreateModalOpen(false);
          router.push(`/dashboard/scripts/${data.script._id}`);
          return;
        }
      }
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07090e]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#07090e]">
              <Sparkles className="h-6 w-6 text-cyan-300 animate-pulse" />
            </div>
          </div>
          <p className="text-xs text-slate-400 font-medium">Entering CreatorAI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen pb-16 lg:pb-0">
        <Header onNewContent={() => setCreateModalOpen(true)} />
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Persistent AI Creator Assistant Drawer */}
      <AssistantDrawer />

      {/* Fast Creation Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Content"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">What are you creating?</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "project", label: "Video Project" },
                { id: "script", label: "Script" },
                { id: "idea", label: "Content Idea" },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setNewType(t.id as "project" | "idea" | "script")}
                  className={`rounded-xl py-2 px-3 text-xs font-semibold border transition ${
                    newType === t.id
                      ? "bg-indigo-600/30 border-indigo-500 text-cyan-300"
                      : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Title / Topic</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. My 10x Productivity Setup for 2026"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Primary Platform</label>
            <select
              value={newPlatform}
              onChange={(e) => setNewPlatform(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#090d16] px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="YouTube">YouTube</option>
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Multi-Platform">Multi-Platform</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:opacity-95 transition disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span>Create Now</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
