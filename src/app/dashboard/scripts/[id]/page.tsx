"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  Save,
  Check,
  Loader2,
  Sparkles,
  ArrowLeft,
  Wand2,
  ChevronRight,
  Flame,
  MessageSquare,
  Copy,
  Layers,
} from "lucide-react";
import { IScript, IProject } from "@/models";
import { estimateSpeakingTime, formatDate } from "@/lib/utils";

export default function ScriptEditorWorkspace({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [script, setScript] = useState<IScript | null>(null);
  const [project, setProject] = useState<IProject | null>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch script
  useEffect(() => {
    fetch(`/api/scripts/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.script) {
          setScript(d.script);
          setContent(d.script.content || "");
          setTitle(d.script.title || "");
          if (d.project) {
            setProject(d.project);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Autosave with debounce
  useEffect(() => {
    if (loading || !script) return;
    setSavedStatus("unsaved");

    const timer = setTimeout(async () => {
      setSavedStatus("saving");
      try {
        await fetch(`/api/scripts/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            content,
          }),
        });
        setSavedStatus("saved");
      } catch {
        setSavedStatus("unsaved");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [content, title, id, loading, script]);

  // Handle manual save
  const handleManualSave = async () => {
    setSaving(true);
    setSavedStatus("saving");
    try {
      await fetch(`/api/scripts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
        }),
      });
      setSavedStatus("saved");
    } finally {
      setSaving(false);
    }
  };

  // AI Assistant Action
  const handleAiAction = async (action: string, instruction?: string) => {
    setAiLoading(true);
    setAiOutput("");

    try {
      const res = await fetch("/api/scripts/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          selectedText: selectedText || undefined,
          fullScript: content,
          instruction,
        }),
      });

      const data = await res.json();
      if (res.ok && data.result) {
        setAiOutput(data.result);
      }
    } finally {
      setAiLoading(false);
    }
  };

  // Apply AI output directly into script
  const handleApplyAiOutput = () => {
    if (!aiOutput) return;
    if (selectedText && content.includes(selectedText)) {
      setContent((prev) => prev.replace(selectedText, aiOutput));
    } else {
      setContent((prev) => prev + "\n\n" + aiOutput);
    }
    setAiOutput("");
  };

  const stats = estimateSpeakingTime(content);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!script) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-slate-400">Script not found</p>
        <Link href="/dashboard/scripts" className="mt-3 inline-block text-xs text-indigo-400">
          ← Back to Scripts
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar with Breadcrumbs & Save Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/scripts"
            className="rounded-xl border border-white/10 p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Link href="/dashboard/scripts" className="hover:text-slate-200">
                Scripts
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white truncate max-w-xs">{title}</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 bg-transparent text-lg font-bold text-white border-b border-transparent hover:border-white/20 focus:border-indigo-500 focus:outline-none w-full max-w-md"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Autosave Status */}
          <span className="text-[11px] font-mono flex items-center gap-1.5 text-slate-400">
            {savedStatus === "saving" ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-purple-400" /> Saving to MongoDB...
              </>
            ) : savedStatus === "saved" ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" /> Saved to cloud
              </>
            ) : (
              <span className="text-amber-400">● Unsaved edits</span>
            )}
          </span>

          <button
            onClick={handleManualSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/[0.08] transition"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      </div>

      {/* 3-Column Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Project Information & Pacing (Col 3) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d121f]/90 p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.08] pb-2.5">
              Project Context
            </h3>

            {project ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400">Linked Project:</span>
                  <Link
                    href={`/dashboard/projects/${project._id}`}
                    className="block font-semibold text-cyan-300 hover:underline mt-0.5 truncate"
                  >
                    {project.title}
                  </Link>
                </div>
                <div>
                  <span className="text-slate-400">Platform:</span>
                  <p className="font-semibold text-white">{project.platform}</p>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <span className="inline-block rounded bg-indigo-500/20 text-indigo-300 px-2 py-0.5 font-mono text-[10px] mt-0.5">
                    {project.status}
                  </span>
                </div>
                {project.deadline && (
                  <div>
                    <span className="text-slate-400">Target Deadline:</span>
                    <p className="font-semibold text-white">{formatDate(project.deadline)}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 space-y-2">
                <p>Standalone script (not linked to a project).</p>
                <div className="pt-2">
                  <span className="text-slate-400 block mb-1">Platform:</span>
                  <span className="rounded bg-indigo-500/20 text-indigo-300 px-2 py-0.5 font-mono text-[10px]">
                    {script.platform}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Speaking Pacing Meter */}
          <div className="rounded-2xl border border-white/10 bg-[#0d121f]/90 p-5 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.08] pb-2.5 flex items-center justify-between">
              <span>Pacing & Duration</span>
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-slate-400">Word Count</span>
                <p className="text-xl font-extrabold text-white">{stats.words}</p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400">Estimated Speaking Time</span>
                <p className="text-xl font-extrabold text-cyan-400">{stats.formatted}</p>
                <span className="text-[10px] text-slate-500 font-mono">Based on 130 WPM natural delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Large Editable Script Editor (Col 6) */}
        <div className="lg:col-span-6 rounded-2xl border border-white/10 bg-[#0d121f]/90 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-xs text-slate-400">
            <span className="font-semibold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-400" />
              Script Canvas
            </span>
            <span className="text-[11px] font-mono text-slate-400">Autosaves on edit</span>
          </div>

          <textarea
            ref={textareaRef}
            rows={22}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onSelect={(e) => {
              const target = e.target as HTMLTextAreaElement;
              const sel = target.value.substring(target.selectionStart, target.selectionEnd);
              if (sel && sel.trim().length > 0) {
                setSelectedText(sel);
              }
            }}
            placeholder="Type your script here with scene cues like [SCENE START], HOOK:, INTRODUCTION:, [CALL TO ACTION]..."
            className="w-full bg-transparent font-mono text-xs sm:text-sm text-slate-100 leading-relaxed focus:outline-none resize-y min-h-[500px]"
          />
        </div>

        {/* Right Side: AI Assistant Panel (Col 3) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d121f]/90 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Wand2 className="h-4 w-4 text-purple-400" /> AI Script Doctor
              </h3>
              <span className="rounded bg-indigo-500/20 text-cyan-300 px-1.5 py-0.5 text-[9px] font-mono">
                Gemini
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              Select any section of text or click an action below to improve the full script:
            </p>

            <div className="space-y-1.5">
              {[
                { action: "improve_hook", label: "Improve Hook", icon: Flame, color: "text-amber-400" },
                { action: "more_engaging", label: "Make More Engaging", icon: Sparkles, color: "text-purple-400" },
                { action: "make_shorter", label: "Make Shorter (Cut Filler)", icon: Clock, color: "text-cyan-400" },
                { action: "simplify", label: "Simplify Complex Words", icon: FileText, color: "text-blue-400" },
                { action: "add_cta", label: "Add Strong CTA", icon: MessageSquare, color: "text-emerald-400" },
                { action: "generate_transition", label: "Generate Scene Transition", icon: Layers, color: "text-pink-400" },
              ].map((btn) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.action}
                    type="button"
                    onClick={() => handleAiAction(btn.action)}
                    disabled={aiLoading}
                    className="w-full flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs text-slate-200 hover:border-indigo-500/40 hover:bg-white/[0.06] transition disabled:opacity-50 text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 ${btn.color}`} />
                      <span>{btn.label}</span>
                    </span>
                    <ChevronRight className="h-3 w-3 text-slate-500" />
                  </button>
                );
              })}
            </div>

            {/* AI Output Window */}
            {(aiLoading || aiOutput) && (
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-cyan-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    {aiLoading ? "Doctoring Script..." : "AI Revision"}
                  </span>
                  {aiOutput && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiOutput);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-slate-400 hover:text-white"
                      title="Copy"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>

                {aiLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-300 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                    <span>Analyzing dialogue and audience retention...</span>
                  </div>
                ) : (
                  <>
                    <p className="font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto bg-black/40 p-2.5 rounded border border-white/5">
                      {aiOutput}
                    </p>
                    <button
                      onClick={handleApplyAiOutput}
                      className="w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
                    >
                      Apply Revision into Editor
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
