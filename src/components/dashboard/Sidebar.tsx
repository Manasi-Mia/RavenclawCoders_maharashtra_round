"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Lightbulb, FileText, FolderKanban, Wand2, Share2, BarChart3, Calendar, Settings, Sparkles, Video, LogOut, FolderOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const sections = [
  { label: "Workspace", items: [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard }, { name: "Ideas", href: "/dashboard/ideas", icon: Lightbulb }, { name: "Scripts", href: "/dashboard/scripts", icon: FileText }, { name: "Projects", href: "/dashboard/projects", icon: FolderOpen }, { name: "AI Studio", href: "/dashboard/ai-studio", icon: Wand2 }, { name: "Video Intelligence", href: "/dashboard/video-intelligence", icon: Video }, { name: "Repurpose", href: "/dashboard/repurpose", icon: Share2 }, { name: "Workflow", href: "/dashboard/workflow", icon: FolderKanban }, { name: "Assets", href: "/dashboard/assets", icon: FolderOpen },
  ]},
  { label: "Growth", items: [ { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 }, { name: "Calendar", href: "/dashboard/calendar", icon: Calendar }, { name: "Settings", href: "/dashboard/settings", icon: Settings } ] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, system } = useAuth();
  return (
    <aside className="fixed inset-y-3 left-3 z-30 hidden w-[248px] flex-col overflow-hidden rounded-[30px] border border-white/75 bg-white/50 shadow-[0_24px_70px_rgba(20,20,20,.10)] backdrop-blur-2xl lg:flex">
      <div className="flex h-16 items-center border-b border-black/10 px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#111214] text-white shadow-lg"><Sparkles className="h-4 w-4" /></div><span className="text-lg font-black tracking-tight text-[#111214]">CreatorAI</span></Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => <div key={section.label} className="mb-5"><div className="px-2 pb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#8a8b8e]">{section.label}</div><div className="space-y-1">{section.items.map((item) => { const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)); const Icon = item.icon; return <Link key={item.name} href={item.href} className={`group flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-xs font-semibold transition ${isActive ? "border-black/10 bg-[#111214] text-white shadow-md" : "border-transparent text-[#696b70] hover:border-black/5 hover:bg-white/55 hover:text-[#111214]"}`}><Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-[#7c7e82] group-hover:text-[#111214]"}`} /><span>{item.name}</span></Link>; })}</div></div>)}
      </div>
      <div className="mx-3 mb-3 rounded-2xl border border-black/10 bg-white/50 px-3 py-2.5"><div className="flex items-center justify-between text-[10px] font-semibold"><span className="text-[#77797c]">AI Engine</span><span className="text-[#111214]">Gemini</span></div><div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-[#77797c]"><span className="h-1.5 w-1.5 rounded-full bg-[#111214]" /> Ready</div><div className="mt-1 flex items-center justify-between text-[9px] text-[#77797c]"><span>Database</span><span className="font-semibold text-[#111214]">{system.mongoConfigured ? "Atlas" : "Active"}</span></div></div>
      <div className="flex items-center justify-between border-t border-black/10 p-3"><div className="flex min-w-0 items-center gap-2.5"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#111214] text-sm font-bold text-white">{user?.name ? user.name.charAt(0).toUpperCase() : "C"}</div><div className="min-w-0"><p className="truncate text-xs font-bold text-[#111214]">{user?.name || "Creator"}</p><p className="truncate text-[10px] text-[#77797c]">{user?.creatorType || "Creator"}</p></div></div><button onClick={() => logout()} title="Sign out" aria-label="Sign out" className="rounded-xl p-2 text-[#77797c] transition hover:bg-black/5 hover:text-[#111214]"><LogOut className="h-4 w-4" /></button></div>
    </aside>
  );
}
