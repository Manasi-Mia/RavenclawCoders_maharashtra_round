"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Lightbulb, Scissors, Wand2, Share2, FolderOpen } from "lucide-react";

const mobileItems = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard }, { name: "Ideas", href: "/dashboard/ideas", icon: Lightbulb }, { name: "Studio", href: "/dashboard/studio", icon: Scissors }, { name: "AI Studio", href: "/dashboard/ai-studio", icon: Wand2 }, { name: "Repurpose", href: "/dashboard/repurpose", icon: Share2 }, { name: "Projects", href: "/dashboard/projects", icon: FolderOpen },
];

export function MobileNav() {
  const pathname = usePathname();
  return <nav className="fixed bottom-3 left-3 right-3 z-40 flex items-center justify-around rounded-[26px] border border-white/75 bg-white/70 px-2 py-2 shadow-[0_18px_55px_rgba(20,20,20,.14)] backdrop-blur-2xl lg:hidden">{mobileItems.map((item) => { const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)); const Icon = item.icon; return <Link key={item.name} href={item.href} className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2.5 py-2 text-[9px] font-bold transition ${isActive ? "bg-[#111214] text-white shadow-md" : "text-[#77797c] hover:bg-white/70 hover:text-[#111214]"}`}><Icon className="h-4 w-4" /><span>{item.name}</span></Link>; })}</nav>;
}
