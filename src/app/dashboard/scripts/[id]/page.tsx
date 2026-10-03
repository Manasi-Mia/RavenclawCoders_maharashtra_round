"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  Sparkles,
  Save,
  Check,
  Loader2,
  Wand2,
  ArrowLeft,
  ChevronRight,
  Flame,
  MessageSquare,
  Layers,
  Copy,
} from "lucide-react";
import { IScript, IProject } from "@/models";
import { estimateSpeakingTime, formatDate } from "@/lib/utils";

export default function ScriptEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [script, setScript] = useState<IScript | null>(null);
  const [project, setProject] = useState<IProject | null>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  // Selection & AI Assistant state
  const [selectedText, setSelectedText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // AI Script Doctor actions
  const handleAiAction = async (action: string) => {
    setAiLoading(true);
    setAiOutput("");

    try {
      const res = await fetch("/api/scripts/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          text: selectedText || content,
          fullScript: content,
          platform: script?.platform || "YouTube",
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
    setSavedStatus("unsaved");
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
        <Loader2 className="h-6 w-6 animate-spin text-[#111214]" />
      </div>
    );
  }

  if (!script) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-[#66686c]">Script not found</p>
        <Link href="/dashboard/ai-studio?tab=library" className="mt-3 inline-block text-xs text-[#111214] font-semibold underline">
          ← Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar with Breadcrumbs & Save Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/ai-studio?tab=library"
            className="rounded-xl border border-black/10 bg-white/70 p-2 text-[#66686c] hover:bg-white hover:text-[#111214] transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-[#66686c]">
              <Link href="/dashboard/ai-studio?tab=library" className="hover:text-[#111214]">
                Scripts
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-[#111214] font-medium truncate max-w-xs">{title}</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setSavedStatus("unsaved");
                setTitle(e.target.value);
              }}
              className="mt-1 bg-transparent text-lg font-bold text-[#111214] border-b border-transparent hover:border-black/20 focus:border-black focus:outline-none w-full max-w-md"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Autosave Status */}
          <span className="text-[11px] font-mono flex items-center gap-1.5 text-[#66686c]">
            {savedStatus === "saving" ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-[#111214]" /> Saving...
              </>
            ) : savedStatus === "saved" ? (
              <>
                <Check className="h-3 w-3 text-emerald-600" /> Saved
              </>
            ) : (
              <span className="text-amber-700 font-semibold">● Unsaved edits</span>
            )}
          </span>

          <button
            onClick={handleManualSave}
            disabled={saving}
            className="creator-btn-primary px-3.5 py-1.5 text-xs"
          >
            <Save className="h-3.5 w-3.5 text-white" /> Save
          </button>
        </div>
      </div>

      {/* 3-Column Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Project Information & Pacing (Col 3) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-black/10 bg-white/70 p-5 space-y-4 shadow-sm backdrop-blur-md">
            <h3 className="text-xs font-bold text-[#111214] uppercase tracking-wider border-b border-black/10 pb-2.5">
              Project Context
            </h3>

            {project ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[#66686c]">Linked Project:</span>
                  <Link
                    href={`/dashboard/projects/${project._id}`}
                    className="block font-semibold text-[#111214] hover:underline mt-0.5 truncate"
                  >
                    {project.title}
                  </Link>
                </div>
                <div>
                  <span className="text-[#66686c]">Platform:</span>
                  <p className="font-semibold text-[#111214]">{project.platform}</p>
                </div>
                <div>
                  <span className="text-[#66686c]">Status:</span>
                  <span className="inline-block rounded-full bg-black/5 text-[#111214] border border-black/10 px-2 py-0.5 font-mono text-[10px] mt-0.5 font-medium">
                    {project.status}
                  </span>
                </div>
                {project.deadline && (
                  <div>
                    <span className="text-[#66686c]">Target Deadline:</span>
                    <p className="font-semibold text-[#111214]">{formatDate(project.deadline)}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-[#66686c] space-y-2">
                <p>Standalone script (not linked to a project).</p>
                <div className="pt-2">
                  <span className="text-[#66686c] block mb-1">Platform:</span>
                  <span className="rounded-full bg-black/5 text-[#111214] border border-black/10 px-2 py-0.5 font-mono text-[10px] font-medium">
                    {script.platform}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Speaking Pacing Meter */}
          <div className="rounded-2xl border border-black/10 bg-white/70 p-5 space-y-3 shadow-sm backdrop-blur-md">
            <h3 className="text-xs font-bold text-[#111214] uppercase tracking-wider border-b border-black/10 pb-2.5 flex items-center justify-between">
              <span>Pacing & Duration</span>
              <Clock className="h-3.5 w-3.5 text-[#111214]" />
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-[#66686c]">Word Count</span>
                <p className="text-xl font-extrabold text-[#111214]">{stats.words}</p>
              </div>

              <div>
                <span className="text-[11px] text-[#66686c]">Estimated Speaking Time</span>
                <p className="text-xl font-extrabold text-[#111214]">{stats.formatted}</p>
                <span className="text-[10px] text-[#8a8b8e] font-mono">Based on 130 WPM natural delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Large Editable Script Editor (Col 6) */}
        <div className="lg:col-span-6 rounded-2xl border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-3 text-xs text-[#66686c]">
            <span className="font-semibold text-[#111214] flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#111214]" />
              Script Canvas
            </span>
            <span className="text-[11px] font-mono text-[#8a8b8e]">Autosaves on edit</span>
          </div>

          <textarea
            ref={textareaRef}
            rows={22}
            value={content}
            onChange={(e) => {
              setSavedStatus("unsaved");
              setContent(e.target.value);
            }}
            onSelect={(e) => {
              const target = e.target as HTMLTextAreaElement;
              const sel = target.value.substring(target.selectionStart, target.selectionEnd);
              if (sel && sel.trim().length > 0) {
                setSelectedText(sel);
              }
            }}
            placeholder="Type your script here with scene cues like [SCENE START], HOOK:, INTRODUCTION:, [CALL TO ACTION]..."
            className="w-full bg-transparent font-mono text-xs sm:text-sm text-[#111214] leading-relaxed focus:outline-none resize-y min-h-[500px]"
          />
        </div>

        {/* Right Side: AI Assistant Panel (Col 3) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-black/10 bg-white/70 p-5 space-y-4 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h3 className="text-xs font-bold text-[#111214] uppercase tracking-wider flex items-center gap-1.5">
                <Wand2 className="h-4 w-4 text-[#111214]" /> AI Script Doctor
              </h3>
              <span className="rounded-full bg-black/5 text-[#111214] border border-black/10 px-2 py-0.5 text-[9px] font-mono">
                Gemini
              </span>
            </div>

            <p className="text-[11px] text-[#66686c] leading-normal">
              Select any section of text or click an action below to improve the full script:
            </p>

            <div className="space-y-1.5">
              {[
                { action: "improve_hook", label: "Improve Hook", icon: Flame },
                { action: "more_engaging", label: "Make More Engaging", icon: Sparkles },
                { action: "make_shorter", label: "Make Shorter (Cut Filler)", icon: Clock },
                { action: "simplify", label: "Simplify Complex Words", icon: FileText },
                { action: "add_cta", label: "Add Strong CTA", icon: MessageSquare },
                { action: "generate_transition", label: "Generate Scene Transition", icon: Layers },
              ].map((btn) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.action}
                    type="button"
                    onClick={() => handleAiAction(btn.action)}
                    disabled={aiLoading}
                    className="w-full flex items-center justify-between rounded-xl border border-black/10 bg-white/60 p-2.5 text-xs font-medium text-[#111214] hover:bg-white transition disabled:opacity-50 text-left shadow-xs"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-[#111214]" />
                      <span>{btn.label}</span>
                    </span>
                    <ChevronRight className="h-3 w-3 text-[#8a8b8e]" />
                  </button>
                );
              })}
            </div>

            {/* AI Output Window */}
            {(aiLoading || aiOutput) && (
              <div className="rounded-2xl border border-black/10 bg-white/90 p-3.5 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between text-xs text-[#111214] font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#111214]" />
                    {aiLoading ? "Doctoring Script..." : "AI Revision"}
                  </span>
                  {aiOutput && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiOutput);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-[#66686c] hover:text-[#111214]"
                      title="Copy"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>

                {aiLoading ? (
                  <div className="flex items-center gap-2 text-xs text-[#66686c] py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-[#111214]" />
                    <span>Analyzing dialogue and audience retention...</span>
                  </div>
                ) : (
                  <>
                    <p className="font-mono text-xs text-[#111214] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto bg-black/5 p-2.5 rounded-xl border border-black/10">
                      {aiOutput}
                    </p>
                    <button
                      onClick={handleApplyAiOutput}
                      className="w-full creator-btn-primary py-1.5 text-xs"
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
