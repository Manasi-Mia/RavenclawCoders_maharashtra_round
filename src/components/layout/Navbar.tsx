"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Video, Layers, Wand2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#07090e]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#07090e]">
              <Sparkles className="h-4 w-4 text-cyan-300" />
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Creator<span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-8 md:flex text-sm font-medium text-slate-300">
          <Link href="#workflow" className="transition hover:text-white flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-indigo-400" /> Workflow
          </Link>
          <Link href="#features" className="transition hover:text-white flex items-center gap-1.5">
            <Wand2 className="h-4 w-4 text-purple-400" /> AI Studio
          </Link>
          <Link href="#intelligence" className="transition hover:text-white flex items-center gap-1.5">
            <Video className="h-4 w-4 text-cyan-400" /> Video Intelligence
          </Link>
          <Link href="#pricing" className="transition hover:text-white">
            Pricing
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:opacity-95"
            >
              Creator Workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-300 transition hover:text-white px-3 py-1.5"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:opacity-95"
              >
                Start Creating
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
