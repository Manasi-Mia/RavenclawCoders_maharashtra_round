"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  ArrowRight,
  ArrowLeft,
  Clock,
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
    badge: "bg-amber-500/10 text-amber-700",
    border: "border-amber-500/20",
    header: "text-amber-700",
  },
  PLANNED: {
    label: "Planned",
    badge: "bg-blue-500/10 text-blue-700",
    border: "border-blue-500/20",
    header: "text-blue-700",
  },
  RECORDING: {
    label: "Recording",
    badge: "bg-emerald-500/10 text-emerald-700",
    border: "border-emerald-500/20",
    header: "text-emerald-700",
  },
  EDITING: {
    label: "Editing",
    badge: "bg-purple-500/10 text-purple-700",
    border: "border-purple-500/20",
    header: "text-purple-700",
  },
  READY: {
    label: "Ready",
    badge: "bg-teal-500/10 text-teal-700",
    border: "border-teal-500/20",
    header: "text-teal-700",
  },
  PUBLISHED: {
    label: "Published",
    badge: "bg-slate-500/10 text-slate-800",
    border: "border-slate-500/20",
    header: "text-slate-800",
  },
};

export default function WorkflowPage() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (res.ok && data.projects) {
        setProjects(data.projects);
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
    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111214] tracking-tight flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#111214] text-white shadow-sm">
              <FolderKanban className="h-4 w-4 text-white" />
            </span>
            Content Pipeline Kanban
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#66686c]">
            Track and advance projects across all production stages: Ideas → Planned → Recording → Editing → Ready → Published.
          </p>
        </div>

        <Link
          href="/dashboard/calendar"
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs font-semibold text-[#111214] hover:bg-white transition shadow-xs"
        >
          <Calendar className="h-4 w-4" />
          <span>Switch to Calendar</span>
        </Link>
      </div>

      {/* Board Columns */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#111214]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const conf = STAGE_CONFIG[stage];
            const stageProjects = projects.filter((p) => p.status === stage);

            return (
              <div
                key={stage}
                className="flex flex-col rounded-2xl border border-black/10 bg-white/60 p-3.5 min-h-[550px] shadow-sm backdrop-blur-md"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-3">
                  <span className={`text-xs font-bold uppercase tracking-wider ${conf.header}`}>
                    {conf.label}
                  </span>
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-mono font-bold text-[#111214] border border-black/5">
                    {stageProjects.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 space-y-3">
                  {stageProjects.map((p) => (
                    <div
                      key={p._id}
                      className="rounded-xl border border-black/10 bg-white/80 p-3 space-y-2.5 hover:border-black/30 hover:bg-white transition group shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[9px] font-semibold text-[#111214] border border-black/5">
                          {p.platform}
                        </span>
                        <span className="text-[10px] font-mono text-[#66686c]">
                          {p.progress}%
                        </span>
                      </div>

                      <Link
                        href={`/dashboard/projects/${p._id}`}
                        className="block text-xs font-bold text-[#111214] group-hover:text-black transition line-clamp-2"
                      >
                        {p.title}
                      </Link>

                      <div className="h-1.5 w-full rounded-full bg-black/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#111214]"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>

                      {p.deadline && (
                        <div className="text-[10px] text-[#66686c] font-mono flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Due: {formatDate(p.deadline)}</span>
                        </div>
                      )}

                      {/* Stage Move Controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-black/10">
                        <button
                          onClick={() => handleMoveStage(p, "prev")}
                          disabled={STAGES.indexOf(stage) === 0}
                          className="rounded p-1 text-[#66686c] hover:text-[#111214] disabled:opacity-20 transition"
                          title="Move to previous stage"
                        >
                          <ArrowLeft className="h-3 w-3" />
                        </button>
                        <span className="text-[9px] text-[#8a8b8e] uppercase font-mono font-medium">Move</span>
                        <button
                          onClick={() => handleMoveStage(p, "next")}
                          disabled={STAGES.indexOf(stage) === STAGES.length - 1}
                          className="rounded p-1 text-[#66686c] hover:text-[#111214] disabled:opacity-20 transition"
                          title="Move to next stage"
                        >
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {stageProjects.length === 0 && (
                    <div className="text-center py-8 text-[11px] text-[#8a8b8e] border border-dashed border-black/10 rounded-xl">
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
