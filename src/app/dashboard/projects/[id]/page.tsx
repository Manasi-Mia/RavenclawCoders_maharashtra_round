"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  FolderOpen,
  FileText,
  Video,
  Sparkles,
  Play,
  Share2,
  BarChart3,
  Layers,
  ArrowLeft,
  Clock,
  Check,
  Save,
  Loader2,
  Plus,
  ExternalLink,
  Flame,
  Copy,
  ChevronRight,
} from "lucide-react";
import { IProject, IScript, IAsset, IClip, IRepurposedContent, IAnalytics } from "@/models";
import { formatDate, formatDuration, estimateSpeakingTime } from "@/lib/utils";

export default function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [project, setProject] = useState<IProject | null>(null);
  const [scripts, setScripts] = useState<IScript[]>([]);
  const [assets, setAssets] = useState<IAsset[]>([]);
  const [clips, setClips] = useState<IClip[]>([]);
  const [repurposed, setRepurposed] = useState<IRepurposedContent[]>([]);
  const [analytics, setAnalytics] = useState<IAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab State: "overview" | "script" | "assets" | "ai" | "clips" | "repurpose" | "analytics"
  const [activeTab, setActiveTab] = useState<
    "overview" | "script" | "assets" | "ai" | "clips" | "repurpose" | "analytics"
  >("overview");

  // Editable fields in overview
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<IProject["status"]>("IDEA");
  const [progress, setProgress] = useState(0);
  const [description, setDescription] = useState("");
  const [savingOverview, setSavingOverview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Script tab state
  const [activeScript, setActiveScript] = useState<IScript | null>(null);
  const [scriptContent, setScriptContent] = useState("");
  const [savingScript, setSavingScript] = useState(false);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const d = await res.json();
        setProject(d.project);
        setTitle(d.project.title || "");
        setStatus(d.project.status || "IDEA");
        setProgress(d.project.progress || 0);
        setDescription(d.project.description || "");

        setScripts(d.scripts || []);
        if (d.scripts && d.scripts.length > 0) {
          setActiveScript(d.scripts[0]);
          setScriptContent(d.scripts[0].content || "");
        }

        setAssets(d.assets || []);
        setClips(d.clips || []);
        setRepurposed(d.repurposed || []);
        setAnalytics(d.analytics || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const handleSaveOverview = async () => {
    setSavingOverview(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          status,
          progress,
          description,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } finally {
      setSavingOverview(false);
    }
  };

  const handleSaveScript = async () => {
    if (!activeScript) return;
    setSavingScript(true);
    try {
      await fetch(`/api/scripts/${activeScript._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: scriptContent,
        }),
      });
    } finally {
      setSavingScript(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-slate-400">Project not found</p>
        <Link href="/dashboard/projects" className="mt-3 inline-block text-xs text-indigo-400">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  const scriptStats = estimateSpeakingTime(scriptContent);

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/projects"
            className="rounded-xl border border-white/10 p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Link href="/dashboard/projects" className="hover:text-slate-200">
                Projects
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white truncate max-w-sm">{project.title}</span>
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight mt-0.5">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 text-xs font-semibold">
            {project.platform}
          </span>
          <span
            className={`rounded px-2.5 py-1 text-xs font-mono font-semibold ${
              status === "PUBLISHED"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : status === "RECORDING"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "bg-white/10 text-slate-200"
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Connected Lifecycle Banner */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex items-center justify-between overflow-x-auto text-xs font-mono text-slate-400 no-scrollbar gap-4">
        <span className="text-cyan-400 shrink-0 flex items-center gap-1 font-semibold">
          <Layers className="h-3.5 w-3.5" /> Connected Engine:
        </span>
        <span className="shrink-0 text-white">Idea ✓</span>
        <span className="shrink-0 text-indigo-400">→ {scripts.length} Script</span>
        <span className="shrink-0 text-purple-400">→ {assets.length} Assets</span>
        <span className="shrink-0 text-cyan-400">→ {clips.length} Clips</span>
        <span className="shrink-0 text-emerald-400">→ {repurposed.length} Repurposed</span>
        <span className="shrink-0 text-pink-400">→ Analytics</span>
      </div>

      {/* 7 Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.08] overflow-x-auto no-scrollbar">
        {[
          { id: "overview", label: "Overview", icon: Layers },
          { id: "script", label: `Script (${scripts.length})`, icon: FileText },
          { id: "assets", label: `Assets (${assets.length})`, icon: FolderOpen },
          { id: "ai", label: "AI Generations", icon: Sparkles },
          { id: "clips", label: `Clips (${clips.length})`, icon: Play },
          { id: "repurpose", label: `Repurposed (${repurposed.length})`, icon: Share2 },
          { id: "analytics", label: "Analytics", icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                isActive
                  ? "border-cyan-400 text-cyan-300 bg-white/[0.03]"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.01]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-[#0d121f]/90 p-6 space-y-5 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/[0.08] pb-3">
              Project Specification
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project Name</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description / Goal</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs sm:text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Workflow Stage</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as IProject["status"])}
                    className="w-full rounded-xl border border-white/10 bg-[#090d16] px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="IDEA">Idea</option>
                    <option value="PLANNED">Planned</option>
                    <option value="RECORDING">Recording</option>
                    <option value="EDITING">Editing</option>
                    <option value="READY">Ready</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Completion Progress: {progress}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full mt-2 accent-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Audience Profile</label>
                <p className="text-xs text-slate-300 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                  {project.targetAudience || "General tech and productivity creators."}
                </p>
              </div>

              <div className="flex justify-end pt-3 border-t border-white/[0.08]">
                <button
                  onClick={handleSaveOverview}
                  disabled={savingOverview}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:opacity-95 transition disabled:opacity-50"
                >
                  {savingOverview ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : saveSuccess ? (
                    <Check className="h-4 w-4 text-emerald-300" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{saveSuccess ? "Changes Saved!" : "Save Overview"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-[#0d121f]/90 p-6 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.08] pb-3">
              Production Metadata
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400">Created:</span>
                <p className="font-semibold text-white mt-0.5">{formatDate(project.createdAt)}</p>
              </div>
              <div>
                <span className="text-slate-400">Target Deadline:</span>
                <p className="font-semibold text-white mt-0.5">{formatDate(project.deadline)}</p>
              </div>
              <div>
                <span className="text-slate-400">Primary Channel:</span>
                <p className="font-semibold text-cyan-400 mt-0.5">{project.platform}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Quick Action</span>
              <button
                onClick={() => setActiveTab("script")}
                className="w-full text-center rounded-xl bg-white/[0.04] border border-white/10 py-2 text-xs font-semibold text-cyan-300 hover:bg-white/[0.08] transition"
              >
                Go to Script Editor →
              </button>
              <button
                onClick={() => setActiveTab("clips")}
                className="w-full text-center rounded-xl bg-white/[0.04] border border-white/10 py-2 text-xs font-semibold text-purple-300 hover:bg-white/[0.08] transition"
              >
                View Discovered Clips →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: SCRIPT */}
      {activeTab === "script" && (
        <div className="rounded-2xl border border-white/10 bg-[#0d121f]/90 p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  {activeScript ? activeScript.title : "Project Script"}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {scriptStats.words} words • ~{scriptStats.formatted} speaking delivery
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveScript}
                disabled={savingScript}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50"
              >
                {savingScript ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                <span>Save Script</span>
              </button>
            </div>
          </div>

          <textarea
            rows={18}
            value={scriptContent}
            onChange={(e) => setScriptContent(e.target.value)}
            placeholder="Write or paste your script here..."
            className="w-full bg-black/40 rounded-xl border border-white/10 p-4 font-mono text-xs sm:text-sm text-slate-100 leading-relaxed focus:border-indigo-500 focus:outline-none"
          />
        </div>
      )}

      {/* Tab 3: ASSETS */}
      {activeTab === "assets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Files Linked to This Project</h3>
            <Link
              href="/dashboard/assets"
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Manage in Asset Library</span> <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {assets.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-white/10">
              <FolderOpen className="mx-auto h-8 w-8 text-slate-500" />
              <p className="mt-2 text-xs text-slate-400">No assets linked to this project yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {assets.map((asset) => (
                <div
                  key={asset._id}
                  className="rounded-xl border border-white/10 bg-[#0d121f]/90 p-4 space-y-2"
                >
                  <div className="h-28 rounded-lg overflow-hidden bg-black/50 flex items-center justify-center">
                    {asset.type === "image" || asset.type === "thumbnail" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" />
                    ) : (
                      <Video className="h-8 w-8 text-cyan-400" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{asset.name}</h4>
                  <span className="text-[10px] uppercase font-mono text-slate-400">{asset.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: AI GENERATIONS */}
      {activeTab === "ai" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#0d121f]/90 p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
              <Flame className="h-4 w-4 text-amber-400" />
              Stored AI Hooks for this Project
            </h3>
            {activeScript?.hooks && activeScript.hooks.length > 0 ? (
              <div className="space-y-2">
                {activeScript.hooks.map((h, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-200 flex items-center justify-between"
                  >
                    <span>&ldquo;{h}&rdquo;</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(h)}
                      className="text-slate-400 hover:text-white p-1"
                      title="Copy hook"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No hooks generated yet. Head to AI Studio to craft viral angles.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: CLIPS */}
      {activeTab === "clips" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Discovered Short-Form Clips ({clips.length})</h3>
            <Link
              href="/dashboard/video-intelligence"
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Discover New Clips with AI</span> <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {clips.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-white/10">
              <Play className="mx-auto h-8 w-8 text-slate-500" />
              <p className="mt-2 text-xs text-slate-400">No clips discovered for this video yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clips.map((clip) => (
                <div
                  key={clip._id}
                  className="rounded-2xl border border-white/10 bg-[#0d121f]/90 p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-indigo-500/20 text-cyan-300 px-2 py-0.5 text-[10px] font-mono">
                      {formatDuration(clip.startTime)} → {formatDuration(clip.endTime)}
                    </span>
                    <span className="rounded bg-purple-500/20 text-purple-300 px-2 py-0.5 text-[10px]">
                      {clip.platform}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{clip.title}</h4>
                  <p className="text-xs text-slate-300 font-mono bg-black/40 p-2.5 rounded border border-white/5">
                    &ldquo;{clip.hook}&rdquo;
                  </p>
                  <p className="text-[11px] text-slate-400">{clip.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: REPURPOSED */}
      {activeTab === "repurpose" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Platform Adaptations ({repurposed.length})</h3>
            <Link
              href="/dashboard/repurpose"
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Open Repurpose Studio</span> <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {repurposed.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-white/10">
              <Share2 className="mx-auto h-8 w-8 text-slate-500" />
              <p className="mt-2 text-xs text-slate-400">No repurposed platform versions saved yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {repurposed.map((rep) => (
                <div
                  key={rep._id}
                  className="rounded-2xl border border-white/10 bg-[#0d121f]/90 p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-mono font-semibold">
                      {rep.platform}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDate(rep.createdAt)}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white">{rep.title || `${rep.platform} Adaptation`}</h4>
                  <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap bg-black/40 p-3 rounded-xl border border-white/5 max-h-48 overflow-y-auto">
                    {rep.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 7: ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#0d121f]/90 p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white border-b border-white/[0.08] pb-3">
              Performance Snapshot
            </h3>

            {analytics.length === 0 ? (
              <p className="text-xs text-slate-400">
                Publish this video to sync live views, retention metrics, and engagement telemetry.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[11px] text-slate-400">Views</span>
                  <p className="text-xl font-bold text-white">
                    {analytics.reduce((a, b) => a + (b.views || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[11px] text-slate-400">Likes</span>
                  <p className="text-xl font-bold text-pink-400">
                    {analytics.reduce((a, b) => a + (b.likes || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[11px] text-slate-400">Comments</span>
                  <p className="text-xl font-bold text-purple-400">
                    {analytics.reduce((a, b) => a + (b.comments || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[11px] text-slate-400">Avg Engagement</span>
                  <p className="text-xl font-bold text-emerald-400">11.3%</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
