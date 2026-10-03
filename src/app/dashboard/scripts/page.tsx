"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Clock,
  Trash2,
  Edit3,
  Loader2,
  Wand2,
} from "lucide-react";
import { IScript } from "@/models";
import { formatDate } from "@/lib/utils";

export default function ScriptsListPage() {
  const [scripts, setScripts] = useState<IScript[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScripts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/scripts");
      if (res.ok) {
        const d = await res.json();
        setScripts(d.scripts || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  const handleDelete = async (id?: string) => {
    if (!id || !confirm("Delete this script?")) return;
    const res = await fetch(`/api/scripts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setScripts((prev) => prev.filter((s) => s._id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-indigo-400" />
            Script Workspace
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Write, time, and polish your video scripts with inline AI assistant actions and autosave.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/ai-studio"
            className="inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-purple-500/20 transition"
          >
            <Wand2 className="h-4 w-4" />
            <span>Generate New Script with AI</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        </div>
      ) : scripts.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
          <FileText className="mx-auto h-8 w-8 text-slate-500" />
          <h3 className="mt-3 text-sm font-semibold text-white">No scripts written yet</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Use the AI Studio to generate your first complete script or load demo data from the header.
          </p>
          <div className="mt-5">
            <Link
              href="/dashboard/ai-studio"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20"
            >
              <Plus className="h-4 w-4" /> Open AI Studio
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scripts.map((script) => (
            <div
              key={script._id}
              className="rounded-2xl border border-white/10 bg-[#0d121f]/90 p-5 flex flex-col justify-between hover:border-indigo-500/40 transition group shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                    {script.platform}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatDate(script.updatedAt || script.createdAt)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition line-clamp-1">
                  {script.title}
                </h3>

                <p className="text-xs text-slate-400 font-mono line-clamp-3 bg-black/30 p-2.5 rounded border border-white/5">
                  {script.content || "Empty script..."}
                </p>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                  <span>📝 {script.wordCount || 0} words</span>
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Clock className="h-3 w-3" /> {script.estimatedDuration || "0m 0s"}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <button
                  onClick={() => handleDelete(script._id)}
                  className="rounded-lg p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  title="Delete script"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <Link
                  href={`/dashboard/scripts/${script._id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600/30 border border-indigo-500/30 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-indigo-600/50 transition"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Open Editor</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
