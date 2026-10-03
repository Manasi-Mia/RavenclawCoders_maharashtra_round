"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lightbulb,
  Plus,
  Sparkles,
  Search,
  Filter,
  Trash2,
  Edit2,
  ArrowRight,
  Loader2,
  Check,
  FolderPlus,
  Flame,
} from "lucide-react";
import { IIdea } from "@/models";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";

export default function ContentIdeasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ideas, setIdeas] = useState<IIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create / Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTopic, setFormTopic] = useState("");
  const [formPlatform, setFormPlatform] = useState<IIdea["platform"]>("YouTube");
  const [formStatus, setFormStatus] = useState<IIdea["status"]>("IDEA");
  const [formPriority, setFormPriority] = useState<IIdea["priority"]>("MEDIUM");
  const [formAudience, setFormAudience] = useState("");
  const [formContentType, setFormContentType] = useState("Video");
  const [saving, setSaving] = useState(false);

  // AI Generator Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiAudience, setAiAudience] = useState("");
  const [aiPlatform, setAiPlatform] = useState("YouTube");
  const [aiStyle, setAiStyle] = useState("High-energy, actionable, educational");
  const [generating, setGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<Array<Partial<IIdea>>>([]);

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ideas");
      if (res.ok) {
        const d = await res.json();
        setIdeas(d.ideas || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
    if (searchParams.get("generate") === "true") {
      setAiModalOpen(true);
    }
    if (searchParams.get("new") === "true") {
      resetForm();
      setEditModalOpen(true);
    }
  }, [searchParams]);

  const resetForm = () => {
    setEditingId(null);
    setFormTitle("");
    setFormDescription("");
    setFormTopic("");
    setFormPlatform("YouTube");
    setFormStatus("IDEA");
    setFormPriority("MEDIUM");
    setFormAudience("");
    setFormContentType("Video");
  };

  const handleOpenEdit = (idea: IIdea) => {
    setEditingId(idea._id || null);
    setFormTitle(idea.title);
    setFormDescription(idea.description || "");
    setFormTopic(idea.topic || "");
    setFormPlatform(idea.platform);
    setFormStatus(idea.status);
    setFormPriority(idea.priority);
    setFormAudience(idea.targetAudience || "");
    setFormContentType(idea.contentType || "Video");
    setEditModalOpen(true);
  };

  const handleSaveIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setSaving(true);

    try {
      if (editingId) {
        // Update
        const res = await fetch(`/api/ideas/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle,
            description: formDescription,
            topic: formTopic,
            platform: formPlatform,
            status: formStatus,
            priority: formPriority,
            targetAudience: formAudience,
            contentType: formContentType,
          }),
        });
        if (res.ok) {
          await fetchIdeas();
          setEditModalOpen(false);
          resetForm();
        }
      } else {
        // Create
        const res = await fetch("/api/ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle,
            description: formDescription,
            topic: formTopic,
            platform: formPlatform,
            status: formStatus,
            priority: formPriority,
            targetAudience: formAudience,
            contentType: formContentType,
          }),
        });
        if (res.ok) {
          await fetchIdeas();
          setEditModalOpen(false);
          resetForm();
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIdea = async (id?: string) => {
    if (!id || !confirm("Are you sure you want to delete this content idea?")) return;
    const res = await fetch(`/api/ideas/${id}`, { method: "DELETE" });
    if (res.ok) {
      setIdeas((prev) => prev.filter((i) => i._id !== id));
    }
  };

  // Convert Idea to Full Project
  const handleConvertToProject = async (idea: IIdea) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: idea.title,
          description: idea.description,
          platform: idea.platform,
          status: "PLANNED",
          targetAudience: idea.targetAudience,
        }),
      });
      const data = await res.json();
      if (res.ok && data.project?._id) {
        // Update idea status to IN PRODUCTION with link
        if (idea._id) {
          await fetch(`/api/ideas/${idea._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "IN PRODUCTION",
              projectId: data.project._id,
            }),
          });
        }
        router.push(`/dashboard/projects/${data.project._id}`);
      }
    } catch (e) {
      console.error("Convert to project failed:", e);
    }
  };

  // Trigger Gemini Idea Generation
  const handleGenerateAiIdeas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;
    setGenerating(true);
    setGeneratedIdeas([]);

    try {
      const res = await fetch("/api/ideas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic,
          targetAudience: aiAudience,
          platform: aiPlatform,
          contentStyle: aiStyle,
        }),
      });

      const data = await res.json();
      if (res.ok && Array.isArray(data.ideas)) {
        setGeneratedIdeas(data.ideas);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveGeneratedIdea = async (item: Partial<IIdea>) => {
    const res = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: item.title,
        description: item.description,
        topic: item.topic || aiTopic,
        platform: item.platform || aiPlatform,
        status: "IDEA",
        priority: item.priority || "HIGH",
        targetAudience: item.targetAudience || aiAudience,
        contentType: item.contentType || "Video",
      }),
    });

    if (res.ok) {
      await fetchIdeas();
      setGeneratedIdeas((prev) => prev.filter((i) => i.title !== item.title));
    }
  };

  // Filtered Ideas list
  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const matchesSearch =
        idea.title.toLowerCase().includes(search.toLowerCase()) ||
        (idea.description && idea.description.toLowerCase().includes(search.toLowerCase())) ||
        (idea.topic && idea.topic.toLowerCase().includes(search.toLowerCase()));

      const matchesPlatform = platformFilter === "ALL" || idea.platform === platformFilter;
      const matchesStatus = statusFilter === "ALL" || idea.status === statusFilter;

      return matchesSearch && matchesPlatform && matchesStatus;
    });
  }, [ideas, search, platformFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Lightbulb className="h-6 w-6 text-amber-400" />
            Content Idea Manager
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Capture, score, and transition high-potential content concepts into full production pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setAiModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-purple-500/20 hover:border-purple-500/50 transition shadow-sm"
          >
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <span>Generate with Gemini</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setEditModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:opacity-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Idea</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas by title, keyword, or topic..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#090d16] px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Platforms</option>
            <option value="YouTube">YouTube</option>
            <option value="Instagram">Instagram</option>
            <option value="TikTok">TikTok</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Multi-Platform">Multi-Platform</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#090d16] px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="IDEA">Idea</option>
            <option value="PLANNED">Planned</option>
            <option value="IN PRODUCTION">In Production</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
      </div>

      {/* Ideas Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        </div>
      ) : filteredIdeas.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
          <Lightbulb className="mx-auto h-8 w-8 text-slate-500" />
          <h3 className="mt-3 text-sm font-semibold text-white">No content ideas found</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            {search || platformFilter !== "ALL" || statusFilter !== "ALL"
              ? "Try adjusting your search criteria or clearing filters."
              : "Generate 5 viral content angles with Google Gemini or create your first idea manually."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={() => setAiModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600/30 border border-purple-500/40 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-purple-600/40 transition"
            >
              <Sparkles className="h-3.5 w-3.5" /> Generate with Gemini
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.map((idea) => (
            <div
              key={idea._id}
              className="group rounded-2xl border border-white/10 bg-[#0d121f]/90 p-5 flex flex-col justify-between hover:border-indigo-500/40 hover:bg-[#111728] transition duration-200 shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                      {idea.platform}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-mono font-semibold ${
                        idea.priority === "HIGH"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : idea.priority === "MEDIUM"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-slate-500/10 text-slate-400"
                      }`}
                    >
                      {idea.priority} Priority
                    </span>
                  </div>

                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      idea.status === "PUBLISHED"
                        ? "text-emerald-400"
                        : idea.status === "IN PRODUCTION"
                        ? "text-cyan-400"
                        : idea.status === "PLANNED"
                        ? "text-purple-400"
                        : "text-slate-400"
                    }`}
                  >
                    {idea.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition line-clamp-2">
                  {idea.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {idea.description || "No description provided."}
                </p>

                {idea.topic && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <span className="text-slate-400">Topic:</span>
                    <span className="text-indigo-300">{idea.topic}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(idea)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.08] hover:text-white transition"
                    title="Edit idea"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteIdea(idea._id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
                    title="Delete idea"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {idea.status !== "IN PRODUCTION" && idea.status !== "PUBLISHED" ? (
                  <button
                    onClick={() => handleConvertToProject(idea)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600/30 border border-indigo-500/30 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-indigo-600/50 transition"
                  >
                    <FolderPlus className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Convert to Project</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Active In Pipeline
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Create / Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={editingId ? "Edit Content Idea" : "New Content Idea"}
      >
        <form onSubmit={handleSaveIdea} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. 5 Gemini Features Nobody Talks About"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description / Core Premise</label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="What makes this concept compelling? What is the main takeaway for viewers?"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Topic / Category</label>
              <input
                type="text"
                value={formTopic}
                onChange={(e) => setFormTopic(e.target.value)}
                placeholder="e.g. AI Tools, Productivity"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Audience</label>
              <input
                type="text"
                value={formAudience}
                onChange={(e) => setFormAudience(e.target.value)}
                placeholder="e.g. Software devs, indie hackers"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Platform</label>
              <select
                value={formPlatform}
                onChange={(e) => setFormPlatform(e.target.value as IIdea["platform"])}
                className="w-full rounded-xl border border-white/10 bg-[#090d16] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="YouTube">YouTube</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Multi-Platform">Multi-Platform</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as IIdea["priority"])}
                className="w-full rounded-xl border border-white/10 bg-[#090d16] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as IIdea["status"])}
                className="w-full rounded-xl border border-white/10 bg-[#090d16] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="IDEA">Idea</option>
                <option value="PLANNED">Planned</option>
                <option value="IN PRODUCTION">In Production</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:opacity-95 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>{editingId ? "Update Idea" : "Save to Idea Bank"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* AI Idea Generator Modal */}
      <Modal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="Generate High-Impact Ideas with Gemini AI"
        maxWidth="2xl"
      >
        <form onSubmit={handleGenerateAiIdeas} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Core Topic / Niche</label>
              <input
                type="text"
                required
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. Next.js 15, AI SaaS, Video Editing"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Audience</label>
              <input
                type="text"
                value={aiAudience}
                onChange={(e) => setAiAudience(e.target.value)}
                placeholder="e.g. Solo developers, tech founders"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Platform</label>
              <select
                value={aiPlatform}
                onChange={(e) => setAiPlatform(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#090d16] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="YouTube">YouTube Long-Form</option>
                <option value="Instagram">Instagram Reels</option>
                <option value="TikTok">TikTok</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Multi-Platform">Multi-Platform</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Content Style / Vibe</label>
              <input
                type="text"
                value={aiStyle}
                onChange={(e) => setAiStyle(e.target.value)}
                placeholder="e.g. Punchy, contrarian, case study"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Gemini is generating viral angles...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate 5 Ideas</span>
              </>
            )}
          </button>
        </form>

        {/* Results List */}
        {generatedIdeas.length > 0 && (
          <div className="space-y-3 border-t border-white/[0.08] pt-4 max-h-[360px] overflow-y-auto">
            <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-amber-400" />
              Generated Concept Angles:
            </p>
            {generatedIdeas.map((gen, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-indigo-500/30 transition"
              >
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-mono text-cyan-300">
                      {gen.platform}
                    </span>
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-mono text-amber-300">
                      {gen.priority}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{gen.title}</h4>
                  <p className="text-[11px] text-slate-400">{gen.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveGeneratedIdea(gen)}
                  className="shrink-0 flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Idea</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
