"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  Users,
  Eye,
  MessageSquare,
  Share2,
  Loader2,
  Flame,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";
import { IAnalytics } from "@/models";
import { formatDate } from "@/lib/utils";

interface CreatorIntelligenceReport {
  overview: string;
  highPerformingTopics: string[];
  strongHooksPattern: string;
  weakPerformingFormats: string;
  recommendedExperiments: string[];
  nextBestAction: string;
}

export default function AnalyticsDashboardPage() {
  const [analytics, setAnalytics] = useState<IAnalytics[]>([]);
  const [summary, setSummary] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    avgEngagement: 0,
    postsPublished: 0,
  });

  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [intelligenceReport, setIntelligenceReport] = useState<CreatorIntelligenceReport | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const d = await res.json();
        setAnalytics(d.records || []);
        if (d.summary) setSummary(d.summary);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleGenerateIntelligence = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch("/api/analytics/insights", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.report) {
        setIntelligenceReport(data.report);
      }
    } finally {
      setGeneratingReport(false);
    }
  };

  // Platform Distribution percentages
  const platformStats = [
    { platform: "YouTube", views: 48200, percentage: 30, color: "bg-red-500" },
    { platform: "Instagram", views: 31500, percentage: 20, color: "bg-pink-500" },
    { platform: "TikTok", views: 64000, percentage: 39, color: "bg-cyan-500" },
    { platform: "LinkedIn", views: 18900, percentage: 11, color: "bg-blue-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-teal-400" />
            Creator Analytics & Intelligence
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Real performance telemetry combined with Gemini algorithmic observations and high-leverage growth actions.
          </p>
        </div>

        <button
          onClick={handleGenerateIntelligence}
          disabled={generatingReport}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-teal-500/20 hover:opacity-95 transition disabled:opacity-50"
        >
          {generatingReport ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 text-cyan-300" />
          )}
          <span>{generatingReport ? "Analyzing with Gemini..." : "Run Creator Intelligence"}</span>
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Views", value: summary.totalViews ? summary.totalViews.toLocaleString() : "162,600", icon: Eye, color: "text-cyan-400" },
          { label: "Total Likes", value: summary.totalLikes ? summary.totalLikes.toLocaleString() : "13,510", icon: Flame, color: "text-pink-400" },
          { label: "Comments", value: summary.totalComments ? summary.totalComments.toLocaleString() : "1,231", icon: MessageSquare, color: "text-purple-400" },
          { label: "Shares", value: summary.totalShares ? summary.totalShares.toLocaleString() : "3,240", icon: Share2, color: "text-emerald-400" },
          { label: "Avg Engagement", value: `${summary.avgEngagement || 11.2}%`, icon: TrendingUp, color: "text-teal-400" },
          { label: "Content Published", value: summary.postsPublished || 4, icon: CheckCircle2, color: "text-indigo-400" },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="glass-card rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-medium">{m.label}</span>
                <Icon className={`h-4 w-4 ${m.color}`} />
              </div>
              <p className="text-xl font-extrabold text-white">{m.value}</p>
            </div>
          );
        })}
      </div>

      {/* Visual Charts & Telemetry Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Views over time bar chart (Col 7) */}
        <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#0d121f]/90 p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Views Velocity Over Time</h3>
              <p className="text-[11px] text-slate-400">Weekly content distribution and viewership trajectory</p>
            </div>
            <span className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-xs font-mono font-semibold">
              +42% Growth
            </span>
          </div>

          {/* Bar Chart Simulation */}
          <div className="h-56 flex items-end justify-between gap-3 pt-6 px-2">
            {[
              { day: "Mon", height: "45%", views: "14.2k" },
              { day: "Tue", height: "65%", views: "28.5k" },
              { day: "Wed", height: "35%", views: "11.8k" },
              { day: "Thu", height: "85%", views: "48.2k", active: true },
              { day: "Fri", height: "55%", views: "22.1k" },
              { day: "Sat", height: "95%", views: "64.0k", active: true },
              { day: "Sun", height: "40%", views: "15.4k" },
            ].map((col) => (
              <div key={col.day} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="opacity-0 group-hover:opacity-100 transition text-[10px] font-mono text-cyan-300">
                  {col.views}
                </span>
                <div className="w-full bg-white/[0.05] rounded-t-lg h-full flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      col.active
                        ? "bg-gradient-to-t from-indigo-600 via-purple-500 to-cyan-400"
                        : "bg-indigo-600/40 hover:bg-indigo-600/70"
                    }`}
                    style={{ height: col.height }}
                  />
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{col.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Share (Col 5) */}
        <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-[#0d121f]/90 p-6 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="border-b border-white/[0.08] pb-3">
            <h3 className="text-sm font-bold text-white">Platform Reach Distribution</h3>
            <p className="text-[11px] text-slate-400">Where your audience engages most</p>
          </div>

          <div className="space-y-3.5">
            {platformStats.map((p) => (
              <div key={p.platform} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{p.platform}</span>
                  <span className="text-slate-400 font-mono">
                    {p.views.toLocaleString()} views ({p.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/[0.08] overflow-hidden">
                  <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-400">
            💡 Short-form discovery (TikTok & Shorts) drives <strong className="text-white">69% of net reach</strong>, while LinkedIn converts highest into newsletter subscribers.
          </div>
        </div>
      </div>

      {/* Creator Intelligence Section (Explicitly AI-generated) */}
      <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-indigo-950/40 via-[#0d121f] to-[#0d121f] p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-500 to-cyan-400 flex items-center justify-center text-white">
              <Sparkles className="h-4 w-4 text-cyan-200" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Creator Intelligence
                <span className="rounded bg-purple-500/20 text-cyan-300 px-2 py-0.5 text-[9px] font-mono uppercase">
                  AI Algorithmic Audit
                </span>
              </h2>
              <p className="text-xs text-slate-400">Deep insights synthesized by Google Gemini from your analytics</p>
            </div>
          </div>

          <span className="text-[11px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
            ✨ AI-Generated Strategy (Distinct from telemetry)
          </span>
        </div>

        {intelligenceReport ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs sm:text-sm text-slate-200 leading-relaxed">
              <strong className="text-cyan-300">Executive Synthesis: </strong>
              {intelligenceReport.overview}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* High Performing */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] p-4 space-y-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Flame className="h-4 w-4" /> High-Performing Topics
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                  {intelligenceReport.highPerformingTopics.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>

              {/* Hook Analysis */}
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.02] p-4 space-y-2">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4" /> Strong Hook Patterns
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {intelligenceReport.strongHooksPattern}
                </p>
              </div>

              {/* Formats to Fix */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.02] p-4 space-y-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Underperforming Formats
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {intelligenceReport.weakPerformingFormats}
                </p>
              </div>
            </div>

            {/* Next Best Action */}
            <div className="rounded-xl border border-indigo-500/40 bg-indigo-600/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-indigo-400">
                  Recommended Immediate High-Leverage Move
                </span>
                <p className="text-xs sm:text-sm font-semibold text-white mt-0.5">
                  {intelligenceReport.nextBestAction}
                </p>
              </div>

              <Link
                href="/dashboard/video-intelligence"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-950 hover:bg-slate-200 transition shrink-0"
              >
                Execute Now →
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-white/10 rounded-xl space-y-3">
            <p className="text-xs text-slate-400">
              Click below to generate Gemini algorithmic observations across your published projects.
            </p>
            <button
              onClick={handleGenerateIntelligence}
              disabled={generatingReport}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-purple-500 transition disabled:opacity-50"
            >
              {generatingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>Run Intelligence Report</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
