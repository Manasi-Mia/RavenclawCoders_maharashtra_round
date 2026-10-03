"use client";

import { useState } from "react";
import {
  Settings,
  Database,
  Sparkles,
  Check,
  ShieldCheck,
  RotateCw,
  LogOut,
  User,
  Key,
  Server,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";

export default function SettingsPage() {
  const { user, system, logout, seedDemo } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    const res = await seedDemo();
    setSeeding(false);
    if (res.success) {
      setSeeded(true);
      setTimeout(() => setSeeded(false), 3000);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="h-6 w-6 text-slate-400" />
          Creator Settings & System Health
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Manage your creator profile, check MongoDB Atlas & Gemini API status, and configure environment variables.
        </p>
      </div>

      {/* Creator Profile Card */}
      <div className="rounded-2xl border border-white/10 bg-[#0d121f]/90 p-6 space-y-4 shadow-xl">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
          <User className="h-4 w-4 text-indigo-400" />
          Creator Profile
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Full Name</span>
            <p className="text-sm font-semibold text-white mt-1">{user?.name || "Creator"}</p>
          </div>
          <div>
            <span className="text-slate-400">Email Address</span>
            <p className="text-sm font-semibold text-white mt-1">{user?.email || "creator@example.com"}</p>
          </div>
          <div>
            <span className="text-slate-400">Creator Specialization</span>
            <p className="text-sm font-semibold text-cyan-400 mt-1">{user?.creatorType || "YouTuber"}</p>
          </div>
          <div>
            <span className="text-slate-400">Account Created</span>
            <p className="text-sm font-semibold text-slate-300 mt-1">{formatDate(user?.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Infrastructure & Environment Status */}
      <div className="rounded-2xl border border-white/10 bg-[#0d121f]/90 p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="h-4 w-4 text-purple-400" />
            Infrastructure & API Connections
          </h2>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            ● Vercel Serverless Ready
          </span>
        </div>

        <div className="space-y-4">
          {/* MongoDB Atlas Check */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white">MongoDB Atlas Connection</h3>
                  {system.mongoConfigured ? (
                    <span className="rounded bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-mono">
                      ACTIVE (Atlas Cluster)
                    </span>
                  ) : (
                    <span className="rounded bg-indigo-500/20 text-indigo-300 px-2 py-0.5 text-[10px] font-mono">
                      UNIFIED DATA STORE (Ready for Atlas)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {system.mongoConfigured
                    ? "Connected to remote MongoDB Atlas cluster with cached serverless connection pooling."
                    : "Add MONGODB_URI in your .env.local or Vercel Environment Variables to sync with MongoDB Atlas."}
                </p>
              </div>
            </div>
          </div>

          {/* Gemini API Check */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-cyan-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white">Google Gemini API</h3>
                  {system.geminiConfigured ? (
                    <span className="rounded bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-mono">
                      LIVE (Gemini 2.5 Flash)
                    </span>
                  ) : (
                    <span className="rounded bg-purple-500/20 text-purple-300 px-2 py-0.5 text-[10px] font-mono">
                      GENERATIVE ENGINE (Add GEMINI_API_KEY for Live API)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {system.geminiConfigured
                    ? "Server-side Gemini 2.5 Flash client initialized with zero client-side credential exposure."
                    : "Add GEMINI_API_KEY to your environment variables to enable live Google Gemini calls."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Environment setup instructions */}
        <div className="rounded-xl border border-white/5 bg-black/40 p-4 space-y-2 text-xs">
          <span className="font-semibold text-slate-300 block">Required Environment Variables (.env.local):</span>
          <pre className="p-3 rounded-lg bg-[#07090e] border border-white/5 font-mono text-[11px] text-cyan-300 overflow-x-auto">
{`MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/creatorai?retryWrites=true&w=majority
GEMINI_API_KEY=AIzaSy...
JWT_SECRET=your_jwt_secret_key`}
          </pre>
        </div>
      </div>

      {/* Demo Data Management */}
      <div className="rounded-2xl border border-white/10 bg-[#0d121f]/90 p-6 space-y-4 shadow-xl">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
          <RotateCw className="h-4 w-4 text-cyan-400" />
          Demo Data & Seed Mode
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Need to test all features with realistic content? One click populates &ldquo;How I Built My First AI App in 48 Hours&rdquo;, complete with hooks, scripts, clips, assets, and analytics.
        </p>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:opacity-95 transition disabled:opacity-50"
        >
          {seeding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : seeded ? (
            <Check className="h-4 w-4 text-emerald-300" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          <span>{seeded ? "Demo Data Seeded!" : "Reload Realistic Demo Data"}</span>
        </button>
      </div>

      {/* Logout */}
      <div className="pt-2">
        <button
          onClick={() => logout()}
          className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out of CreatorAI</span>
        </button>
      </div>
    </div>
  );
}
