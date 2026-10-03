import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#07090e] py-12 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#07090e]">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                </div>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Creator<span className="text-indigo-400">AI</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-slate-400 leading-relaxed">
              The AI-Powered Creator Operating Platform bringing the entire content-production workflow into one centralized workspace: Idea → Script → Assets → Footage → Clips → Editing → Repurposing → Publishing → Analytics.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
              Powered by Google Gemini 2.5 Flash & MongoDB Atlas
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Workflow</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/register" className="hover:text-white transition">Content Ideas</Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition">AI Script Generator</Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition">Video Intelligence</Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition">Short-Form Clips</Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition">Repurpose Studio</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Platforms</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <span className="text-slate-400">YouTube Long-Form</span>
              </li>
              <li>
                <span className="text-slate-400">YouTube Shorts</span>
              </li>
              <li>
                <span className="text-slate-400">Instagram Reels & Carousels</span>
              </li>
              <li>
                <span className="text-slate-400">TikTok Scripts</span>
              </li>
              <li>
                <span className="text-slate-400">LinkedIn Thought Leadership</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Legal & Deploy</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <span className="text-slate-400">Vercel Serverless Ready</span>
              </li>
              <li>
                <span className="text-slate-400">Enterprise Security</span>
              </li>
              <li>
                <span className="text-slate-400">Privacy & Terms</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between border-t border-white/[0.06] pt-8 sm:flex-row text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CreatorAI Platform Inc. All rights reserved.</p>
          <p className="mt-4 sm:mt-0">Designed for professional multi-platform creators.</p>
        </div>
      </div>
    </footer>
  );
}
