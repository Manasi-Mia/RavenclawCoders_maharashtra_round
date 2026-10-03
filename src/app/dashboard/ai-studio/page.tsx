"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Wand2,
  Sparkles,
  Copy,
  Check,
  Save,
  RotateCw,
  Clock,
  Layers,
  FileText,
  Bookmark,
  Share2,
  Loader2,
  ArrowRight,
  Flame,
} from "lucide-react";
import { IProject } from "@/models";
import { estimateSpeakingTime } from "@/lib/utils";

export default function AIStudioPage() {
  const router = useRouter();

  // Inputs
  const [topic, setTopic] = useState("How I Built My First AI App in 48 Hours");
  const [targetAudience, setTargetAudience] = useState("Software developers & indie hackers");
  const [platform, setPlatform] = useState("YouTube");
  const [tone, setTone] = useState("High energy, actionable, authoritative");
  const [duration, setDuration] = useState("3-5 minutes");
  const [contentType, setContentType] = useState("YouTube video");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projects, setProjects] = useState<IProject[]>([]);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedScript, setGeneratedScript] = useState("");
  const [generatedHooks, setGeneratedHooks] = useState<string[]>([]);
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([]);

  // UI state
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savingToProject, setSavingToProject] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => {
        if (d.projects) {
          setProjects(d.projects);
          if (d.projects.length > 0) {
            setSelectedProjectId(d.projects[0]._id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setGenerating(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          targetAudience,
          platform,
          tone,
          duration,
          contentType,
        }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        setGeneratedTitle(json.data.title || topic);
        setGeneratedScript(json.data.script || "");
        setGeneratedHooks(json.data.hooks || []);
        setGeneratedTitles(json.data.titles || []);
        setGeneratedCaptions(json.data.captions || []);
        setGeneratedHashtags(json.data.hashtags || []);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleSaveToProject = async () => {
    if (!generatedScript.trim()) return;
    setSavingToProject(true);

    try {
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generatedTitle || topic,
          content: generatedScript,
          hooks: generatedHooks,
          titles: generatedTitles,
          captions: generatedCaptions,
          tone,
          platform,
          projectId: selectedProjectId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.script?._id) {
        setSavedSuccess(true);
        setTimeout(() => {
          router.push(`/dashboard/scripts/${data.script._id}`);
        }, 1000);
      }
    } finally {
      setSavingToProject(false);
    }
  };

  const stats = estimateSpeakingTime(generatedScript);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Wand2 className="h-6 w-6 text-purple-400" />
            AI Script & Hook Studio
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Generate high-retention video scripts, multi-angle psychological hooks, and CTR-optimized titles with Google Gemini.
          </p>
        </div>

        {generatedScript && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleGenerate()}
              disabled={generating}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition disabled:opacity-50"
            >
              <RotateCw className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
              <span>Regenerate</span>
            </button>

            <button
              onClick={handleSaveToProject}
              disabled={savingToProject}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:opacity-95 transition disabled:opacity-50"
            >
              {savingToProject ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : savedSuccess ? (
                <Check className="h-3.5 w-3.5 text-emerald-300" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>{savedSuccess ? "Saved! Opening..." : "Save to Project"}</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Generation Form */}
        <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-[#0d121f]/90 p-5 sm:p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            Script Blueprint Inputs
          </h2>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Topic or Concept</label>
              <textarea
                rows={2}
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. How to Build an AI App with Next.js & Gemini"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Audience</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Solo devs, tech founders"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#090d16] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="YouTube">YouTube</option>
                  <option value="Instagram">Instagram Reel</option>
                  <option value="TikTok">TikTok</option>
                  <option value="LinkedIn">LinkedIn</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#090d16] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="60 seconds">60 Seconds</option>
                  <option value="2 minutes">2 Minutes</option>
                  <option value="3-5 minutes">3-5 Minutes</option>
                  <option value="10 minutes">10 Minutes</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tone & Pacing</label>
                <input
                  type="text"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="e.g. Fast, energetic, contrarian"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Content Type</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#090d16] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="YouTube video">YouTube video</option>
                  <option value="YouTube Short">YouTube Short</option>
                  <option value="Instagram Reel">Instagram Reel</option>
                  <option value="Educational video">Educational video</option>
                  <option value="Podcast episode">Podcast episode</option>
                </select>
              </div>
            </div>

            {projects.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assign to Project (Optional)</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#090d16] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">No linked project</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title} ({p.platform})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Gemini is generating complete script & hooks...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Full Script & Hooks</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Output Area */}
        <div className="lg:col-span-8 space-y-6">
          {!generatedScript && !generating ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d121f]/50 p-12 text-center">
              <Wand2 className="mx-auto h-10 w-10 text-purple-400/50" />
              <h3 className="mt-3 text-base font-bold text-white">Your Script Canvas Awaits</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
                Fill out your topic parameters on the left and click &ldquo;Generate Full Script & Hooks&rdquo; to create a multi-section script with scene directions.
              </p>
              <button
                onClick={() => handleGenerate()}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/10 px-5 py-2 text-xs font-semibold text-cyan-300 hover:bg-white/[0.08] transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Quick-Generate Sample Script</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Script Title & Metrics Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0d121f]/90 p-4">
                <div>
                  <span className="text-[10px] uppercase font-mono text-cyan-400">Selected Title</span>
                  <input
                    type="text"
                    value={generatedTitle}
                    onChange={(e) => setGeneratedTitle(e.target.value)}
                    className="block w-full bg-transparent text-sm sm:text-base font-bold text-white border-b border-transparent hover:border-white/20 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-indigo-400" />
                    {stats.words} words
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    ~{stats.formatted} speaking
                  </span>
                </div>
              </div>

              {/* Editable Master Script Editor */}
              <div className="rounded-2xl border border-white/10 bg-[#0d121f]/90 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <span className="text-xs font-semibold text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-400" /> Master Video Script (Fully Editable)
                  </span>
                  <button
                    onClick={() => handleCopy(generatedScript, "script")}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
                  >
                    {copiedSection === "script" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedSection === "script" ? "Copied" : "Copy Script"}</span>
                  </button>
                </div>

                <textarea
                  rows={14}
                  value={generatedScript}
                  onChange={(e) => setGeneratedScript(e.target.value)}
                  className="w-full bg-transparent font-mono text-xs sm:text-sm text-slate-200 leading-relaxed focus:outline-none resize-y"
                  placeholder="Your script will appear here..."
                />
              </div>

              {/* 5-10 Alternative Hooks Showcase */}
              {generatedHooks.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-[#0d121f]/90 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <span className="text-xs font-semibold text-white flex items-center gap-2">
                      <Flame className="h-4 w-4 text-amber-400" /> 6 Alternative Hooks (Psychological Angles)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Curiosity • Contrarian • Metrics</span>
                  </div>

                  <div className="space-y-2.5">
                    {generatedHooks.map((h, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex items-start justify-between gap-3 hover:border-indigo-500/30 transition group"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-mono text-cyan-300 shrink-0">
                            #{i + 1}
                          </span>
                          <p className="text-xs text-slate-200 leading-relaxed">{h}</p>
                        </div>
                        <button
                          onClick={() => handleCopy(h, `hook-${i}`)}
                          className="text-slate-500 hover:text-white transition shrink-0"
                          title="Copy hook"
                        >
                          {copiedSection === `hook-${i}` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Titles, Captions, Hashtags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Titles */}
                {generatedTitles.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-[#0d121f]/90 p-5 space-y-3">
                    <span className="text-xs font-semibold text-white flex items-center gap-2 border-b border-white/[0.08] pb-2">
                      <Bookmark className="h-4 w-4 text-cyan-400" /> High-CTR Titles
                    </span>
                    <ul className="space-y-2">
                      {generatedTitles.map((t, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between text-xs text-slate-300 p-2 rounded-lg bg-white/[0.02] border border-white/5"
                        >
                          <span>{t}</span>
                          <button
                            onClick={() => handleCopy(t, `title-${idx}`)}
                            className="text-slate-500 hover:text-white ml-2 shrink-0"
                          >
                            {copiedSection === `title-${idx}` ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Platform Captions */}
                {generatedCaptions.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-[#0d121f]/90 p-5 space-y-3">
                    <span className="text-xs font-semibold text-white flex items-center gap-2 border-b border-white/[0.08] pb-2">
                      <Share2 className="h-4 w-4 text-emerald-400" /> Platform Captions & Hashtags
                    </span>
                    <div className="space-y-2">
                      {generatedCaptions.map((c, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 space-y-1.5">
                          <p className="text-xs text-slate-300 leading-relaxed">{c}</p>
                          <button
                            onClick={() => handleCopy(c, `cap-${idx}`)}
                            className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            {copiedSection === `cap-${idx}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            <span>{copiedSection === `cap-${idx}` ? "Copied" : "Copy Caption"}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
