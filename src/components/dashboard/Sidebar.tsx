"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Lightbulb, FileText, FolderKanban, Wand2, Share2, BarChart3, Calendar, Settings, Sparkles, Video, LogOut, FolderOpen, Flame, BrainCircuit } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const sections = [
  { label: "Workspace", items: [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Ideas", href: "/dashboard/ideas", icon: Lightbulb },
    { name: "Scripts", href: "/dashboard/scripts", icon: FileText },
    { name: "Projects", href: "/dashboard/projects", icon: FolderOpen },
    { name: "AI Studio", href: "/dashboard/ai-studio", icon: Wand2 },
    { name: "Video Intelligence", href: "/dashboard/video-intelligence", icon: Video },
    { name: "Repurpose", href: "/dashboard/repurpose", icon: Share2 },
    { name: "Workflow", href: "/dashboard/workflow", icon: FolderKanban },
    { name: "Assets", href: "/dashboard/assets", icon: FolderOpen },
  ]},
  { label: "Growth", items: [
    { name: "Trend Radar", href: "/dashboard/trends", icon: Flame },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Creator Intelligence", href: "/dashboard/intelligence", icon: BrainCircuit },
    { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, system } = useAuth();

  return (
    <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-30 border-r border-white/[0.08] bg-[#090d16]/95 backdrop-blur-xl">
      <div className="flex h-16 items-center px-6 border-b border-white/[0.08]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 shadow-md shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#07090e]"><Sparkles className="h-4 w-4 text-cyan-300" /></div>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Creator<span className="text-indigo-400">AI</span></span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-5">
            <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{section.label}</div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive ? "bg-gradient-to-r from-indigo-600/25 to-purple-600/15 text-white border border-indigo-500/25 shadow-sm" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"}`}>
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-4 mb-3 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.05] px-3 py-2.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">AI Engine</span><span className="text-cyan-400">Gemini 2.5</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ready</div>
      </div>

      <div className="p-4 border-t border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">{user?.name ? user.name.charAt(0).toUpperCase() : "C"}</div>
          <div className="min-w-0"><p className="truncate text-xs font-semibold text-white">{user?.name || "Creator"}</p><p className="truncate text-[11px] text-slate-400">{user?.creatorType || "Pro Creator"}</p></div>
        </div>
        <button onClick={() => logout()} title="Sign Out" aria-label="Sign out" className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"><LogOut className="h-4 w-4" /></button>
      </div>
    </aside>
  );
}
