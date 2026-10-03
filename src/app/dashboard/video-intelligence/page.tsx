"use client";

import { useState, useEffect } from "react";
import {
  Video,
  Sparkles,
  Play,
  Clock,
  Layers,
  FileText,
  Share2,
  Check,
  Plus,
  Loader2,
  ShieldCheck,
  Film,
  Scissors,
  ArrowRight,
} from "lucide-react";
import { IProject, IScript, IClip } from "@/models";
import { formatDuration } from "@/lib/utils";

export default function VideoIntelligencePage() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [scripts, setScripts] = useState<IScript[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedScriptId, setSelectedScriptId] = useState("");
  const [transcript, setTranscript] = useState(
    `00:00 - What if you didn't need 6 months and a team of 5 to validate an app idea?
00:14 - 90% of developers spend 6 months building an MVP nobody wants. Stop doing that.
00:28 - Last weekend, I gave myself a strict 48-hour sprint to ship an AI SaaS from scratch.
00:45 - The core secret: Serverless API routes and enforced structured JSON with Google Gemini.
01:02 - If you are configuring Kubernetes before your first paying user, you are procrastinating.
01:25 - Here is how I eliminated prompt hallucinations before they ever reached the frontend.
01:50 - We shared the real-time commit logs on X and LinkedIn, driving our first 500 signups.
02:15 - If this framework was useful, hit like, subscribe, and grab the open-source repo in description.`
  );

  const [analyzing, setAnalyzing] = useState(false);
  const [clipCandidates, setClipCandidates] = useState<
    Array<{
      title: string;
      startTime: number;
      endTime: number;
      hook: string;
      caption: string;
      platform: "Instagram Reels" | "YouTube Shorts" | "TikTok" | "LinkedIn";
      reason: string;
      matchedScriptSection: string;
    }>
  >([]);

  const [createdClipIds, setCreatedClipIds] = useState<string[]>([]);
  const [savedClips, setSavedClips] = useState<IClip[]>([]);

  useEffect(() => {
    Promise.all([fetch("/api/projects"), fetch("/api/scripts"), fetch("/api/clips")])
      .then(async ([pRes, sRes, cRes]) => {
        if (pRes.ok) {
          const pd = await pRes.json();
          setProjects(pd.projects || []);
          if (pd.projects.length > 0) setSelectedProjectId(pd.projects[0]._id);
        }
        if (sRes.ok) {
          const sd = await sRes.json();
          setScripts(sd.scripts || []);
          if (sd.scripts.length > 0) setSelectedScriptId(sd.scripts[0]._id);
        }
        if (cRes.ok) {
          const cd = await cRes.json();
          setSavedClips(cd.clips || []);
        }
      })
      .catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    if (!transcript.trim()) return;
    setAnalyzing(true);
    setClipCandidates([]);

    const selectedScript = scripts.find((s) => s._id === selectedScriptId);

    try {
      const res = await fetch("/api/clips/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          script: selectedScript ? selectedScript.content : undefined,
          projectId: selectedProjectId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && Array.isArray(data.candidates)) {
        setClipCandidates(data.candidates);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreateClip = async (candidate: (typeof clipCandidates)[0], idx: number) => {
    try {
      const res = await fetch("/api/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId || undefined,
          title: candidate.title,
          startTime: candidate.startTime,
          endTime: candidate.endTime,
          hook: candidate.hook,
          caption: candidate.caption,
          platform: candidate.platform,
          reason: candidate.reason,
          matchedScriptSection: candidate.matchedScriptSection,
          status: "READY",
        }),
      });

      const data = await res.json();
      if (res.ok && data.clip) {
        setCreatedClipIds((prev) => [...prev, String(idx)]);
        setSavedClips((prev) => [data.clip, ...prev]);
      }
    } catch (e) {
      console.error("Create clip error:", e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Video className="h-6 w-6 text-cyan-400" />
            Video Intelligence & Short-Form Discovery
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Correlate video transcripts with written scripts to discover viral short-form clip boundaries with AI.
          </p>
        </div>

        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs text-cyan-300 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          <span>Non-destructive AI timestamp recommendations</span>
        </div>
      </div>

      {/* Input Selection Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-[#0d121f]/90 p-5">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Associated Project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#090d16] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title} ({p.platform})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Reference Script (For Keyword Matching)</label>
          <select
            value={selectedScriptId}
            onChange={(e) => setSelectedScriptId(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#090d16] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            {scripts.map((s) => (
              <option key={s._id} value={s._id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2-Column Workflow: Transcript Input vs Clip Candidates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Video Transcript / Footage Timeline */}
        <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-[#0d121f]/90 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Film className="h-4 w-4 text-indigo-400" />
              Raw Footage Transcript & Timeline
            </span>
            <span className="text-[11px] font-mono text-cyan-400">Timestamped</span>
          </div>

          <p className="text-xs text-slate-400 leading-normal">
            Paste or edit the transcript of your long-form footage with time markers:
          </p>

          <textarea
            rows={14}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs text-slate-200 leading-relaxed focus:border-indigo-500 focus:outline-none"
          />

          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Gemini is analyzing speech retention & hooks...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Analyze Transcript for Clip Candidates</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Clip Candidates */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Scissors className="h-4 w-4 text-purple-400" />
              Identified Clip Candidates ({clipCandidates.length})
            </h3>
            <span className="text-xs text-slate-400">Recommends start/end cuts</span>
          </div>

          {clipCandidates.length === 0 && !analyzing ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d121f]/50 p-12 text-center">
              <Scissors className="mx-auto h-10 w-10 text-slate-600" />
              <h4 className="mt-3 text-sm font-bold text-white">No Analysis Run Yet</h4>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                Click &ldquo;Analyze Transcript for Clip Candidates&rdquo; to have Gemini detect high-retention 30-60 second clips.
              </p>
              <button
                onClick={handleAnalyze}
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-indigo-500/20 transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Run Discovery on Sample Transcript
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {clipCandidates.map((candidate, idx) => {
                const isCreated = createdClipIds.includes(String(idx));
                const duration = candidate.endTime - candidate.startTime;

                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/10 bg-[#0d121f]/90 p-5 space-y-3 hover:border-indigo-500/40 transition shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-mono text-cyan-300 font-semibold">
                          {formatDuration(candidate.startTime)} → {formatDuration(candidate.endTime)} ({duration}s)
                        </span>
                        <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                          {candidate.platform}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCreateClip(candidate, idx)}
                        disabled={isCreated}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                          isCreated
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                        }`}
                      >
                        {isCreated ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Clip Saved
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" /> Create Clip
                          </>
                        )}
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-white">{candidate.title}</h4>

                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-1.5">
                      <span className="text-[10px] uppercase font-mono text-indigo-400">Suggested Hook</span>
                      <p className="text-xs text-slate-200 font-mono leading-relaxed">&ldquo;{candidate.hook}&rdquo;</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Why Selected (AI Analysis):</span>
                        <p className="text-slate-300 text-[11px] mt-0.5">{candidate.reason}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Matched Script Section:</span>
                        <p className="text-cyan-300 text-[11px] font-mono mt-0.5">{candidate.matchedScriptSection}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active Saved Clips Library */}
          {savedClips.length > 0 && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-[#0d121f]/90 p-5 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.08] pb-2.5">
                <Play className="h-3.5 w-3.5 text-cyan-400" />
                Active Saved Clips in Library ({savedClips.length})
              </h4>
              <div className="space-y-2">
                {savedClips.slice(0, 4).map((c) => (
                  <div
                    key={c._id}
                    className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/[0.02] border border-white/5"
                  >
                    <div>
                      <p className="font-semibold text-white">{c.title}</p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDuration(c.startTime)} - {formatDuration(c.endTime)} • {c.platform}
                      </span>
                    </div>
                    <span className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-mono font-semibold">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
