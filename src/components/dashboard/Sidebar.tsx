"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  FileText,
  FolderKanban,
  Wand2,
  Share2,
  BarChart3,
  Calendar,
  Settings,
  Sparkles,
  Video,
  LogOut,
  FolderOpen,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Content Ideas", href: "/dashboard/ideas", icon: Lightbulb },
  { name: "Scripts", href: "/dashboard/scripts", icon: FileText },
  { name: "Video Projects", href: "/dashboard/projects", icon: FolderOpen },
  { name: "AI Studio", href: "/dashboard/ai-studio", icon: Wand2 },
  { name: "Video Intelligence", href: "/dashboard/video-intelligence", icon: Video },
  { name: "Repurpose", href: "/dashboard/repurpose", icon: Share2 },
  { name: "Workflow", href: "/dashboard/workflow", icon: FolderKanban },
  { name: "Assets", href: "/dashboard/assets", icon: FolderOpen },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, system } = useAuth();

  return (
    <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-30 border-r border-white/[0.08] bg-[#090d16]/95 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-white/[0.08]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 shadow-md shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#07090e]">
              <Sparkles className="h-4 w-4 text-cyan-300" />
            </div>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Creator<span className="text-indigo-400">AI</span>
          </span>
        </Link>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
        <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Core Workspace
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-white border border-indigo-500/30 shadow-sm"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
            >
              <Icon
                className={`h-4 w-4 transition-colors ${
                  isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* System Status Indicators */}
      <div className="px-5 py-3 border-t border-white/[0.06] bg-black/20 text-xs text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-slate-400">AI Engine:</span>
          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            Gemini 2.5
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Database:</span>
          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            {system.mongoConfigured ? "MongoDB Atlas" : "Unified Active"}
          </span>
        </div>
      </div>

      {/* User Card */}
      <div className="p-4 border-t border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : "C"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">{user?.name || "Creator"}</p>
            <p className="truncate text-[11px] text-slate-400">{user?.creatorType || "Pro Creator"}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          title="Sign Out"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
