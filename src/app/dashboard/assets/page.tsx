"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  Trash2,
  Eye,
  FileText,
  Video,
  Image as ImageIcon,
  Music,
  Download,
  Loader2,
  ExternalLink,
  Tag,
} from "lucide-react";
import { IAsset, IProject } from "@/models";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";

export default function AssetManagementPage() {
  const [assets, setAssets] = useState<IAsset[]>([]);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "size">("date");

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState<IAsset["type"]>("video");
  const [assetUrl, setAssetUrl] = useState("");
  const [assetTags, setAssetTags] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [uploading, setUploading] = useState(false);

  // Preview Modal State
  const [previewAsset, setPreviewAsset] = useState<IAsset | null>(null);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const [assetRes, projRes] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/projects"),
      ]);
      if (assetRes.ok) {
        const d = await assetRes.json();
        setAssets(d.assets || []);
      }
      if (projRes.ok) {
        const d = await projRes.json();
        setProjects(d.projects || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) return;
    setUploading(true);

    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: assetName,
          type: assetType,
          url: assetUrl || undefined,
          tags: assetTags ? assetTags.split(",").map((t) => t.trim()) : [],
          projectId: selectedProjectId || undefined,
        }),
      });

      if (res.ok) {
        await fetchAssets();
        setUploadModalOpen(false);
        setAssetName("");
        setAssetUrl("");
        setAssetTags("");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm("Are you sure you want to delete this asset?")) return;
    const res = await fetch(`/api/assets?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setAssets((prev) => prev.filter((a) => a._id !== id));
      if (previewAsset?._id === id) setPreviewAsset(null);
    }
  };

  const filteredAssets = useMemo(() => {
    return assets
      .filter((a) => {
        const matchesCategory = category === "ALL" || a.type === category;
        const matchesSearch =
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "size") return (b.size || 0) - (a.size || 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [assets, category, search, sortBy]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 KB";
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const renderIcon = (type: IAsset["type"]) => {
    switch (type) {
      case "video":
        return <Video className="h-5 w-5 text-cyan-400" />;
      case "image":
      case "thumbnail":
        return <ImageIcon className="h-5 w-5 text-purple-400" />;
      case "audio":
        return <Music className="h-5 w-5 text-emerald-400" />;
      default:
        return <FileText className="h-5 w-5 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FolderOpen className="h-6 w-6 text-cyan-400" />
            Centralized Asset Library
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Store, tag, and preview footage, thumbnails, audio tracks, and project documents in one place.
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:opacity-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Asset</span>
        </button>
      </div>

      {/* Filter and Category Pills */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {[
            { id: "ALL", label: "All Assets" },
            { id: "video", label: "Videos" },
            { id: "image", label: "Images" },
            { id: "thumbnail", label: "Thumbnails" },
            { id: "audio", label: "Audio" },
            { id: "document", label: "Documents" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition shrink-0 ${
                category === cat.id
                  ? "bg-indigo-600 text-white font-semibold"
                  : "border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets or tags..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "size")}
            className="rounded-xl border border-white/10 bg-[#090d16] px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="date">Sort by Date</option>
            <option value="size">Sort by Size</option>
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
          <FolderOpen className="mx-auto h-8 w-8 text-slate-500" />
          <h3 className="mt-3 text-sm font-semibold text-white">No assets found</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Upload footage, B-roll, diagrams, or sound effects, or load realistic demo data.
          </p>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Upload Asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset._id}
              className="group rounded-2xl border border-white/10 bg-[#0d121f]/90 overflow-hidden hover:border-cyan-500/40 transition duration-200 flex flex-col justify-between shadow-lg"
            >
              {/* Media Thumbnail Preview */}
              <div
                onClick={() => setPreviewAsset(asset)}
                className="relative h-36 w-full bg-black/50 cursor-pointer overflow-hidden flex items-center justify-center"
              >
                {asset.type === "image" || asset.type === "thumbnail" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : asset.type === "video" ? (
                  <div className="flex flex-col items-center gap-2 text-cyan-400">
                    <Video className="h-8 w-8" />
                    <span className="text-[10px] font-mono text-slate-400">Click to Preview Video</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    {renderIcon(asset.type)}
                    <span className="text-[10px] font-mono capitalize">{asset.type}</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-white">
                  {formatFileSize(asset.size)}
                </div>
              </div>

              {/* Details & Tags */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    onClick={() => setPreviewAsset(asset)}
                    className="text-xs font-bold text-white hover:text-cyan-300 transition truncate cursor-pointer"
                  >
                    {asset.name}
                  </h3>
                  <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] uppercase font-mono text-slate-400 shrink-0">
                    {asset.type}
                  </span>
                </div>

                {/* Tags */}
                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {asset.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="rounded bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 text-[9px] font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-white/[0.06]">
                  <span>{formatDate(asset.createdAt)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewAsset(asset)}
                      className="p-1 text-slate-400 hover:text-white transition"
                      title="Preview"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(asset._id)}
                      className="p-1 text-slate-400 hover:text-red-400 transition"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Asset Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload or Link Creator Asset"
      >
        <form onSubmit={handleCreateAsset} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Asset Name</label>
            <input
              type="text"
              required
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="e.g. Hero_B-Roll_Terminal_Screen.mp4"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Asset Type</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as IAsset["type"])}
                className="w-full rounded-xl border border-white/10 bg-[#090d16] px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="video">Video (MP4, MOV)</option>
                <option value="image">Image (PNG, JPG)</option>
                <option value="thumbnail">Thumbnail</option>
                <option value="audio">Audio (MP3, WAV)</option>
                <option value="document">Document (PDF, MD)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Link to Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#090d16] px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">General Asset</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Media URL or Storage Reference (Optional)
            </label>
            <input
              type="text"
              value={assetUrl}
              onChange={(e) => setAssetUrl(e.target.value)}
              placeholder="https://... (or leave blank to use high-res demo asset)"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Compatible with S3, Cloudinary, Firebase Storage, or public URLs.
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              value={assetTags}
              onChange={(e) => setAssetTags(e.target.value)}
              placeholder="e.g. b-roll, terminal, 4k, darkmode"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:opacity-95 transition disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span>Save Asset Metadata</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Asset Preview Modal */}
      {previewAsset && (
        <Modal
          isOpen={Boolean(previewAsset)}
          onClose={() => setPreviewAsset(null)}
          title={`Preview: ${previewAsset.name}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center p-2 min-h-[250px]">
              {previewAsset.type === "image" || previewAsset.type === "thumbnail" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewAsset.url}
                  alt={previewAsset.name}
                  className="max-h-[400px] w-auto object-contain rounded"
                />
              ) : previewAsset.type === "video" ? (
                <video
                  src={previewAsset.url}
                  controls
                  className="w-full max-h-[400px] rounded"
                />
              ) : previewAsset.type === "audio" ? (
                <audio src={previewAsset.url} controls className="w-full" />
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <FileText className="mx-auto h-12 w-12 text-slate-500 mb-2" />
                  <p className="text-xs">Document file preview</p>
                  <a
                    href={previewAsset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:underline"
                  >
                    Open Document Link <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
              <div>
                <span className="text-slate-500 block">Type:</span>
                <span className="font-mono uppercase">{previewAsset.type}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Size:</span>
                <span className="font-mono">{formatFileSize(previewAsset.size)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
              <a
                href={previewAsset.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline"
              >
                <span>Direct Media URL</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <button
                onClick={() => handleDelete(previewAsset._id)}
                className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Asset
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
