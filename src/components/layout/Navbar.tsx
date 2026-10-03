"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Video, Layers, Wand2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-[#e9e7e2]/70 backdrop-blur-2xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-75">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/60 shadow-sm backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-[#111214]" />
          </div>
          <span className="text-xl font-black tracking-[-0.04em] text-[#111214]">CreatorAI</span>
        </Link>

        <nav className="hidden items-center gap-7 text-xs font-semibold text-[#5c5e62] md:flex">
          <Link href="#workflow" className="flex items-center gap-1.5 transition hover:text-black"><Layers className="h-3.5 w-3.5" /> Workflow</Link>
          <Link href="#features" className="flex items-center gap-1.5 transition hover:text-black"><Wand2 className="h-3.5 w-3.5" /> AI Studio</Link>
          <Link href="#intelligence" className="flex items-center gap-1.5 transition hover:text-black"><Video className="h-3.5 w-3.5" /> Intelligence</Link>
          <Link href="#pricing" className="transition hover:text-black">Pricing</Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-[#0b0c0e] px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:-translate-y-0.5">
              Creator Workspace <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden px-3 py-2 text-xs font-semibold text-[#5c5e62] transition hover:text-black sm:block">Log In</Link>
              <Link href="/register" className="inline-flex items-center gap-1.5 rounded-full bg-[#0b0c0e] px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:-translate-y-0.5">
                Start Creating <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
