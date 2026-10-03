"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  Eye,
  MessageSquare,
  Share2,
  Loader2,
  Flame,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Plus,
  Upload,
  Trash2,
  Info,
  FileText,
  Video,
  Repeat,
  FolderGit2,
  Lock,
} from "lucide-react";
import { IAnalytics, IProject } from "@/models";

interface CreatorIntelligenceReport {
  overview: string;
  highPerformingTopics: string[];
  strongHooksPattern: string;
  weakPerformingFormats: string;
  recommendedExperiments: string[];
  nextBestAction: string;
}

interface ContentPipelineStats {
  ideasCount: number;
  ideasByStatus: { IDEA: number; PLANNED: number; IN_PRODUCTION: number; PUBLISHED: number };
  scriptsCount: number;
  clipsCount: number;
  clipsByStatus: { SUGGESTED: number; APPROVED: number; REJECTED: number };
  repurposedCount: number;
  repurposedByPlatform: Record<string, number>;
  projectsCount: number;
  projectsByStage: Record<string, number>;
  publishingStreak: number;
}

interface PlatformMetric {
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  count: number;
  percentage: number;
  engagement: number;
}

export default function AnalyticsDashboardPage() {
  const [records, setRecords] = useState<IAnalytics[]>([]);
  const [summary, setSummary] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    avgEngagement: 0,
    postsPublished: 0,
  });
  const [pipeline, setPipeline] = useState<ContentPipelineStats | null>(null);
  const [platformBreakdown, setPlatformBreakdown] = useState<PlatformMetric[]>([]);
  const [projects, setProjects] = useState<IProject[]>([]);

  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [intelligenceReport, setIntelligenceReport] = useState<CreatorIntelligenceReport | null>(null);

  // Form state for logging a post
  const [showLogForm, setShowLogForm] = useState(false);
  const [logPlatform, setLogPlatform] = useState("YouTube");
  const [logProjectId, setLogProjectId] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logViews, setLogViews] = useState("");
  const [logLikes, setLogLikes] = useState("");
  const [logComments, setLogComments] = useState("");
  const [logShares, setLogShares] = useState("");
  const [submittingPost, setSubmittingPost] = useState(false);
  const [postError, setPostError] = useState("");

  // CSV Import State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importingCsv, setImportingCsv] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const d = await res.json();
        setRecords(d.records || []);
        if (d.summary) setSummary(d.summary);
        if (d.pipeline) setPipeline(d.pipeline);
        if (d.platformBreakdown) setPlatformBreakdown(d.platformBreakdown);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => {
        if (d.projects) setProjects(d.projects);
      })
      .catch(() => {});
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

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError("");
    setSubmittingPost(true);

    try {
      const res = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: logPlatform,
          projectId: logProjectId || undefined,
          date: logDate,
          views: Number(logViews) || 0,
          likes: Number(logLikes) || 0,
          comments: Number(logComments) || 0,
          shares: Number(logShares) || 0,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to log post");
      }

      setShowLogForm(false);
      setLogViews("");
      setLogLikes("");
      setLogComments("");
      setLogShares("");
      setActionSuccessMsg("Performance entry saved!");
      setTimeout(() => setActionSuccessMsg(null), 3000);
      fetchAnalytics();
    } catch (err: unknown) {
      setPostError(err instanceof Error ? err.message : "Error saving post");
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Are you sure you want to delete this performance entry?")) return;
    try {
      const res = await fetch(`/api/analytics?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAnalytics();
      }
    } catch (e) {
      console.error("Delete record error:", e);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingCsv(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          alert("CSV is empty or missing data rows.");
          return;
        }

        // Expected format: Platform,Views,Likes,Comments,Shares,Date
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const platformIdx = headers.findIndex((h) => h.includes("platform"));
        const viewsIdx = headers.findIndex((h) => h.includes("view"));
        const likesIdx = headers.findIndex((h) => h.includes("like"));
        const commentsIdx = headers.findIndex((h) => h.includes("comment"));
        const sharesIdx = headers.findIndex((h) => h.includes("share"));
        const dateIdx = headers.findIndex((h) => h.includes("date"));

        const parsedRecords = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim());
          if (!cols[platformIdx >= 0 ? platformIdx : 0]) continue;

          parsedRecords.push({
            platform: platformIdx >= 0 ? cols[platformIdx] : cols[0],
            views: viewsIdx >= 0 ? Number(cols[viewsIdx]) || 0 : 0,
            likes: likesIdx >= 0 ? Number(cols[likesIdx]) || 0 : 0,
            comments: commentsIdx >= 0 ? Number(cols[commentsIdx]) || 0 : 0,
            shares: sharesIdx >= 0 ? Number(cols[sharesIdx]) || 0 : 0,
            date: dateIdx >= 0 && cols[dateIdx] ? cols[dateIdx] : new Date().toISOString(),
          });
        }

        if (parsedRecords.length === 0) {
          alert("No valid rows found in CSV.");
          return;
        }

        const res = await fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "import", records: parsedRecords }),
        });

        if (res.ok) {
          setActionSuccessMsg(`Imported ${parsedRecords.length} records successfully!`);
          setTimeout(() => setActionSuccessMsg(null), 3500);
          fetchAnalytics();
        } else {
          alert("Failed to import CSV records.");
        }
      } catch (err) {
        console.error("CSV parse error:", err);
        alert("Failed to parse CSV file. Ensure columns: Platform, Views, Likes, Comments, Shares, Date");
      } finally {
        setImportingCsv(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  // Compute maximum views among records for honest chart scaling
  const maxRecordViews = records.length > 0 ? Math.max(...records.map((r) => r.views || 0), 100) : 100;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          <span className="text-sm font-medium">Loading creator analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-200/60 shadow-xs">
              <BarChart3 className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Honest Creator Analytics
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Real pipeline telemetry calculated directly from your database, and self-reported post performance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleGenerateIntelligence}
            disabled={generatingReport}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition disabled:opacity-50"
          >
            {generatingReport ? (
              <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
            ) : (
              <Sparkles className="h-4 w-4 text-teal-400" />
            )}
            <span>{generatingReport ? "Analyzing with Gemini..." : "Run Creator Intelligence"}</span>
          </button>
        </div>
      </div>

      {/* Honest Transparency Label Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/60 p-4 shadow-xs">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 space-y-1">
          <p className="font-semibold text-slate-900">
            Self-Reported Performance Telemetry Notice
          </p>
          <p className="text-slate-600 leading-relaxed">
            Metrics are entered by you. Live platform connection (YouTube Analytics, Instagram Graph API) is planned.
            No numbers are simulated or faked. Content pipeline numbers are 100% real-time database queries.
          </p>
        </div>
      </div>

      {/* SECTION 1: CONTENT PIPELINE (ALWAYS REAL DATABASE TELEMETRY) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
              1
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Content Pipeline Telemetry (Real Database Stored Data)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Live Workspace Sync</span>
        </div>

        {/* Pipeline KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-semibold">Ideas in Backlog</span>
              <Lightbulb className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{pipeline?.ideasCount ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">
              {pipeline?.ideasByStatus.PUBLISHED ?? 0} published
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-semibold">Script Drafts</span>
              <FileText className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{pipeline?.scriptsCount ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">In library & projects</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-semibold">Short-Form Clips</span>
              <Video className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{pipeline?.clipsCount ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">
              {pipeline?.clipsByStatus.APPROVED ?? 0} approved
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-semibold">Repurposed Content</span>
              <Repeat className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{pipeline?.repurposedCount ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Across channels</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-semibold">Total Projects</span>
              <FolderGit2 className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{pipeline?.projectsCount ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Active workflows</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-semibold">Publishing Streak</span>
              <Flame className="h-4 w-4 text-rose-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">
              {pipeline?.publishingStreak ?? 0} {pipeline?.publishingStreak === 1 ? "Day" : "Days"}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Consecutive activity</p>
          </div>
        </div>

        {/* Pipeline Stage Breakdown Progress */}
        {pipeline && pipeline.projectsCount > 0 && (
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">Project Workflow Stage Distribution</span>
              <span className="text-slate-500 font-mono">{pipeline.projectsCount} Total Projects</span>
            </div>

            <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100 p-0.5">
              {Object.entries(pipeline.projectsByStage).map(([stage, count]) => {
                if (count === 0) return null;
                const pct = Math.round((count / pipeline.projectsCount) * 100);
                const colors: Record<string, string> = {
                  IDEA: "bg-slate-400",
                  SCRIPTING: "bg-blue-500",
                  RECORDING: "bg-amber-500",
                  EDITING: "bg-purple-500",
                  REPURPOSING: "bg-teal-500",
                  PUBLISHED: "bg-emerald-500",
                };
                return (
                  <div
                    key={stage}
                    className={`${colors[stage] || "bg-indigo-500"} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${stage}: ${count} (${pct}%)`}
                  />
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-600">
              {Object.entries(pipeline.projectsByStage).map(([stage, count]) => (
                <div key={stage} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span className="font-medium text-slate-800">{stage}:</span>
                  <span className="font-mono text-slate-500">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: PERFORMANCE (SELF-REPORTED) */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-50 text-teal-700 text-xs font-bold">
              2
            </span>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Performance Telemetry (Self-Reported Posts)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {actionSuccessMsg && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                {actionSuccessMsg}
              </span>
            )}

            {/* Hidden CSV File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCsvUpload}
              accept=".csv"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importingCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition disabled:opacity-50"
            >
              {importingCsv ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5 text-slate-500" />
              )}
              <span>Import CSV</span>
            </button>

            <button
              onClick={() => setShowLogForm((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
            >
              <Plus className="h-3.5 w-3.5 text-teal-400" />
              <span>{showLogForm ? "Close Form" : "Log Published Post"}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Log Entry Form */}
        {showLogForm && (
          <form
            onSubmit={handleLogSubmit}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-4 w-4 text-teal-600" />
                Log Published Post Metrics
              </h3>
              <span className="text-xs text-slate-500">Record views, likes and shares from your analytics</span>
            </div>

            {postError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
                {postError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Platform *</label>
                <select
                  value={logPlatform}
                  onChange={(e) => setLogPlatform(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
                >
                  <option value="YouTube">YouTube</option>
                  <option value="Instagram">Instagram</option>
                  <option value="TikTok">TikTok</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="X">X (Twitter)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Linked Project (Optional)
                </label>
                <select
                  value={logProjectId}
                  onChange={(e) => setLogProjectId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
                >
                  <option value="">No linked project</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title} ({p.platform})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Published Date *</label>
                <input
                  type="date"
                  required
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Views / Impressions</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={logViews}
                  onChange={(e) => setLogViews(e.target.value)}
                  placeholder="e.g. 15400"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Likes / Reactions</label>
                <input
                  type="number"
                  min="0"
                  value={logLikes}
                  onChange={(e) => setLogLikes(e.target.value)}
                  placeholder="e.g. 1240"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Comments</label>
                <input
                  type="number"
                  min="0"
                  value={logComments}
                  onChange={(e) => setLogComments(e.target.value)}
                  placeholder="e.g. 84"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shares / Reposts</label>
                <input
                  type="number"
                  min="0"
                  value={logShares}
                  onChange={(e) => setLogShares(e.target.value)}
                  placeholder="e.g. 210"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogForm(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingPost}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition disabled:opacity-50"
              >
                {submittingPost && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Save Post Entry</span>
              </button>
            </div>
          </form>
        )}

        {/* Self-Reported Metrics Grid (Computed strictly from stored records) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              label: "Logged Views",
              value: summary.totalViews.toLocaleString(),
              icon: Eye,
              color: "text-blue-600",
            },
            {
              label: "Logged Likes",
              value: summary.totalLikes.toLocaleString(),
              icon: Flame,
              color: "text-rose-500",
            },
            {
              label: "Comments",
              value: summary.totalComments.toLocaleString(),
              icon: MessageSquare,
              color: "text-purple-600",
            },
            {
              label: "Shares",
              value: summary.totalShares.toLocaleString(),
              icon: Share2,
              color: "text-emerald-600",
            },
            {
              label: "Avg Engagement",
              value: `${summary.avgEngagement}%`,
              icon: TrendingUp,
              color: "text-teal-600",
            },
            {
              label: "Posts Logged",
              value: summary.postsPublished,
              icon: CheckCircle2,
              color: "text-indigo-600",
            },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 flex flex-col justify-between shadow-xs"
              >
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-[11px] font-semibold">{m.label}</span>
                  <Icon className={`h-4 w-4 ${m.color}`} />
                </div>
                <p className="text-xl font-extrabold text-slate-900">{m.value}</p>
              </div>
            );
          })}
        </div>

        {/* Real Charts & Records Display */}
        {records.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-100">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No performance metrics logged yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Log metrics manually with &ldquo;Log Published Post&rdquo; or import a CSV file from YouTube Studio or Meta to view your real reach velocity and engagement rates.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setShowLogForm(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
              >
                <Plus className="h-3.5 w-3.5 text-teal-400" />
                <span>Log First Post</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Real Views Velocity Chart (Col 7) */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Logged Views Over Time</h3>
                  <p className="text-[11px] text-slate-500">
                    Real post viewership trajectory computed from stored records
                  </p>
                </div>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-mono font-semibold text-slate-700">
                  {records.length} {records.length === 1 ? "Post" : "Posts"}
                </span>
              </div>

              {/* Real Bar Chart Rendered from Stored Data */}
              <div className="h-52 flex items-end justify-between gap-2 pt-6 px-1 border-b border-slate-100 pb-2">
                {records.slice(0, 10).reverse().map((r, i) => {
                  const heightPercent = Math.max(12, Math.round(((r.views || 0) / maxRecordViews) * 100));
                  const dateLabel = r.date ? new Date(r.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : `#${i + 1}`;

                  return (
                    <div key={r._id || i} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <span className="opacity-0 group-hover:opacity-100 transition text-[9px] font-mono text-teal-700 font-bold whitespace-nowrap">
                        {(r.views || 0).toLocaleString()}
                      </span>
                      <div className="w-full bg-slate-100 rounded-t-lg h-36 flex items-end overflow-hidden">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-teal-600 via-indigo-600 to-indigo-400 transition-all group-hover:opacity-90"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono truncate max-w-[48px]">
                        {dateLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platform Reach Distribution from Real Records (Col 5) */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-6 space-y-5 shadow-xs flex flex-col justify-between">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Platform Reach Distribution</h3>
                <p className="text-[11px] text-slate-500">Calculated strictly from your logged posts</p>
              </div>

              <div className="space-y-3.5">
                {platformBreakdown.map((p) => {
                  const colors: Record<string, string> = {
                    YouTube: "bg-red-500",
                    Instagram: "bg-pink-500",
                    TikTok: "bg-cyan-500",
                    LinkedIn: "bg-blue-600",
                    X: "bg-slate-900",
                  };

                  return (
                    <div key={p.platform} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900">{p.platform}</span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          {p.views.toLocaleString()} views ({p.percentage}%) • {p.engagement}% eng
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colors[p.platform] || "bg-teal-500"}`}
                          style={{ width: `${p.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                📊 Total logged audience interactions:{" "}
                <strong className="text-slate-900">
                  {(summary.totalLikes + summary.totalComments + summary.totalShares).toLocaleString()}
                </strong>{" "}
                across {records.length} published posts.
              </div>
            </div>
          </div>
        )}

        {/* Telemetry Log Table */}
        {records.length > 0 && (
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Logged Post Performance Log ({records.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 text-slate-500 font-semibold bg-white">
                  <tr>
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Views</th>
                    <th className="px-4 py-3 text-right">Likes</th>
                    <th className="px-4 py-3 text-right">Comments</th>
                    <th className="px-4 py-3 text-right">Shares</th>
                    <th className="px-4 py-3 text-right">Engagement</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">{r.platform}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {r.date ? new Date(r.date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-900 font-medium">
                        {(r.views || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {(r.likes || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {(r.comments || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {(r.shares || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-teal-700">
                        {r.engagement || 0}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => r._id && handleDeleteRecord(r._id)}
                          className="text-slate-400 hover:text-rose-600 transition p-1"
                          title="Delete entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Disabled "Connect Accounts — Coming Soon" Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">
                Direct Social API Integration
              </h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-xl">
              Automated OAuth synchronization with YouTube Studio API, Meta Graph API (Instagram), and TikTok Creator API is currently in development.
            </p>
          </div>

          <button
            disabled
            className="cursor-not-allowed inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-400 shadow-none"
          >
            <span>Connect Accounts (Coming Soon)</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: CREATOR INTELLIGENCE (EXPLICITLY AI STRATEGY) */}
      <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 p-6 sm:p-7 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Creator Intelligence
                <span className="rounded-md bg-indigo-100 text-indigo-800 px-2 py-0.5 text-[10px] font-mono uppercase">
                  Gemini Audit
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Deep strategic observations synthesized from your content pipeline and telemetry
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
            ✨ AI-Generated Strategy (Distinct from telemetry)
          </span>
        </div>

        {intelligenceReport ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-indigo-100 bg-white p-4 text-xs sm:text-sm text-slate-800 leading-relaxed shadow-xs">
              <strong className="text-indigo-700">Executive Synthesis: </strong>
              {intelligenceReport.overview}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* High Performing */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-emerald-600" /> High-Performing Topics
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                  {intelligenceReport.highPerformingTopics.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>

              {/* Hook Analysis */}
              <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 space-y-2">
                <span className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4 text-teal-600" /> Strong Hook Patterns
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {intelligenceReport.strongHooksPattern}
                </p>
              </div>

              {/* Formats to Fix */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600" /> Underperforming Formats
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {intelligenceReport.weakPerformingFormats}
                </p>
              </div>
            </div>

            {/* Next Best Action */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-indigo-700">
                  Recommended Immediate High-Leverage Move
                </span>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5">
                  {intelligenceReport.nextBestAction}
                </p>
              </div>

              <Link
                href="/dashboard/video-intelligence"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shrink-0"
              >
                Execute Now →
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-indigo-200 rounded-xl space-y-3 bg-white/50">
            <p className="text-xs text-slate-500">
              Click below to generate Gemini algorithmic observations across your published projects and logged telemetry.
            </p>
            <button
              onClick={handleGenerateIntelligence}
              disabled={generatingReport}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50"
            >
              {generatingReport ? (
                <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
              ) : (
                <Sparkles className="h-4 w-4 text-teal-400" />
              )}
              <span>Run Intelligence Report</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
