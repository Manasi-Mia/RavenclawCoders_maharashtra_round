"use client";

import { useState, useEffect } from "react";
import {
  Video,
  Sparkles,
  Layers,
  FileText,
  Loader2,
  Scissors,
  ArrowRight,
  AlertCircle,
  Film,
  Info,
} from "lucide-react";
import { IProject, IScript, IClip, IAsset } from "@/models";
import { ClipCard } from "@/components/dashboard/ClipCard";
import Link from "next/link";

export default function VideoIntelligencePage() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [scripts, setScripts] = useState<IScript[]>([]);
  const [videoAssets, setVideoAssets] = useState<IAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedScriptId, setSelectedScriptId] = useState("");

  const [mode, setMode] = useState<"video" | "transcript">("video");
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
  const [analysisStep, setAnalysisStep] = useState("");
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isSampleData, setIsSampleData] = useState(false);

  const [clipCandidates, setClipCandidates] = useState<Partial<IClip>[]>([]);
  const [extractedTranscript, setExtractedTranscript] = useState<
    Array<{ start: number; end: number; text: string }>
  >([]);
  const [extractedScenes, setExtractedScenes] = useState<
    Array<{ start: number; end: number; description: string }>
  >([]);

  const [savedClips, setSavedClips] = useState<IClip[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => (r.ok ? r.json() : { projects: [] })),
      fetch("/api/scripts").then((r) => (r.ok ? r.json() : { scripts: [] })),
      fetch("/api/assets?type=video").then((r) => (r.ok ? r.json() : { assets: [] })),
      fetch("/api/clips").then((r) => (r.ok ? r.json() : { clips: [] })),
    ])
      .then(([pData, sData, aData, cData]) => {
        setProjects(pData.projects || []);
        if (pData.projects?.length > 0) setSelectedProjectId(pData.projects[0]._id);

        setScripts(sData.scripts || []);
        if (sData.scripts?.length > 0) setSelectedScriptId(sData.scripts[0]._id);

        const vids: IAsset[] = aData.assets || [];
        setVideoAssets(vids);
        if (vids.length > 0) setSelectedAssetId(vids[0]._id || "");

        setSavedClips(cData.clips || []);
      })
      .catch((err) => console.error("Error loading intelligence data:", err));
  }, []);

  const handleAnalyzeVideo = async () => {
    if (!selectedAssetId && mode === "video") {
      setAnalysisError("Please select an uploaded video asset first.");
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setIsSampleData(false);
    setClipCandidates([]);
    setExtractedTranscript([]);
    setExtractedScenes([]);

    const selectedScript = scripts.find((s) => s._id === selectedScriptId);

    try {
      if (mode === "video") {
        setAnalysisStep("1/4 Loading video footage from storage...");
        const stepTimer1 = setTimeout(
          () => setAnalysisStep("2/4 Uploading to Gemini Multimodal Engine..."),
          2500
        );
        const stepTimer2 = setTimeout(
          () => setAnalysisStep("3/4 Analyzing speech dialogue & visual scene transitions..."),
          7000
        );
        const stepTimer3 = setTimeout(
          () => setAnalysisStep("4/4 Generating viral hooks & 15-60s clip candidates..."),
          15000
        );

        const res = await fetch("/api/clips/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assetId: selectedAssetId,
            projectId: selectedProjectId || undefined,
            script: selectedScript ? selectedScript.content : undefined,
          }),
        });

        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        clearTimeout(stepTimer3);

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to analyze video footage");
        }

        if (Array.isArray(data.candidates)) {
          setClipCandidates(data.candidates);
        }
        if (Array.isArray(data.transcript)) {
          setExtractedTranscript(data.transcript);
        }
        if (Array.isArray(data.scenes)) {
          setExtractedScenes(data.scenes);
        }
        if (data.isSampleData) {
          setIsSampleData(true);
        }

        // Refresh clips
        const cRes = await fetch("/api/clips");
        if (cRes.ok) {
          const cd = await cRes.json();
          setSavedClips(cd.clips || []);
        }
      } else {
        // Fallback transcript mode
        setAnalysisStep("Analyzing transcript hooks and moments with Gemini...");
        const res = await fetch("/api/clips/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            script: selectedScript ? selectedScript.content : undefined,
            projectId: selectedProjectId || undefined,
            autoSave: true,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to analyze transcript");
        }

        if (Array.isArray(data.candidates)) {
          setClipCandidates(data.candidates);
        }
        if (data.isSampleData) {
          setIsSampleData(true);
        }

        // Refresh clips
        const cRes = await fetch("/api/clips");
        if (cRes.ok) {
          const cd = await cRes.json();
          setSavedClips(cd.clips || []);
        }
      }
    } catch (err: unknown) {
      console.error("Analysis Error:", err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during clip analysis.";
      setAnalysisError(msg);
    } finally {
      setAnalyzing(false);
      setAnalysisStep("");
    }
  };

  const handleUpdateClip = (updated: Partial<IClip>) => {
    setSavedClips((prev) =>
      prev.map((c) => (c._id === updated._id ? ({ ...c, ...updated } as IClip) : c))
    );
  };

  const handleDeleteClip = async (clipId: string) => {
    const res = await fetch(`/api/clips?id=${clipId}`, { method: "DELETE" });
    if (res.ok) {
      setSavedClips((prev) => prev.filter((c) => c._id !== clipId));
    }
  };

  const handleApproveClip = async (clipId: string) => {
    const res = await fetch("/api/clips", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: clipId, status: "APPROVED" }),
    });
    if (res.ok) {
      setSavedClips((prev) =>
        prev.map((c) => (c._id === clipId ? { ...c, status: "APPROVED" } : c))
      );
    }
  };

  const handleRejectClip = async (clipId: string) => {
    const res = await fetch("/api/clips", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: clipId, status: "REJECTED" }),
    });
    if (res.ok) {
      setSavedClips((prev) =>
        prev.map((c) => (c._id === clipId ? { ...c, status: "REJECTED" } : c))
      );
    }
  };

  const selectedAsset = videoAssets.find((a) => a._id === selectedAssetId);

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-black/10 bg-black/5 px-3 py-1 text-[11px] font-bold text-[#111214]">
              <Film className="h-3.5 w-3.5" />
              Multimodal Script-to-Video Engine
            </span>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
              Gemini 2.5 Flash
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#111214] sm:text-3xl">
            Video Intelligence & Clip Discovery
          </h1>
          <p className="mt-1 text-xs text-[#77797c] sm:text-sm">
            Scan raw footage and scripts simultaneously. Gemini extracts viral hooks, generates
            timestamped clips, and maps spoken sections to scripts.
          </p>
        </div>

        <Link
          href="/dashboard/studio"
          className="btn-primary flex items-center gap-2 self-start rounded-2xl px-4 py-2.5 text-xs font-bold shadow-md"
        >
          <Scissors className="h-4 w-4" />
          <span>Open Full Video Studio</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-black/10 pb-3">
        <button
          onClick={() => setMode("video")}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition ${
            mode === "video"
              ? "bg-[#111214] text-white shadow-md"
              : "border border-black/10 bg-white/50 text-[#77797c] hover:bg-white hover:text-[#111214]"
          }`}
        >
          <Video className="h-4 w-4" />
          Auto-Analyze Video Footage (Recommended)
        </button>
        <button
          onClick={() => setMode("transcript")}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition ${
            mode === "transcript"
              ? "bg-[#111214] text-white shadow-md"
              : "border border-black/10 bg-white/50 text-[#77797c] hover:bg-white hover:text-[#111214]"
          }`}
        >
          <FileText className="h-4 w-4" />
          Transcript Fallback Mode
        </button>
      </div>

      {/* Main Analysis Input Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Source Configuration */}
        <div className="space-y-5 rounded-3xl border border-white/80 bg-white/70 p-6 shadow-[0_12px_35px_rgba(20,20,20,.05)] backdrop-blur-xl">
          <h2 className="flex items-center gap-2 text-sm font-black tracking-tight text-[#111214]">
            <Layers className="h-4 w-4" />
            1. Source Asset & Project
          </h2>

          {/* Project Selector */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
              Target Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-[#111214] outline-none focus:border-black"
            >
              <option value="">No Project (Standalone Analysis)</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Script Match Selector */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
              Associated Script (Optional Reference)
            </label>
            <select
              value={selectedScriptId}
              onChange={(e) => setSelectedScriptId(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-[#111214] outline-none focus:border-black"
            >
              <option value="">None (Analyze Footage Independently)</option>
              {scripts.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {mode === "video" ? (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
                Choose Uploaded Video Asset
              </label>

              {videoAssets.length === 0 ? (
                <div className="mt-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                  <p className="text-xs font-semibold text-amber-900">
                    No video assets found in library.
                  </p>
                  <Link
                    href="/dashboard/assets"
                    className="btn-primary mt-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold"
                  >
                    Upload Video in Assets →
                  </Link>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <select
                    value={selectedAssetId}
                    onChange={(e) => setSelectedAssetId(e.target.value)}
                    className="w-full rounded-2xl border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-[#111214] outline-none focus:border-black"
                  >
                    {videoAssets.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.name} ({Math.round(v.size / (1024 * 1024))} MB)
                      </option>
                    ))}
                  </select>

                  {selectedAsset && (
                    <div className="mt-3 rounded-2xl border border-black/10 bg-black/[0.02] p-3 text-xs">
                      <p className="font-bold text-[#111214]">{selectedAsset.name}</p>
                      <p className="text-[11px] text-[#77797c]">
                        Size: {(selectedAsset.size / (1024 * 1024)).toFixed(1)} MB • Format:{" "}
                        {selectedAsset.mimeType || "video/mp4"}
                      </p>
                      {selectedAsset.size > 52428800 && (
                        <p className="mt-1 text-[11px] font-bold text-rose-600">
                          ⚠️ Exceeds 50 MB limit. Please trim this footage or use Transcript
                          Fallback mode.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
                Paste Spoken Transcript (Timestamped)
              </label>
              <textarea
                rows={6}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="00:00 - Opening hook...&#10;00:15 - Key point..."
                className="mt-1.5 w-full rounded-2xl border border-black/15 bg-white p-3 font-mono text-xs text-[#111214] outline-none focus:border-black"
              />
            </div>
          )}

          {/* Limit Notice Box */}
          <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-3 text-[11px] text-[#77797c]">
            <div className="flex items-center gap-1.5 font-bold text-[#111214]">
              <Info className="h-3.5 w-3.5 text-blue-600" />
              Processing Notice
            </div>
            <p className="mt-1">
              Auto-analysis processes videos up to <strong>50 MB / ~3 minutes</strong> via Gemini
              Files API. For longer recordings, trim before uploading or paste the transcript in
              fallback mode.
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={handleAnalyzeVideo}
            disabled={analyzing || (mode === "video" && !selectedAssetId)}
            className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold shadow-md transition disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing Footage...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Auto-Generate Viral Clips</span>
              </>
            )}
          </button>
        </div>

        {/* Right 2 Columns: Analysis Progress & Discovered Candidates */}
        <div className="space-y-6 lg:col-span-2">
          {/* Progress / Status banner */}
          {analyzing && (
            <div className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-[#111214]" />
                <div>
                  <h4 className="text-xs font-bold text-[#111214]">Gemini Multimodal Processing</h4>
                  <p className="text-xs text-[#77797c]">{analysisStep}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {analysisError && (
            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5 text-rose-900 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                <div>
                  <h4 className="text-xs font-bold">Analysis Failed</h4>
                  <p className="mt-0.5 text-xs text-rose-800">{analysisError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Sample Data Badge (Demo Mode) */}
          {isSampleData && (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-900">
              <Sparkles className="h-4 w-4 text-amber-700" />
              <span>
                Demonstration Mode: Showing realistic AI-generated sample clips based on the 48-Hour
                AI App framework.
              </span>
            </div>
          )}

          {/* Discovered Clips Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black tracking-tight text-[#111214]">
                Discovered Clip Candidates ({clipCandidates.length})
              </h2>
              <p className="text-xs text-[#77797c]">
                Review, watch, edit, and approve clips before opening in the Video Studio.
              </p>
            </div>
          </div>

          {clipCandidates.length === 0 && !analyzing ? (
            <div className="rounded-3xl border border-black/10 bg-white/40 p-10 text-center backdrop-blur-md">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-black/5 text-[#77797c]">
                <Film className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-[#111214]">No Clips Discovered Yet</h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-[#77797c]">
                Pick an uploaded video from your assets or paste a transcript to extract 4-6
                high-retention short-form clips.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {clipCandidates.map((candidate, idx) => (
                <ClipCard
                  key={idx}
                  clip={{
                    ...candidate,
                    title: candidate.title || `Clip #${idx + 1}`,
                    startTime: candidate.startTime || 0,
                    endTime: candidate.endTime || 30,
                    assetId: selectedAssetId,
                  }}
                  assetUrl={selectedAssetId ? `/api/assets/file/${selectedAssetId}` : ""}
                  onApprove={(id) => handleApproveClip(id)}
                  onReject={(id) => handleRejectClip(id)}
                  onDelete={() =>
                    setClipCandidates((prev) => prev.filter((_, cIdx) => cIdx !== idx))
                  }
                />
              ))}
            </div>
          )}

          {/* Extracted Transcript & Visual Scenes Accordion */}
          {(extractedTranscript.length > 0 || extractedScenes.length > 0) && (
            <div className="space-y-4 rounded-3xl border border-white/80 bg-white/70 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#111214]">
                Multimodal Analysis Insights from Footage
              </h3>

              {extractedScenes.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#77797c]">
                    Visual Scene Segmentation ({extractedScenes.length} scenes)
                  </h4>
                  <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-2">
                    {extractedScenes.map((s, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex items-start gap-2.5 rounded-xl border border-black/5 bg-black/[0.02] p-2 text-xs"
                      >
                        <span className="shrink-0 font-mono font-bold text-[#111214]">
                          {Math.floor(s.start / 60)}:
                          {String(Math.floor(s.start % 60)).padStart(2, "0")} -{" "}
                          {Math.floor(s.end / 60)}:
                          {String(Math.floor(s.end % 60)).padStart(2, "0")}
                        </span>
                        <span className="text-[#44464a]">{s.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {extractedTranscript.length > 0 && (
                <div className="pt-3 border-t border-black/10">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#77797c]">
                    Timestamped Dialogue Transcript
                  </h4>
                  <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-2">
                    {extractedTranscript.map((t, tIdx) => (
                      <div
                        key={tIdx}
                        className="flex items-start gap-2.5 rounded-xl border border-black/5 bg-black/[0.02] p-2 text-xs"
                      >
                        <span className="shrink-0 font-mono font-bold text-[#111214]">
                          {Math.floor(t.start / 60)}:
                          {String(Math.floor(t.start % 60)).padStart(2, "0")} -{" "}
                          {Math.floor(t.end / 60)}:
                          {String(Math.floor(t.end % 60)).padStart(2, "0")}
                        </span>
                        <span className="text-[#44464a]">{t.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active Saved Clips Library */}
      {savedClips.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-black/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black tracking-tight text-[#111214]">
                Saved Clips Library ({savedClips.length})
              </h2>
              <p className="text-xs text-[#77797c]">
                All clips saved across projects, ready for fine-tuning in the Video Studio.
              </p>
            </div>
            <Link
              href="/dashboard/studio"
              className="btn-secondary rounded-xl px-3 py-1.5 text-xs font-bold"
            >
              Open Studio →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedClips.map((clip) => (
              <ClipCard
                key={clip._id}
                clip={clip}
                onUpdate={handleUpdateClip}
                onDelete={handleDeleteClip}
                onApprove={handleApproveClip}
                onReject={handleRejectClip}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
