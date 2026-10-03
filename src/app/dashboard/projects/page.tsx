"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Plus,
  ArrowRight,
  Video,
  Trash2,
  Loader2,
} from "lucide-react";
import { IProject } from "@/models";
import { formatDate } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState<IProject["platform"]>("YouTube");
  const [targetAudience, setTargetAudience] = useState("");
  const [deadline, setDeadline] = useState("");
  const [creating, setCreating] = useState(false);

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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          platform,
          targetAudience,
          deadline: deadline ? new Date(deadline) : undefined,
          status: "IDEA",
          progress: 10,
        }),
      });

      if (res.ok) {
        await fetchProjects();
        setModalOpen(false);
        setTitle("");
        setDescription("");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm("Are you sure you want to delete this project and its connected items?")) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p._id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111214] tracking-tight flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#111214] text-white shadow-sm">
              <FolderOpen className="h-4 w-4 text-white" />
            </span>
            Video Projects Hub
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#66686c]">
            Every project integrates Idea → Script → Assets → Footage → Clips → Repurposing → Analytics in one unified view.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="creator-btn-primary px-4 py-2.5 text-xs font-semibold"
        >
          <Plus className="h-4 w-4 text-white" />
          <span>New Project</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#111214]" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 rounded-3xl border border-dashed border-black/10 bg-white/40">
          <Video className="mx-auto h-8 w-8 text-[#8a8b8e]" />
          <h3 className="mt-3 text-sm font-semibold text-[#111214]">No video projects yet</h3>
          <p className="mt-1 text-xs text-[#66686c] max-w-sm mx-auto">
            Create your first project or load the realistic creator demo dataset from the top header.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-5 inline-flex items-center gap-1.5 creator-btn-primary px-4 py-2 text-xs"
          >
            <Plus className="h-3.5 w-3.5 text-white" /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div
              key={p._id}
              className="group rounded-3xl border border-black/10 bg-white/70 overflow-hidden hover:border-black/30 transition duration-200 flex flex-col justify-between shadow-xs backdrop-blur-md"
            >
              {/* Thumbnail / Header Banner */}
              <div className="relative h-40 w-full overflow-hidden bg-black/5">
                {p.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.thumbnail}
                    alt={p.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-black/5">
                    <Video className="h-10 w-10 text-[#8a8b8e]" />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="rounded-full bg-white/80 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold text-[#111214] border border-black/5 shadow-xs">
                    {p.platform}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-semibold backdrop-blur-md shadow-xs ${
                      p.status === "PUBLISHED"
                        ? "bg-emerald-500/10 text-emerald-800 border border-emerald-500/20"
                        : p.status === "RECORDING"
                        ? "bg-cyan-500/10 text-cyan-800 border border-cyan-500/20"
                        : "bg-white/80 text-[#111214] border border-black/5"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#111214] group-hover:text-black transition line-clamp-1">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#66686c] line-clamp-2">
                    {p.description || "Video project workflow."}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-black/10">
                  <div className="flex items-center justify-between text-[11px] text-[#66686c]">
                    <span>Workflow Progress</span>
                    <span className="font-semibold text-[#111214]">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-black/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#111214]"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#66686c] font-mono pt-1">
                    <span>Deadline: {formatDate(p.deadline)}</span>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="text-[#8a8b8e] hover:text-red-600 p-1 transition"
                      title="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <Link
                  href={`/dashboard/projects/${p._id}`}
                  className="mt-3 flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white/70 py-2 text-xs font-semibold text-[#111214] hover:bg-white transition shadow-xs"
                >
                  <span>Open Full Project Hub</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Video Project"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#111214] mb-1">Project Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How I Built My First AI App in 48 Hours"
              className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#111214] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111214] mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Overview of the content plan and goals..."
              className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2 text-xs sm:text-sm text-[#111214] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111214] mb-1">Target Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as IProject["platform"])}
                className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-xs text-[#111214] focus:outline-none"
              >
                <option value="YouTube">YouTube</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Multi-Platform">Multi-Platform</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111214] mb-1">Target Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-xs text-[#111214] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111214] mb-1">Target Audience</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Early-stage founders, indie developers"
              className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2 text-xs sm:text-sm text-[#111214] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-full px-4 py-2 text-xs font-medium text-[#66686c] hover:text-[#111214]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="creator-btn-primary px-5 py-2 text-xs"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Plus className="h-4 w-4 text-white" />}
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
