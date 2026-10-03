"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Loader2,
  Calendar,
} from "lucide-react";
import { IProject } from "@/models";
import { formatDate } from "@/lib/utils";

const STAGES: Array<IProject["status"]> = [
  "IDEA",
  "PLANNED",
  "RECORDING",
  "EDITING",
  "READY",
  "PUBLISHED",
];

const STAGE_CONFIG: Record<
  IProject["status"],
  { label: string; badge: string; border: string; header: string }
> = {
  IDEA: {
    label: "Ideas",
    badge: "bg-amber-500/10 text-amber-400",
    border: "border-amber-500/20",
    header: "text-amber-400",
  },
  PLANNED: {
    label: "Planned",
    badge: "bg-blue-500/10 text-blue-400",
    border: "border-blue-500/20",
    header: "text-blue-400",
  },
  RECORDING: {
    label: "Recording",
    badge: "bg-cyan-500/10 text-cyan-400",
    border: "border-cyan-500/20",
    header: "text-cyan-400",
  },
  EDITING: {
    label: "Editing",
    badge: "bg-purple-500/10 text-purple-400",
    border: "border-purple-500/20",
    header: "text-purple-400",
  },
  READY: {
    label: "Ready",
    badge: "bg-emerald-500/10 text-emerald-400",
    border: "border-emerald-500/20",
    header: "text-emerald-400",
  },
  PUBLISHED: {
    label: "Published",
    badge: "bg-pink-500/10 text-pink-400",
    border: "border-pink-500/20",
    header: "text-pink-400",
  },
};

export default function KanbanWorkflowPage() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      if (res.ok) {
        const d = await res.json();
        setProjects(d.projects || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleMoveStage = async (project: IProject, direction: "next" | "prev") => {
    const currentIndex = STAGES.indexOf(project.status);
    let nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= STAGES.length) return;

    const nextStatus = STAGES[nextIndex];

    // Optimistic UI update
    setProjects((prev) =>
      prev.map((p) => (p._id === project._id ? { ...p, status: nextStatus } : p))
    );

    await fetch(`/api/projects/${project._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FolderKanban className="h-6 w-6 text-purple-400" />
            Content Pipeline Kanban
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Track and advance projects across all production stages: Ideas → Planned → Recording → Editing → Ready → Published.
          </p>
        </div>

        <Link
          href="/dashboard/calendar"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          <Calendar className="h-4 w-4" />
          <span>Switch to Calendar</span>
        </Link>
      </div>

      {/* Board Columns */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const conf = STAGE_CONFIG[stage];
            const stageProjects = projects.filter((p) => p.status === stage);

            return (
              <div
                key={stage}
                className="flex flex-col rounded-2xl border border-white/10 bg-[#0d121f]/90 p-3.5 min-h-[550px] shadow-xl"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3">
                  <span className={`text-xs font-bold uppercase tracking-wider ${conf.header}`}>
                    {conf.label}
                  </span>
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-mono font-bold text-slate-300">
                    {stageProjects.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 space-y-3">
                  {stageProjects.map((p) => (
                    <div
                      key={p._id}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2.5 hover:border-indigo-500/40 transition group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-300">
                          {p.platform}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {p.progress}%
                        </span>
                      </div>

                      <Link
                        href={`/dashboard/projects/${p._id}`}
                        className="block text-xs font-bold text-white group-hover:text-cyan-300 transition line-clamp-2"
                      >
                        {p.title}
                      </Link>

                      <div className="h-1 w-full rounded-full bg-white/[0.08] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>

                      {p.deadline && (
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Due: {formatDate(p.deadline)}</span>
                        </div>
                      )}

                      {/* Stage Move Controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                        <button
                          onClick={() => handleMoveStage(p, "prev")}
                          disabled={STAGES.indexOf(stage) === 0}
                          className="rounded p-1 text-slate-500 hover:text-white disabled:opacity-20 transition"
                          title="Move to previous stage"
                        >
                          <ArrowLeft className="h-3 w-3" />
                        </button>
                        <span className="text-[9px] text-slate-500 uppercase font-mono">Move</span>
                        <button
                          onClick={() => handleMoveStage(p, "next")}
                          disabled={STAGES.indexOf(stage) === STAGES.length - 1}
                          className="rounded p-1 text-slate-500 hover:text-white disabled:opacity-20 transition"
                          title="Move to next stage"
                        >
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {stageProjects.length === 0 && (
                    <div className="text-center py-8 text-[11px] text-slate-500 border border-dashed border-white/5 rounded-xl">
                      Empty stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
