"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  FileText,
  Wand2,
  Share2,
  FolderOpen,
} from "lucide-react";

const mobileItems = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Ideas", href: "/dashboard/ideas", icon: Lightbulb },
  { name: "Scripts", href: "/dashboard/scripts", icon: FileText },
  { name: "AI Studio", href: "/dashboard/ai-studio", icon: Wand2 },
  { name: "Repurpose", href: "/dashboard/repurpose", icon: Share2 },
  { name: "Projects", href: "/dashboard/projects", icon: FolderOpen },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] bg-[#090d16]/95 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around">
      {mobileItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition ${
              isActive ? "text-cyan-400 font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
