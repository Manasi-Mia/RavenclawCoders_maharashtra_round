"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
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

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const [projRes, ideaRes, scriptRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/ideas"),
          fetch("/api/scripts"),
        ]);
        if (ignore) return;
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
        if (!ignore) setLoading(false);
      }
    }
    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  const reloadData = async () => {
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
    } finally {
      setLoading(false);
    }
  };

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
    await reloadData();
    setSeeding(false);
  };

  const activeProject = projects.find((p) => p.status === "RECORDING" || p.status === "EDITING") || projects[0];

  return (
    <div className="space-y-8">
      {/* Top Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111214] tracking-tight">
            {greeting}, {user?.name || "Creator"} 👋
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#66686c]">
            Here is your daily creative production overview. You have{" "}
            <span className="text-[#111214] font-semibold">{projects.length} active projects</span> and{" "}
            <span className="text-[#111214] font-semibold">{ideas.length} ideas</span> in flight.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {projects.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2.5 text-xs font-semibold text-[#111214] hover:bg-white transition disabled:opacity-50 shadow-xs"
            >
              {seeding ? <Loader2 className="h-4 w-4 animate-spin text-[#111214]" /> : <Database className="h-4 w-4 text-[#111214]" />}
              Load Realistic Demo Data
            </button>
          )}

          <Link
            href="/dashboard/ai-studio"
            className="creator-btn-primary px-5 py-2.5 text-xs sm:text-sm"
          >
            <Sparkles className="h-4 w-4 text-white" />
            <span>AI Script Studio</span>
          </Link>
        </div>
      </div>

      {/* Answer to Question 1 & 2: "What am I working on?" & "What should I do next?" */}
      {activeProject && (
        <div className="rounded-3xl border border-black/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#111214] px-2.5 py-0.5 text-[10px] font-mono text-white font-medium">
                  Primary Focus Project
                </span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold">
                  {activeProject.status}
                </span>
                <span className="text-xs text-[#66686c]">• {activeProject.platform}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#111214] tracking-tight">
                {activeProject.title}
              </h2>
              <p className="text-xs text-[#66686c] line-clamp-2">
                {activeProject.description || "In-progress video production asset."}
              </p>
              <div className="flex items-center gap-4 text-xs text-[#66686c] pt-1">
                <span>Progress: <strong className="text-[#111214]">{activeProject.progress}%</strong></span>
                <span>Deadline: <strong className="text-[#111214]">{formatDate(activeProject.deadline)}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={`/dashboard/projects/${activeProject._id}`}
                className="creator-btn-primary px-4 py-2.5 text-xs"
              >
                <span>Open Project Workspace</span>
                <ArrowRight className="h-4 w-4 text-white" />
              </Link>
              <Link
                href="/dashboard/video-intelligence"
                className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-3.5 py-2.5 text-xs font-semibold text-[#111214] hover:bg-white transition shadow-xs"
              >
                <Video className="h-4 w-4 text-[#111214]" />
                Find Clips
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Total Projects", value: projects.length, icon: Layers },
          { label: "Ideas Stored", value: ideas.length, icon: Lightbulb },
          { label: "Scripts Written", value: scripts.length, icon: FileText },
          { label: "In Production", value: pipelineCounts.RECORDING + pipelineCounts.EDITING, icon: Clock },
          { label: "Published Content", value: pipelineCounts.PUBLISHED || 1, icon: CheckCircle2 },
          { label: "Total Reach", value: "162.6K", icon: TrendingUp },
          { label: "Avg Engagement", value: "11.2%", icon: Sparkles },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card rounded-2xl p-3.5 flex flex-col justify-between border border-black/10 bg-white/60">
              <div className="flex items-center justify-between text-[#66686c] mb-2">
                <span className="text-[11px] font-medium leading-none">{s.label}</span>
                <Icon className="h-4 w-4 text-[#111214]" />
              </div>
              <p className="text-xl font-extrabold text-[#111214] tracking-tight">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Content Pipeline Visualizer */}
      <div className="glass-card rounded-3xl p-6 border border-black/10 bg-white/60 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#111214] flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#111214]" />
              Content Pipeline
            </h3>
            <p className="text-xs text-[#66686c]">Items currently distributed across production stages</p>
          </div>
          <Link
            href="/dashboard/workflow"
            className="text-xs text-[#111214] hover:underline font-semibold flex items-center gap-1 transition"
          >
            Kanban Board <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { stage: "Ideas", count: pipelineCounts.IDEA },
            { stage: "Planned", count: pipelineCounts.PLANNED },
            { stage: "Recording", count: pipelineCounts.RECORDING },
            { stage: "Editing", count: pipelineCounts.EDITING },
            { stage: "Ready", count: pipelineCounts.READY },
            { stage: "Published", count: pipelineCounts.PUBLISHED },
          ].map((col) => (
            <div key={col.stage} className="rounded-2xl border border-black/10 bg-white/70 p-4 flex flex-col justify-between shadow-xs">
              <span className="text-xs font-semibold text-[#111214]">{col.stage}</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#111214]">{col.count}</span>
                <span className="text-[10px] uppercase font-mono text-[#66686c]">items</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Suggestions with 1-click actions */}
      <div className="glass-card rounded-3xl p-6 border border-black/10 bg-white/60 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#111214] flex items-center justify-center text-white shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111214]">Intelligent AI Suggestions</h3>
              <p className="text-xs text-[#66686c]">High-leverage growth opportunities identified by Gemini</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1 */}
          <div className="rounded-2xl border border-black/10 bg-white/70 p-4 flex flex-col justify-between hover:border-black/30 hover:bg-white transition shadow-xs">
            <div>
              <span className="rounded-full bg-black/5 text-[#111214] border border-black/10 px-2 py-0.5 text-[10px] font-mono">
                Short-Form Multiplier
              </span>
              <h4 className="mt-2.5 text-xs font-bold text-[#111214]">Turn Latest Video into 5 Shorts</h4>
              <p className="mt-1 text-[11px] text-[#66686c]">
                Extract high-retention 45s moment candidates from transcript with auto hooks.
              </p>
            </div>
            <Link
              href="/dashboard/video-intelligence"
              className="mt-4 inline-flex items-center justify-between text-xs font-semibold text-[#111214] hover:underline pt-2 border-t border-black/10"
            >
              <span>Scan Transcript</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Action 2 */}
          <div className="rounded-2xl border border-black/10 bg-white/70 p-4 flex flex-col justify-between hover:border-black/30 hover:bg-white transition shadow-xs">
            <div>
              <span className="rounded-full bg-black/5 text-[#111214] border border-black/10 px-2 py-0.5 text-[10px] font-mono">
                Cross-Platform
              </span>
              <h4 className="mt-2.5 text-xs font-bold text-[#111214]">Repurpose Script for LinkedIn</h4>
              <p className="mt-1 text-[11px] text-[#66686c]">
                Transform master script into a high-converting text post with founder context.
              </p>
            </div>
            <Link
              href="/dashboard/repurpose"
              className="mt-4 inline-flex items-center justify-between text-xs font-semibold text-[#111214] hover:underline pt-2 border-t border-black/10"
            >
              <span>Repurpose Post</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Action 3 */}
          <div className="rounded-2xl border border-black/10 bg-white/70 p-4 flex flex-col justify-between hover:border-black/30 hover:bg-white transition shadow-xs">
            <div>
              <span className="rounded-full bg-black/5 text-[#111214] border border-black/10 px-2 py-0.5 text-[10px] font-mono">
                Retention Optimization
              </span>
              <h4 className="mt-2.5 text-xs font-bold text-[#111214]">Generate 6 Stronger Hooks</h4>
              <p className="mt-1 text-[11px] text-[#66686c]">
                Test curiosity gap, contrarian statements, and psychological pattern interrupts.
              </p>
            </div>
            <Link
              href="/dashboard/ai-studio"
              className="mt-4 inline-flex items-center justify-between text-xs font-semibold text-[#111214] hover:underline pt-2 border-t border-black/10"
            >
              <span>Generate Hooks</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Action 4 */}
          <div className="rounded-2xl border border-black/10 bg-white/70 p-4 flex flex-col justify-between hover:border-black/30 hover:bg-white transition shadow-xs">
            <div>
              <span className="rounded-full bg-black/5 text-[#111214] border border-black/10 px-2 py-0.5 text-[10px] font-mono">
                Idea Generation
              </span>
              <h4 className="mt-2.5 text-xs font-bold text-[#111214]">Discover 5 Viral Topics</h4>
              <p className="mt-1 text-[11px] text-[#66686c]">
                Brainstorm high-intent content themes based on your target audience profile.
              </p>
            </div>
            <Link
              href="/dashboard/ideas?generate=true"
              className="mt-4 inline-flex items-center justify-between text-xs font-semibold text-[#111214] hover:underline pt-2 border-t border-black/10"
            >
              <span>Brainstorm Topics</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Projects Section */}
      <div className="glass-card rounded-3xl p-6 border border-black/10 bg-white/60 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-[#111214]">Recent Projects</h3>
            <p className="text-xs text-[#66686c]">Active content productions across all channels</p>
          </div>
          <Link
            href="/dashboard/projects"
            className="text-xs text-[#111214] hover:underline font-semibold flex items-center gap-1 transition"
          >
            View All Projects <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {projects.length === 0 && !loading ? (
          <div className="text-center py-12 border border-dashed border-black/10 rounded-2xl bg-white/40">
            <Video className="mx-auto h-8 w-8 text-[#8a8b8e]" />
            <p className="mt-2 text-sm text-[#111214] font-semibold">No projects created yet</p>
            <p className="text-xs text-[#66686c] mt-1">Start by creating your first project or loading realistic demo data</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-[#111214] hover:bg-black/5 transition shadow-xs"
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
                className="group rounded-2xl border border-black/10 bg-white/70 p-4 hover:border-black/30 hover:bg-white transition flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[10px] font-semibold text-[#111214] border border-black/5">
                      {proj.platform}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold ${
                        proj.status === "PUBLISHED"
                          ? "bg-emerald-500/10 text-emerald-800 border border-emerald-500/20"
                          : proj.status === "RECORDING"
                          ? "bg-cyan-500/10 text-cyan-800 border border-cyan-500/20"
                          : proj.status === "EDITING"
                          ? "bg-purple-500/10 text-purple-800 border border-purple-500/20"
                          : "bg-black/5 text-[#111214] border border-black/5"
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#111214] group-hover:text-black transition line-clamp-1">
                    {proj.title}
                  </h4>
                  <p className="text-xs text-[#66686c] line-clamp-2">
                    {proj.description || "Video production workflow."}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-black/10 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#66686c]">
                    <span>Progress</span>
                    <span className="font-semibold text-[#111214]">{proj.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-black/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#111214] transition-all duration-300"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#66686c] pt-1">
                    <span>Deadline: {formatDate(proj.deadline)}</span>
                    <span className="text-[#111214] font-semibold group-hover:underline">Open Studio →</span>
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
