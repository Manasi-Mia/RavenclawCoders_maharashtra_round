"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Plus,
  Play,
  Share2,
  TrendingUp,
  Clock,
  CheckCircle2,
  Lightbulb,
  Video,
  FileText,
  Layers,
  ChevronRight,
  Database,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { IProject, IIdea, IScript } from "@/models";
import { formatDate } from "@/lib/utils";

export default function DashboardHome() {
  const { user, seedDemo } = useAuth();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [ideas, setIdeas] = useState<IIdea[]>([]);
  const [scripts, setScripts] = useState<IScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Dynamic greeting based on creator's local hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, ideaRes, scriptRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/ideas"),
        fetch("/api/scripts"),
      ]);

      if (projRes.ok) {
        const d = await projRes.json();
        setProjects(d.projects || []);
      }
      if (ideaRes.ok) {
        const d = await ideaRes.json();
        setIdeas(d.ideas || []);
      }
      if (scriptRes.ok) {
        const d = await scriptRes.json();
        setScripts(d.scripts || []);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute pipeline stage counts
  const pipelineCounts = useMemo(() => {
    const counts = {
      IDEA: ideas.filter((i) => i.status === "IDEA").length + projects.filter((p) => p.status === "IDEA").length,
      PLANNED: projects.filter((p) => p.status === "PLANNED").length + ideas.filter((i) => i.status === "PLANNED").length,
      RECORDING: projects.filter((p) => p.status === "RECORDING").length,
      EDITING: projects.filter((p) => p.status === "EDITING").length,
      READY: projects.filter((p) => p.status === "READY").length,
      PUBLISHED: projects.filter((p) => p.status === "PUBLISHED").length,
    };
    return counts;
  }, [projects, ideas]);

  const handleSeed = async () => {
    setSeeding(true);
    await seedDemo();
    await fetchData();
    setSeeding(false);
  };

  const activeProject = projects.find((p) => p.status === "RECORDING" || p.status === "EDITING") || projects[0];

  return (
    <div className="space-y-8">
      {/* Top Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {greeting}, {user?.name || "Creator"} 👋
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Here is your daily creative production overview. You have{" "}
            <span className="text-indigo-400 font-semibold">{projects.length} active projects</span> and{" "}
            <span className="text-cyan-400 font-semibold">{ideas.length} ideas</span> in flight.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {projects.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition disabled:opacity-50"
            >
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              Load Realistic Demo Data
            </button>
          )}

          <Link
            href="/dashboard/ai-studio"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition"
          >
            <Sparkles className="h-4 w-4 text-cyan-200" />
            <span>AI Script Studio</span>
          </Link>
        </div>
      </div>

      {/* Answer to Question 1 & 2: "What am I working on?" & "What should I do next?" */}
      {activeProject && (
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-[#0d121f] to-[#0d121f] p-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 text-[10px] font-mono text-cyan-300 uppercase">
                  Primary Focus Project
                </span>
                <span className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-mono font-semibold">
                  {activeProject.status}
                </span>
                <span className="text-xs text-slate-400">• {activeProject.platform}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {activeProject.title}
              </h2>
              <p className="text-xs text-slate-400 line-clamp-2">
                {activeProject.description || "In-progress video production asset."}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                <span>Progress: <strong className="text-white">{activeProject.progress}%</strong></span>
                <span>Deadline: <strong className="text-white">{formatDate(activeProject.deadline)}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={`/dashboard/projects/${activeProject._id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:bg-slate-200 transition"
              >
                <span>Open Project Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/video-intelligence"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] transition"
              >
                <Video className="h-4 w-4 text-cyan-400" />
                Find Clips
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Total Projects", value: projects.length, icon: Layers, color: "text-indigo-400" },
          { label: "Ideas Stored", value: ideas.length, icon: Lightbulb, color: "text-amber-400" },
          { label: "Scripts Written", value: scripts.length, icon: FileText, color: "text-purple-400" },
          { label: "In Production", value: pipelineCounts.RECORDING + pipelineCounts.EDITING, icon: Clock, color: "text-cyan-400" },
          { label: "Published Content", value: pipelineCounts.PUBLISHED || 1, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Total Reach", value: "162.6K", icon: TrendingUp, color: "text-pink-400" },
          { label: "Avg Engagement", value: "11.2%", icon: Sparkles, color: "text-teal-400" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-medium leading-none">{s.label}</span>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-xl font-extrabold text-white tracking-tight">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Content Pipeline Visualizer (Answer to UX: What stage is everything in?) */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              Content Pipeline
            </h3>
            <p className="text-xs text-slate-400">Items currently distributed across production stages</p>
          </div>
          <Link
            href="/dashboard/workflow"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
          >
            Kanban Board <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { stage: "Ideas", count: pipelineCounts.IDEA, color: "border-amber-500/30 bg-amber-500/5 text-amber-400" },
            { stage: "Planned", count: pipelineCounts.PLANNED, color: "border-blue-500/30 bg-blue-500/5 text-blue-400" },
            { stage: "Recording", count: pipelineCounts.RECORDING, color: "border-cyan-500/30 bg-cyan-500/5 text-cyan-400" },
            { stage: "Editing", count: pipelineCounts.EDITING, color: "border-purple-500/30 bg-purple-500/5 text-purple-400" },
            { stage: "Ready", count: pipelineCounts.READY, color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" },
            { stage: "Published", count: pipelineCounts.PUBLISHED, color: "border-pink-500/30 bg-pink-500/5 text-pink-400" },
          ].map((col) => (
            <div key={col.stage} className={`rounded-xl border p-4 ${col.color} flex flex-col justify-between`}>
              <span className="text-xs font-semibold text-slate-200">{col.stage}</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white">{col.count}</span>
                <span className="text-[10px] uppercase font-mono text-slate-400">items</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Answer to Question 3: "How can AI help me right now?" (AI Suggestions with 1-click actions) */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white">
              <Sparkles className="h-4 w-4 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Intelligent AI Suggestions</h3>
              <p className="text-xs text-slate-400">High-leverage growth opportunities identified by Gemini</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1 */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between hover:border-purple-500/40 transition">
            <div>
              <span className="rounded bg-purple-500/20 text-purple-300 px-2 py-0.5 text-[10px] font-mono">
                Short-Form Multiplier
              </span>
              <h4 className="mt-2.5 text-xs font-bold text-white">Turn Latest Video into 5 Shorts</h4>
              <p className="mt-1 text-[11px] text-slate-400">
                Extract high-retention 45s moment candidates from transcript with auto hooks.
              </p>
            </div>
            <Link
              href="/dashboard/video-intelligence"
              className="mt-4 inline-flex items-center justify-between text-xs font-semibold text-cyan-300 hover:text-cyan-200 pt-2 border-t border-white/[0.06]"
            >
              <span>Scan Transcript</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Action 2 */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between hover:border-indigo-500/40 transition">
            <div>
              <span className="rounded bg-indigo-500/20 text-indigo-300 px-2 py-0.5 text-[10px] font-mono">
                Cross-Platform
              </span>
              <h4 className="mt-2.5 text-xs font-bold text-white">Repurpose Script for LinkedIn</h4>
              <p className="mt-1 text-[11px] text-slate-400">
                Transform master script into a high-converting text post with founder context.
              </p>
            </div>
            <Link
              href="/dashboard/repurpose"
              className="mt-4 inline-flex items-center justify-between text-xs font-semibold text-indigo-300 hover:text-indigo-200 pt-2 border-t border-white/[0.06]"
            >
              <span>Repurpose Post</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Action 3 */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between hover:border-cyan-500/40 transition">
            <div>
              <span className="rounded bg-cyan-500/20 text-cyan-300 px-2 py-0.5 text-[10px] font-mono">
                Retention Optimization
              </span>
              <h4 className="mt-2.5 text-xs font-bold text-white">Generate 6 Stronger Hooks</h4>
              <p className="mt-1 text-[11px] text-slate-400">
                Test curiosity gap, contrarian statements, and psychological pattern interrupts.
              </p>
            </div>
            <Link
              href="/dashboard/ai-studio"
              className="mt-4 inline-flex items-center justify-between text-xs font-semibold text-cyan-300 hover:text-cyan-200 pt-2 border-t border-white/[0.06]"
            >
              <span>Generate Hooks</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Action 4 */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between hover:border-emerald-500/40 transition">
            <div>
              <span className="rounded bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-mono">
                Idea Generation
              </span>
              <h4 className="mt-2.5 text-xs font-bold text-white">Discover 5 Viral Topics</h4>
              <p className="mt-1 text-[11px] text-slate-400">
                Brainstorm high-intent content themes based on your target audience profile.
              </p>
            </div>
            <Link
              href="/dashboard/ideas?generate=true"
              className="mt-4 inline-flex items-center justify-between text-xs font-semibold text-emerald-300 hover:text-emerald-200 pt-2 border-t border-white/[0.06]"
            >
              <span>Brainstorm Topics</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Projects Table & Cards */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-white">Recent Projects</h3>
            <p className="text-xs text-slate-400">Active content productions across all channels</p>
          </div>
          <Link
            href="/dashboard/projects"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
          >
            View All Projects <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {projects.length === 0 && !loading ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
            <Video className="mx-auto h-8 w-8 text-slate-500" />
            <p className="mt-2 text-sm text-slate-300 font-medium">No projects created yet</p>
            <p className="text-xs text-slate-500 mt-1">Start by creating your first project or loading realistic demo data</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white hover:bg-white/[0.08] transition"
              >
                {seeding ? "Loading Demo..." : "Load Demo Data"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((proj) => (
              <Link
                key={proj._id}
                href={`/dashboard/projects/${proj._id}`}
                className="group rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-indigo-500/40 hover:bg-white/[0.05] transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                      {proj.platform}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-mono font-semibold ${
                        proj.status === "PUBLISHED"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : proj.status === "RECORDING"
                          ? "bg-cyan-500/10 text-cyan-400"
                          : proj.status === "EDITING"
                          ? "bg-purple-500/10 text-purple-400"
                          : "bg-white/10 text-slate-300"
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition line-clamp-1">
                    {proj.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {proj.description || "Video production workflow."}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Progress</span>
                    <span className="font-semibold text-slate-200">{proj.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>Deadline: {formatDate(proj.deadline)}</span>
                    <span className="text-cyan-400 group-hover:underline">Open Studio →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
