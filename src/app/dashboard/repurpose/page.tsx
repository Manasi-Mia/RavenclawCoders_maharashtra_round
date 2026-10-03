"use client";

import { useState, useEffect } from "react";
import {
  Share2,
  Sparkles,
  Copy,
  Check,
  Save,
  RotateCw,
  Loader2,
  Video,
  FileText,
  Globe,
  MessageSquare,
  Send,
  PlaySquare,
} from "lucide-react";
import { IScript } from "@/models";

export default function RepurposeStudioPage() {
  const [sourceType, setSourceType] = useState<"Script" | "Video Transcript" | "Existing Post" | "Podcast">("Script");
  const [sourceText, setSourceText] = useState(
    `HOOK: "90% of developers spend 6 months building an MVP nobody wants. I built and launched a functional AI SaaS in exactly 48 hours — and here is the exact raw roadmap you can steal today."

RULE 1: Narrow the friction point to one single task.
RULE 2: Use Next.js + Serverless API routes with Google Gemini. Zero custom infrastructure.
RULE 3: Build in public with daily commit logs on X and LinkedIn. This drove our first 500 active users organically.

Speed is not just execution velocity — it is a risk mitigation strategy.`
  );

  const [scripts, setScripts] = useState<IScript[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savedKeys, setSavedKeys] = useState<string[]>([]);

  // Repurposed outputs (editable)
  const [igHook, setIgHook] = useState("");
  const [igCaption, setIgCaption] = useState("");
  const [igCarousel, setIgCarousel] = useState("");

  const [ytTitle, setYtTitle] = useState("");
  const [ytDescription, setYtDescription] = useState("");

  const [liPost, setLiPost] = useState("");

  const [xThread, setXThread] = useState("");

  const [shortHook, setShortHook] = useState("");
  const [shortScript, setShortScript] = useState("");

  useEffect(() => {
    fetch("/api/scripts")
      .then((r) => r.json())
      .then((d) => {
        if (d.scripts) setScripts(d.scripts);
      })
      .catch(() => {});
  }, []);

  const handleSelectScript = (id: string) => {
    const s = scripts.find((x) => x._id === id);
    if (s && s.content) {
      setSourceText(s.content);
    }
  };

  const handleRepurpose = async () => {
    if (!sourceText.trim()) return;
    setGenerating(true);
    setSavedKeys([]);

    try {
      const res = await fetch("/api/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          sourceText,
          sourceType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.results) {
        const r = data.results;
        // Instagram
        setIgHook(r.instagram?.hook || "");
        setIgCaption(r.instagram?.caption || "");
        setIgCarousel(Array.isArray(r.instagram?.carouselSlides) ? r.instagram.carouselSlides.join("\n\n") : "");

        // YouTube
        setYtTitle(r.youtube?.title || "");
        setYtDescription(r.youtube?.description || "");

        // LinkedIn
        setLiPost(r.linkedin?.post || `${r.linkedin?.hook || ""}\n\n${r.linkedin?.post || ""}`);

        // X
        setXThread(Array.isArray(r.x?.thread) ? r.x.thread.join("\n\n---\n\n") : r.x?.hookTweet || "");

        // Short form
        setShortHook(r.shortForm?.hook || "");
        setShortScript(r.shortForm?.script || "");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveVariant = async (platform: string, content: string, title?: string, hook?: string) => {
    try {
      const res = await fetch("/api/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          platform,
          content,
          title,
          hook,
          sourceType,
        }),
      });

      if (res.ok) {
        setSavedKeys((prev) => [...prev, platform]);
      }
    } catch (e) {
      console.error("Save variant error:", e);
    }
  };

  const hasResults = Boolean(igCaption || ytDescription || liPost || xThread || shortScript);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Share2 className="h-6 w-6 text-emerald-400" />
            Repurpose Studio
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Convert a single master asset into native, audience-specific formats for Instagram, YouTube, LinkedIn, X, and Short-form video.
          </p>
        </div>

        {hasResults && (
          <button
            onClick={handleRepurpose}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            <RotateCw className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
            <span>Regenerate All Formats</span>
          </button>
        )}
      </div>

      {/* Source Selection & Input Box */}
      <div className="rounded-2xl border border-white/10 bg-[#0d121f]/90 p-6 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Source Content:</span>
            <div className="flex items-center gap-1.5">
              {(["Script", "Video Transcript", "Existing Post", "Podcast"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSourceType(t)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    sourceType === t
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {scripts.length > 0 && sourceType === "Script" && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Load from script:</span>
              <select
                onChange={(e) => handleSelectScript(e.target.value)}
                className="rounded-lg border border-white/10 bg-[#090d16] px-2.5 py-1 text-xs text-white focus:outline-none"
              >
                <option value="">Select script...</option>
                {scripts.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <textarea
          rows={5}
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder="Paste master script, video transcript, or key takeaways..."
          className="w-full rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs sm:text-sm text-slate-200 leading-relaxed focus:border-indigo-500 focus:outline-none"
        />

        <button
          onClick={handleRepurpose}
          disabled={generating || !sourceText.trim()}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 py-3 px-6 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Adapting for Instagram, YouTube, LinkedIn, X, and Shorts...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Repurpose Across 5 Platforms</span>
            </>
          )}
        </button>
      </div>

      {/* Repurposed Cards Grid (Editable) */}
      {hasResults && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Instagram */}
          <div className="rounded-2xl border border-pink-500/30 bg-[#0d121f]/90 p-5 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <PlaySquare className="h-4 w-4 text-pink-400" />
                  Instagram (Reel Caption & Carousel Slides)
                </span>
                <button
                  onClick={() => handleSaveVariant("Instagram", `${igCaption}\n\nCAROUSEL:\n${igCarousel}`, "Instagram Carousel", igHook)}
                  className="rounded-lg border border-pink-500/30 bg-pink-500/10 px-2.5 py-1 text-[11px] font-semibold text-pink-300 hover:bg-pink-500/20 transition flex items-center gap-1"
                >
                  {savedKeys.includes("Instagram") ? <Check className="h-3 w-3 text-emerald-400" /> : <Save className="h-3 w-3" />}
                  <span>{savedKeys.includes("Instagram") ? "Saved" : "Save"}</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Reel Hook</label>
                <input
                  type="text"
                  value={igHook}
                  onChange={(e) => setIgHook(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Caption</label>
                <textarea
                  rows={4}
                  value={igCaption}
                  onChange={(e) => setIgCaption(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-200 font-mono leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Carousel Outline</label>
                <textarea
                  rows={4}
                  value={igCarousel}
                  onChange={(e) => setIgCarousel(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-200 font-mono leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.06] flex justify-end">
              <button
                onClick={() => handleCopy(`${igCaption}\n\n${igCarousel}`, "ig")}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copiedKey === "ig" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedKey === "ig" ? "Copied" : "Copy Instagram Content"}</span>
              </button>
            </div>
          </div>

          {/* 2. LinkedIn */}
          <div className="rounded-2xl border border-blue-500/30 bg-[#0d121f]/90 p-5 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-400" />
                  LinkedIn (Founder Thought Leadership)
                </span>
                <button
                  onClick={() => handleSaveVariant("LinkedIn", liPost, "LinkedIn Post")}
                  className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-300 hover:bg-blue-500/20 transition flex items-center gap-1"
                >
                  {savedKeys.includes("LinkedIn") ? <Check className="h-3 w-3 text-emerald-400" /> : <Save className="h-3 w-3" />}
                  <span>{savedKeys.includes("LinkedIn") ? "Saved" : "Save"}</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Post Body</label>
                <textarea
                  rows={12}
                  value={liPost}
                  onChange={(e) => setLiPost(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-200 font-mono leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.06] flex justify-end">
              <button
                onClick={() => handleCopy(liPost, "li")}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copiedKey === "li" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedKey === "li" ? "Copied" : "Copy LinkedIn Post"}</span>
              </button>
            </div>
          </div>

          {/* 3. YouTube */}
          <div className="rounded-2xl border border-red-500/30 bg-[#0d121f]/90 p-5 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Video className="h-4 w-4 text-red-400" />
                  YouTube (Title, Description & Chapters)
                </span>
                <button
                  onClick={() => handleSaveVariant("YouTube", ytDescription, ytTitle)}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/20 transition flex items-center gap-1"
                >
                  {savedKeys.includes("YouTube") ? <Check className="h-3 w-3 text-emerald-400" /> : <Save className="h-3 w-3" />}
                  <span>{savedKeys.includes("YouTube") ? "Saved" : "Save"}</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Optimized Title</label>
                <input
                  type="text"
                  value={ytTitle}
                  onChange={(e) => setYtTitle(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Description & Timestamps</label>
                <textarea
                  rows={8}
                  value={ytDescription}
                  onChange={(e) => setYtDescription(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-200 font-mono leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.06] flex justify-end">
              <button
                onClick={() => handleCopy(`${ytTitle}\n\n${ytDescription}`, "yt")}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copiedKey === "yt" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedKey === "yt" ? "Copied" : "Copy YouTube Description"}</span>
              </button>
            </div>
          </div>

          {/* 4. X (Twitter) & Short-Form */}
          <div className="rounded-2xl border border-cyan-500/30 bg-[#0d121f]/90 p-5 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Send className="h-4 w-4 text-cyan-400" />
                  X Thread & Short-Form Hook
                </span>
                <button
                  onClick={() => handleSaveVariant("X", xThread, "X Thread")}
                  className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20 transition flex items-center gap-1"
                >
                  {savedKeys.includes("X") ? <Check className="h-3 w-3 text-emerald-400" /> : <Save className="h-3 w-3" />}
                  <span>{savedKeys.includes("X") ? "Saved" : "Save"}</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Short-Form Script & Cues</label>
                <textarea
                  rows={4}
                  value={shortScript}
                  onChange={(e) => setShortScript(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-200 font-mono leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">X (Twitter) Thread</label>
                <textarea
                  rows={5}
                  value={xThread}
                  onChange={(e) => setXThread(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-200 font-mono leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.06] flex justify-end">
              <button
                onClick={() => handleCopy(xThread, "x")}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copiedKey === "x" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedKey === "x" ? "Copied" : "Copy X Thread"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
