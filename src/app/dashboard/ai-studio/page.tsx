"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Wand2,
  Sparkles,
  Copy,
  Check,
  Save,
  RotateCw,
  FileText,
  Bookmark,
  Share2,
  Loader2,
  Flame,
  Search,
  Trash2,
  ExternalLink,
  BookOpen,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { IProject, IScript } from "@/models";
import { ScriptVariant, ScriptAngle } from "@/lib/gemini";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { AIErrorAlert } from "@/components/ui/AIErrorAlert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const ANGLE_CONFIG: Record<
  ScriptAngle,
  { label: string; tag: string; description: string; color: string; badgeBg: string; textCol: string }
> = {
  "Story-driven": {
    label: "Story-driven",
    tag: "Narrative & Emotion",
    description: "Personal conflict, vulnerability, dramatic arc, and transformative realization.",
    color: "from-amber-500 to-rose-500",
    badgeBg: "bg-amber-50 border-amber-200 text-amber-800",
    textCol: "text-amber-700",
  },
  "Educational / how-to": {
    label: "Educational / how-to",
    tag: "Actionable Framework",
    description: "Step-by-step masterclass, zero fluff, tactical blueprints, and high utility.",
    color: "from-blue-600 to-indigo-600",
    badgeBg: "bg-blue-50 border-blue-200 text-blue-800",
    textCol: "text-blue-700",
  },
  "Bold / contrarian take": {
    label: "Bold / contrarian take",
    tag: "Pattern Interrupt",
    description: "Challenges standard consensus, reveals counter-intuitive truths, and hooks curiosity.",
    color: "from-purple-600 to-pink-600",
    badgeBg: "bg-purple-50 border-purple-200 text-purple-800",
    textCol: "text-purple-700",
  },
  "Fast-paced listicle": {
    label: "Fast-paced listicle",
    tag: "Rapid Retention",
    description: "High-energy 3-5 punchy points, rapid visual cuts, and dense value density.",
    color: "from-emerald-600 to-teal-600",
    badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-800",
    textCol: "text-emerald-700",
  },
};

function AIStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();

  // Active top tab: "generate" or "library"
  const tabParam = searchParams.get("tab");
  const [tabSelection, setTabSelection] = useState<"generate" | "library" | null>(null);
  const activeTab = tabSelection ?? (tabParam === "library" ? "library" : "generate");

  // Form Inputs
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
  const [variants, setVariants] = useState<ScriptVariant[]>([]);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [regeneratingAngle, setRegeneratingAngle] = useState<string | null>(null);

  // Error states
  const [error, setError] = useState<{ message: string; code?: string; rawError?: string } | null>(null);
  const [singleVariantError, setSingleVariantError] = useState<{
    angle: string;
    error: { message: string; code?: string; rawError?: string };
  } | null>(null);

  // UI state
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);
  const [savingScript, setSavingScript] = useState(false);

  // Library tab state
  const [savedScripts, setSavedScripts] = useState<IScript[]>([]);
  const [loadingScripts, setLoadingScripts] = useState(false);
  const [scriptsError, setScriptsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Load Projects
  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => {
        if (d.projects) {
          setProjects(d.projects);
          if (d.projects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(d.projects[0]._id);
          }
        }
      })
      .catch(() => {});
  }, [selectedProjectId]);

  // Load Saved Scripts for Library asynchronously on tab change
  useEffect(() => {
    let ignore = false;
    if (activeTab === "library") {
      fetch("/api/scripts")
        .then(async (res) => {
          if (!res.ok) throw new Error(`Server returned status ${res.status}`);
          const json = await res.json();
          if (!ignore) {
            setSavedScripts(json.scripts || []);
            setScriptsError(null);
          }
        })
        .catch((e) => {
          console.error("Failed to load scripts:", e);
          if (!ignore) {
            setScriptsError("Failed to load your scripts library. Please check your connection.");
          }
        })
        .finally(() => {
          if (!ignore) setLoadingScripts(false);
        });
    }
    return () => {
      ignore = true;
    };
  }, [activeTab]);

  // Manual Retry for Library loading
  const handleRetryLoadScripts = useCallback(() => {
    setLoadingScripts(true);
    setScriptsError(null);
    fetch("/api/scripts")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Server returned status ${res.status}`);
        const json = await res.json();
        setSavedScripts(json.scripts || []);
      })
      .catch((e) => {
        console.error("Failed to load scripts:", e);
        setScriptsError("Failed to load your scripts library. Please check your connection.");
      })
      .finally(() => {
        setLoadingScripts(false);
      });
  }, []);

  // Handle Full 4-Variant Generation
  const handleGenerateAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;
    if (generating || regeneratingAngle) return; // Prevent double submit

    setGenerating(true);
    setError(null);
    setSingleVariantError(null);
    setSavedSuccessMsg(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 90000); // 90-second client-side timeout

    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          topic,
          targetAudience,
          platform,
          tone,
          duration,
          contentType,
        }),
      });

      let json: { error?: string; code?: string; details?: string; variants?: ScriptVariant[] } | null = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (!res.ok) {
        const errMsg = json?.error || `Generation failed (Status ${res.status})`;
        const errCode = json?.code || `HTTP_${res.status}`;
        setError({
          message: errMsg,
          code: errCode,
          rawError: json?.details || json?.error || `Server responded with status ${res.status}`,
        });
        return;
      }

      if (!json?.variants || json.variants.length === 0) {
        setError({
          message: "The AI returned no scripts. Please try again.",
          code: "EMPTY_VARIANTS",
        });
        return;
      }

      setVariants(json.variants);
      setSelectedVariantIdx(0);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setError({
          message: "This is taking too long. Please try again.",
          code: "TIMEOUT",
        });
      } else {
        console.error("Error generating variants:", err);
        setError({
          message: "Could not reach the server. Please check your connection and try again.",
          code: "NETWORK_ERROR",
          rawError: err instanceof Error ? err.message : String(err),
        });
      }
    } finally {
      clearTimeout(timeoutId);
      setGenerating(false);
    }
  };

  // Handle Single Variant Regeneration
  const handleRegenerateSingleVariant = async (angle: ScriptAngle) => {
    if (generating || regeneratingAngle) return; // Prevent double submit

    setRegeneratingAngle(angle);
    setSingleVariantError(null);
    setSavedSuccessMsg(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 90000); // 90-second client-side timeout

    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          topic,
          targetAudience,
          platform,
          tone,
          duration,
          contentType,
          singleVariantAngle: angle,
        }),
      });

      let json: { error?: string; code?: string; details?: string; variants?: ScriptVariant[] } | null = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (!res.ok) {
        const errMsg = json?.error || `Regeneration failed (Status ${res.status})`;
        const errCode = json?.code || `HTTP_${res.status}`;
        setSingleVariantError({
          angle,
          error: {
            message: errMsg,
            code: errCode,
            rawError: json?.details || json?.error || `Server responded with status ${res.status}`,
          },
        });
        return;
      }

      if (!json?.variants || json.variants.length === 0) {
        setSingleVariantError({
          angle,
          error: {
            message: "The AI returned no scripts. Please try again.",
            code: "EMPTY_VARIANTS",
          },
        });
        return;
      }

      const freshVariant = json.variants[0];
      setVariants((prev) =>
        prev.map((v) => (v.angle === angle ? freshVariant : v))
      );
      setSingleVariantError(null);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setSingleVariantError({
          angle,
          error: {
            message: "This is taking too long. Please try again.",
            code: "TIMEOUT",
          },
        });
      } else {
        console.error("Error regenerating single variant:", err);
        setSingleVariantError({
          angle,
          error: {
            message: "Could not reach the server. Please check your connection and try again.",
            code: "NETWORK_ERROR",
            rawError: err instanceof Error ? err.message : String(err),
          },
        });
      }
    } finally {
      clearTimeout(timeoutId);
      setRegeneratingAngle(null);
    }
  };

  const currentVariant = variants[selectedVariantIdx] || null;

  // Handle Copy
  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Update current variant in state when user edits script or title
  const handleUpdateCurrentScript = (newScript: string) => {
    if (!currentVariant) return;
    const words = newScript.split(/\s+/).filter(Boolean).length;
    setVariants((prev) =>
      prev.map((v, i) =>
        i === selectedVariantIdx
          ? { ...v, script: newScript, wordCount: words }
          : v
      )
    );
  };

  const handleUpdateCurrentTitle = (newTitle: string) => {
    if (!currentVariant) return;
    setVariants((prev) =>
      prev.map((v, i) =>
        i === selectedVariantIdx ? { ...v, title: newTitle } : v
      )
    );
  };

  // Handle Save to Project / Database
  const handleSaveToProject = async (openAfterSave = false) => {
    if (!currentVariant) return;
    setSavingScript(true);

    try {
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: currentVariant.title || topic,
          content: currentVariant.script,
          hooks: currentVariant.hooks,
          titles: currentVariant.titles,
          captions: currentVariant.captions,
          tone: tone || "Engaging",
          platform: platform || "YouTube",
          projectId: selectedProjectId || undefined,
        }),
      });

      let data: { error?: string; script?: { _id: string } } | null = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (res.ok && data?.script?._id) {
        toast.success("Saved to project library");
        setSavedSuccessMsg(`Saved "${currentVariant.angle}" to project library!`);
        setTimeout(() => setSavedSuccessMsg(null), 3500);

        if (openAfterSave) {
          router.push(`/dashboard/scripts/${data.script._id}`);
        }
      } else {
        toast.error(data?.error || "Failed to save script to project library");
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Could not reach the server to save script.");
    } finally {
      setSavingScript(false);
    }
  };

  // Filtered Scripts in Library
  const filteredScripts = savedScripts.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.tone && s.tone.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPlatform =
      platformFilter === "ALL" || s.platform?.toLowerCase() === platformFilter.toLowerCase();
    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/60 shadow-xs">
              <Wand2 className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              AI Script Studio
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Generate 4 multi-angle psychological scripts from 1 prompt, refine hooks, and manage your script repository.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-white/80 p-1 shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setTabSelection("generate")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === "generate"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Generate (4 Angles)</span>
          </button>
          <button
            onClick={() => setTabSelection("library")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === "library"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>My Scripts ({savedScripts.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: GENERATE (4 VARIANTS) */}
      {activeTab === "generate" && (
        <div className="space-y-6">
          {/* Creator Profile Intelligence Banner */}
          {user && (user.creatorType || user.specializations?.length) && (
            <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60 px-4 py-2.5 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-[11px] font-bold">
                  AI
                </span>
                <div className="text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">
                    Personalized for {user.creatorType || "Creator"}
                  </span>
                  {user.specializations && user.specializations.length > 0 && (
                    <span className="ml-2 text-slate-500">
                      • Niches:{" "}
                      <span className="font-medium text-indigo-700">
                        {user.specializations.join(", ")}
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <Link
                href="/dashboard/settings"
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Customize Niche
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Script Blueprint Form */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  Script Blueprint
                </h2>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100">
                  4 Angles
                </span>
              </div>

              <form onSubmit={handleGenerateAll} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Topic or Core Concept
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. How I Built My First AI App in 48 Hours"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. Software developers & indie hackers"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Platform
                    </label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="YouTube">YouTube</option>
                      <option value="Instagram">Instagram Reel</option>
                      <option value="TikTok">TikTok</option>
                      <option value="LinkedIn">LinkedIn Video</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Duration
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tone & Pacing
                    </label>
                    <input
                      type="text"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      placeholder="e.g. High energy, actionable"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Content Type
                    </label>
                    <select
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="YouTube video">YouTube video</option>
                      <option value="YouTube Short">YouTube Short</option>
                      <option value="Instagram Reel">Instagram Reel</option>
                      <option value="Educational breakdown">Educational breakdown</option>
                    </select>
                  </div>
                </div>

                {projects.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assign to Project
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
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
                  disabled={generating || Boolean(regeneratingAngle)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                      <span>Generating 4 Creative Angles...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-indigo-400" />
                      <span>Generate 4 Script Variants</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right: 4 Variants Cards & Selected Variant Inspector */}
            <div className="lg:col-span-8 space-y-5">
              {/* Main Generation Error Alert */}
              {error && (
                <AIErrorAlert
                  title={
                    error.code === "AI_QUOTA"
                      ? "AI Limit Notice"
                      : error.code === "UNAUTHORIZED"
                      ? "Session Expired"
                      : error.code === "TIMEOUT"
                      ? "Request Timeout"
                      : "Script Generation Notice"
                  }
                  message={error.message}
                  rawError={error.rawError || (error.code ? `Error Code: ${error.code}` : undefined)}
                  onDismiss={() => setError(null)}
                  onRetry={() => handleGenerateAll()}
                  action={
                    error.code === "UNAUTHORIZED" ? (
                      <Link
                        href="/login"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
                      >
                        <span>Log in again</span>
                      </Link>
                    ) : undefined
                  }
                />
              )}

              {/* Loading Skeleton while generating */}
              {generating && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600 shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">
                        Generating 4 script variants... this can take up to 30-60 seconds
                      </p>
                      <p className="text-xs text-slate-500">
                        Crafting Story-driven, Educational, Bold/contrarian, and Fast-paced listicle angles...
                      </p>
                    </div>
                  </div>

                  {/* Skeleton of 4 variant tabs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { angle: "Story-driven", tag: "Narrative & Emotion" },
                      { angle: "Educational / how-to", tag: "Actionable Framework" },
                      { angle: "Bold / contrarian take", tag: "Pattern Interrupt" },
                      { angle: "Fast-paced listicle", tag: "Rapid Retention" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-slate-200/80 bg-white/80 p-3 space-y-2.5 animate-pulse"
                      >
                        <div className="flex items-center justify-between">
                          <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] text-transparent">
                            {item.angle}
                          </span>
                          <div className="h-2 w-2 rounded-full bg-indigo-300 animate-ping" />
                        </div>
                        <div className="space-y-1.5 pt-1">
                          <div className="h-3 w-full bg-slate-200 rounded" />
                          <div className="h-3 w-4/5 bg-slate-200 rounded" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono pt-1">
                          {item.tag}
                        </p>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div className="h-2.5 w-8 bg-slate-200 rounded" />
                          <div className="h-2.5 w-12 bg-slate-200 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {variants.length === 0 && !generating ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Wand2 className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900">
                    Ready to Generate 4 High-Retention Angles
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                    Click &ldquo;Generate 4 Script Variants&rdquo; to receive 4 complete scripts in one call:
                    Story-driven, Educational, Bold/contrarian, and Fast-paced listicle.
                  </p>
                  <button
                    onClick={() => handleGenerateAll()}
                    disabled={generating || Boolean(regeneratingAngle)}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:bg-slate-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Quick-Generate with Sample Topic</span>
                  </button>
                </div>
              ) : variants.length > 0 && (
                <div className="space-y-5">
                  {/* 4 Angle Variant Selector Cards */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Choose Story Angle (4 Generated)
                      </span>
                      {savedSuccessMsg && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          {savedSuccessMsg}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {variants.map((v, idx) => {
                        const config = ANGLE_CONFIG[v.angle] || ANGLE_CONFIG["Story-driven"];
                        const isSelected = selectedVariantIdx === idx;
                        const isRegenThis = regeneratingAngle === v.angle;
                        const hasErrorThis = singleVariantError?.angle === v.angle;

                        return (
                          <div
                            key={v.angle}
                            onClick={() => setSelectedVariantIdx(idx)}
                            className={`cursor-pointer relative rounded-xl border p-3 transition text-left flex flex-col justify-between ${
                              isSelected
                                ? "border-slate-900 bg-white shadow-sm ring-2 ring-slate-900/10"
                                : "border-slate-200/80 bg-white/70 hover:border-slate-300 hover:bg-white"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <span
                                  className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${config.badgeBg}`}
                                >
                                  {v.angle}
                                </span>
                                {isRegenThis ? (
                                  <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
                                ) : hasErrorThis ? (
                                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1 rounded">
                                    Error
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-xs font-semibold text-slate-900 line-clamp-2">
                                {v.title}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                                {config.tag}
                              </p>
                            </div>

                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-500 font-mono">
                              <span>{v.wordCount}w</span>
                              <span>~{v.estimatedDuration}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Variant Inspector */}
                  {currentVariant && (
                    <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md p-5 space-y-5 shadow-xs">
                      {/* Single Variant Error Alert */}
                      {singleVariantError && singleVariantError.angle === currentVariant.angle && (
                        <AIErrorAlert
                          title={
                            singleVariantError.error.code === "AI_QUOTA"
                              ? "AI Limit Notice"
                              : singleVariantError.error.code === "UNAUTHORIZED"
                              ? "Session Expired"
                              : singleVariantError.error.code === "TIMEOUT"
                              ? "Request Timeout"
                              : `Regeneration Notice (${currentVariant.angle})`
                          }
                          message={singleVariantError.error.message}
                          rawError={
                            singleVariantError.error.rawError ||
                            (singleVariantError.error.code ? `Error Code: ${singleVariantError.error.code}` : undefined)
                          }
                          onDismiss={() => setSingleVariantError(null)}
                          onRetry={() => handleRegenerateSingleVariant(currentVariant.angle)}
                          action={
                            singleVariantError.error.code === "UNAUTHORIZED" ? (
                              <Link
                                href="/login"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
                              >
                                <span>Log in again</span>
                              </Link>
                            ) : undefined
                          }
                        />
                      )}

                      {/* Action Bar for Current Variant */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                              ANGLE_CONFIG[currentVariant.angle]?.badgeBg || "bg-indigo-50 text-indigo-800"
                            }`}
                          >
                            {currentVariant.angle}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {currentVariant.wordCount} words • ~{currentVariant.estimatedDuration} speaking
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Regenerate this variant only */}
                          <button
                            onClick={() => handleRegenerateSingleVariant(currentVariant.angle)}
                            disabled={generating || Boolean(regeneratingAngle)}
                            title="Regenerate only this angle with Gemini"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <RotateCw
                              className={`h-3.5 w-3.5 ${
                                regeneratingAngle === currentVariant.angle ? "animate-spin text-indigo-600" : ""
                              }`}
                            />
                            <span>Regenerate Angle</span>
                          </button>

                          {/* Save to Project */}
                          <button
                            onClick={() => handleSaveToProject(false)}
                            disabled={savingScript}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                          >
                            {savingScript ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                            <span>Save to Library</span>
                          </button>

                          {/* Open in Editor */}
                          <button
                            onClick={() => handleSaveToProject(true)}
                            disabled={savingScript}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition disabled:opacity-50"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Edit in Script Studio</span>
                          </button>
                        </div>
                      </div>

                      {/* Title Bar */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Script Title (Editable)
                        </label>
                        <input
                          type="text"
                          value={currentVariant.title}
                          onChange={(e) => handleUpdateCurrentTitle(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                        />
                      </div>

                      {/* Master Script Textarea */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-indigo-600" />
                            Master Dialogue & Scene Directions
                          </span>
                          <button
                            onClick={() => handleCopy(currentVariant.script, "script")}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                          >
                            {copiedSection === "script" ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            <span>{copiedSection === "script" ? "Copied!" : "Copy Full Script"}</span>
                          </button>
                        </div>

                        <textarea
                          rows={12}
                          value={currentVariant.script}
                          onChange={(e) => handleUpdateCurrentScript(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-xs sm:text-sm text-slate-900 leading-relaxed focus:bg-white focus:border-indigo-500 focus:outline-none resize-y"
                          placeholder="Generated script will appear here..."
                        />
                      </div>

                      {/* 4 Psychological Hooks */}
                      {currentVariant.hooks && currentVariant.hooks.length > 0 && (
                        <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white p-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <Flame className="h-4 w-4 text-amber-500" />
                              4 Opening Psychological Hooks
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Curiosity • Contrarian • Metrics
                            </span>
                          </div>

                          <div className="space-y-2">
                            {currentVariant.hooks.map((h, i) => (
                              <div
                                key={i}
                                className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 hover:bg-slate-50 transition"
                              >
                                <div className="flex items-start gap-2">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold shrink-0">
                                    {i + 1}
                                  </span>
                                  <p className="text-xs text-slate-800 leading-relaxed">{h}</p>
                                </div>
                                <button
                                  onClick={() => handleCopy(h, `hook-${i}`)}
                                  className="text-slate-400 hover:text-slate-700 transition shrink-0 p-1"
                                  title="Copy hook"
                                >
                                  {copiedSection === `hook-${i}` ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Titles & Captions Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* High CTR Titles */}
                        {currentVariant.titles && currentVariant.titles.length > 0 && (
                          <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-2.5">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                              <Bookmark className="h-4 w-4 text-indigo-600" />
                              4 High-CTR Title Options
                            </span>
                            <ul className="space-y-2">
                              {currentVariant.titles.map((t, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-center justify-between text-xs text-slate-800 p-2 rounded-lg bg-slate-50 border border-slate-100"
                                >
                                  <span className="font-medium">{t}</span>
                                  <button
                                    onClick={() => handleCopy(t, `title-${idx}`)}
                                    className="text-slate-400 hover:text-slate-700 ml-2 shrink-0 p-1"
                                  >
                                    {copiedSection === `title-${idx}` ? (
                                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Captions & Hashtags */}
                        {currentVariant.captions && currentVariant.captions.length > 0 && (
                          <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-2.5">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                              <Share2 className="h-4 w-4 text-emerald-600" />
                              Social Captions & Tags
                            </span>
                            <div className="space-y-2">
                              {currentVariant.captions.map((c, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5"
                                >
                                  <p className="text-xs text-slate-800 leading-relaxed">{c}</p>
                                  <button
                                    onClick={() => handleCopy(c, `cap-${idx}`)}
                                    className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                                  >
                                    {copiedSection === `cap-${idx}` ? (
                                      <Check className="h-3 w-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                    <span>{copiedSection === `cap-${idx}` ? "Copied!" : "Copy Caption"}</span>
                                  </button>
                                </div>
                              ))}

                              {currentVariant.hashtags && currentVariant.hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {currentVariant.hashtags.map((tag, tIdx) => (
                                    <span
                                      key={tIdx}
                                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 border border-slate-200"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY SCRIPTS LIBRARY */}
      {activeTab === "library" && (
        <div className="space-y-5">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved scripts by title, content or tone..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Platforms</option>
                <option value="YouTube">YouTube</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="LinkedIn">LinkedIn</option>
              </select>

              <button
                onClick={() => setTabSelection("generate")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>New Script</span>
              </button>
            </div>
          </div>

          {/* Scripts List */}
          {loadingScripts ? (
            <div className="flex items-center justify-center p-12 text-slate-500 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Loading your scripts library...</span>
            </div>
          ) : scriptsError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-10 text-center space-y-3">
              <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
              <h3 className="text-sm font-bold text-rose-950">Unable to Load Library</h3>
              <p className="text-xs text-rose-800 max-w-sm mx-auto">{scriptsError}</p>
              <button
                type="button"
                onClick={() => handleRetryLoadScripts()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : filteredScripts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center space-y-3">
              <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="text-base font-bold text-slate-900">
                {searchQuery || platformFilter !== "ALL"
                  ? "No matching scripts found"
                  : "Your script library is empty"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || platformFilter !== "ALL"
                  ? "Try adjusting your search query or platform filter to locate saved drafts."
                  : "Generate your first set of 4 script variants or create a new draft to save it here."}
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setPlatformFilter("ALL");
                  setTabSelection("generate");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Generate New Script</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredScripts.map((s) => {
                const words = s.content ? s.content.split(/\s+/).filter(Boolean).length : 0;
                const readingTime = Math.max(1, Math.ceil(words / 130));

                return (
                  <div
                    key={s._id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {s.platform || "Video"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {words} words • ~{readingTime}m
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-2">
                        {s.title}
                      </h3>

                      <p className="mt-2 text-xs text-slate-500 line-clamp-3 leading-relaxed font-mono">
                        {s.content}
                      </p>

                      {s.hooks && s.hooks.length > 0 && (
                        <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50/50 p-2 text-[11px] text-amber-900 line-clamp-1">
                          <span className="font-bold">Hook:</span> {s.hooks[0]}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopy(s.content || "", `lib-copy-${s._id}`)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                          title="Copy script"
                        >
                          {copiedSection === `lib-copy-${s._id}` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => s._id && setPendingDeleteId(s._id)}
                          disabled={!s._id || deletingId === s._id}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-50 cursor-pointer"
                          title="Delete script"
                        >
                          {deletingId === s._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      <Link
                        href={`/dashboard/scripts/${s._id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
                      >
                        <span>Open Editor</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(pendingDeleteId)}
        title="Delete Script"
        message="Are you sure you want to delete this script from your library? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete Script"
        isLoading={Boolean(deletingId)}
        onConfirm={async () => {
          if (!pendingDeleteId) return;
          setDeletingId(pendingDeleteId);
          try {
            const res = await fetch(`/api/scripts/${pendingDeleteId}`, { method: "DELETE" });
            if (res.ok) {
              setSavedScripts((prev) => prev.filter((s) => s._id !== pendingDeleteId));
              toast.success("Script removed from library");
            } else {
              toast.error("Failed to delete script");
            }
          } catch (e) {
            console.error("Delete script error:", e);
            toast.error("Failed to delete script");
          } finally {
            setDeletingId(null);
            setPendingDeleteId(null);
          }
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}

export default function AIStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span className="text-sm font-medium">Loading AI Studio...</span>
          </div>
        </div>
      }
    >
      <AIStudioContent />
    </Suspense>
  );
}
