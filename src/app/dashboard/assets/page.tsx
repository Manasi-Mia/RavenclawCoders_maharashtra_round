"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  FolderOpen,
  Search,
  Trash2,
  Eye,
  FileText,
  Video,
  Image as ImageIcon,
  Music,
  Download,
  Loader2,
  Tag,
  UploadCloud,
  X,
  Check,
  AlertCircle,
  Plus,
} from "lucide-react";
import { IAsset, IProject } from "@/models";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { uploadInChunks } from "@/lib/upload-client";

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
  abortController?: AbortController;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

const ALLOWED_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/webm",
  "audio/ogg",
  "application/pdf",
]);

export default function AssetManagementPage() {
  const { system } = useAuth();
  const [assets, setAssets] = useState<IAsset[]>([]);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("ALL");
  const [projectFilter, setProjectFilter] = useState<string>("ALL");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "size">("date");

  // Upload Queue State
  const [uploadQueue, setUploadQueue] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadTargetProject, setUploadTargetProject] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview & Edit Modal State
  const [previewAsset, setPreviewAsset] = useState<IAsset | null>(null);
  const [newTagInput, setNewTagInput] = useState<string>("");
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Video thumbnail capture via canvas
  const captureVideoPoster = (file: File): Promise<{ thumbnail: string; duration: number }> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        const duration = video.duration || 0;
        video.currentTime = Math.min(1.0, Math.max(0.1, duration / 2));
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 480;
          canvas.height = 270;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnail = canvas.toDataURL("image/jpeg", 0.7);
            URL.revokeObjectURL(video.src);
            resolve({ thumbnail, duration: video.duration || 0 });
            return;
          }
        } catch {
          // ignore canvas taint or errors
        }
        URL.revokeObjectURL(video.src);
        resolve({ thumbnail: "", duration: video.duration || 0 });
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve({ thumbnail: "", duration: 0 });
      };
    });
  };

  // Convert image to small base64 for Gemini vision
  const getSmallImageBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.size > 3 * 1024 * 1024) {
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  // Upload single file in chunks
  const uploadFile = async (uploadItem: UploadingFile) => {
    const { file, id } = uploadItem;
    const controller = new AbortController();

    setUploadQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: "uploading", progress: 5, abortController: controller }
          : item
      )
    );

    try {
      // Step 1: Generate thumbnail & get AI tags
      let thumbnail = "";
      let durationSeconds = 0;
      let imageData = "";

      if (file.type.startsWith("video/")) {
        const vidMeta = await captureVideoPoster(file);
        thumbnail = vidMeta.thumbnail;
        durationSeconds = Math.round(vidMeta.duration);
      } else if (file.type.startsWith("image/")) {
        imageData = await getSmallImageBase64(file);
        thumbnail = imageData;
      }

      let tags: string[] = [];
      let description = "";

      try {
        const tagRes = await fetch("/api/assets/tag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type,
            imageData: imageData || undefined,
            type: file.type.startsWith("video/")
              ? "video"
              : file.type.startsWith("image/")
              ? "image"
              : file.type.startsWith("audio/")
              ? "audio"
              : "document",
          }),
        });
        if (tagRes.ok) {
          const tagData = await tagRes.json();
          tags = tagData.tags || [];
          description = tagData.description || "";
        }
      } catch {
        // non-blocking
      }

      // Step 2: Upload in chunks via shared client
      const createdAsset = await uploadInChunks(file, {
        filename: file.name,
        mimeType: file.type,
        projectId: uploadTargetProject || undefined,
        thumbnail,
        description,
        tags,
        durationSeconds: durationSeconds || undefined,
        signal: controller.signal,
        onProgress: (pct) => {
          setUploadQueue((prev) =>
            prev.map((item) => (item.id === id ? { ...item, progress: pct } : item))
          );
        },
      });

      setUploadQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, progress: 100, status: "complete" } : item))
      );

      // Add to assets list
      setAssets((prev) => [createdAsset, ...prev]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Upload failed";
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "error", error: errMsg } : item
        )
      );
    }
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: UploadingFile[] = [];

    Array.from(files).forEach((file) => {
      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        alert(`"${file.name}" exceeds the 100 MB limit.`);
        return;
      }
      // Validate type
      if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
        alert(`"${file.name}" has an unsupported format (${file.type}).`);
        return;
      }

      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      newItems.push({
        id,
        file,
        progress: 0,
        status: "pending",
      });
    });

    if (newItems.length > 0) {
      setUploadQueue((prev) => [...prev, ...newItems]);
      // Sequentially upload each
      newItems.forEach((item) => uploadFile(item));
    }
  };

  const cancelUpload = (id: string) => {
    setUploadQueue((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.abortController) {
        target.abortController.abort();
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm("Are you sure you want to permanently delete this asset and all stored data?")) return;
    const res = await fetch(`/api/assets?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setAssets((prev) => prev.filter((a) => a._id !== id));
      if (previewAsset?._id === id) setPreviewAsset(null);
    }
  };

  const handleAddTag = async (asset: IAsset, tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed || asset.tags?.includes(trimmed)) return;
    const updatedTags = [...(asset.tags || []), trimmed];

    const res = await fetch("/api/assets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: asset._id, tags: updatedTags }),
    });

    if (res.ok) {
      setAssets((prev) =>
        prev.map((a) => (a._id === asset._id ? { ...a, tags: updatedTags } : a))
      );
      if (previewAsset?._id === asset._id) {
        setPreviewAsset({ ...previewAsset, tags: updatedTags } as IAsset);
      }
      setNewTagInput("");
    }
  };

  const handleRemoveTag = async (asset: IAsset, tagToRemove: string) => {
    const updatedTags = (asset.tags || []).filter((t) => t !== tagToRemove);
    const res = await fetch("/api/assets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: asset._id, tags: updatedTags }),
    });

    if (res.ok) {
      setAssets((prev) =>
        prev.map((a) => (a._id === asset._id ? { ...a, tags: updatedTags } : a))
      );
      if (previewAsset?._id === asset._id) {
        setPreviewAsset({ ...previewAsset, tags: updatedTags } as IAsset);
      }
    }
  };

  const handleAssignProject = async (assetId: string, projectId: string) => {
    const res = await fetch("/api/assets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: assetId, projectId }),
    });

    if (res.ok) {
      setAssets((prev) =>
        prev.map((a) => (a._id === assetId ? { ...a, projectId } : a))
      );
      setEditingAssetId(null);
    }
  };

  // Collect all unique tags for filter chips
  const allTags = useMemo(() => {
    const set = new Set<string>();
    assets.forEach((a) => a.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [assets]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets
      .filter((a) => {
        if (category !== "ALL" && a.type.toUpperCase() !== category.toUpperCase()) return false;
        if (projectFilter !== "ALL" && a.projectId !== projectFilter) return false;
        if (selectedTag && !a.tags?.includes(selectedTag)) return false;
        if (search) {
          const s = search.toLowerCase();
          const matchName = a.name.toLowerCase().includes(s);
          const matchDesc = a.description?.toLowerCase().includes(s);
          const matchTag = a.tags?.some((t) => t.toLowerCase().includes(s));
          if (!matchName && !matchDesc && !matchTag) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "size") return b.size - a.size;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [assets, category, projectFilter, selectedTag, search, sortBy]);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "video":
        return <Video className="h-4 w-4 text-[#111214]" />;
      case "image":
      case "thumbnail":
        return <ImageIcon className="h-4 w-4 text-[#111214]" />;
      case "audio":
        return <Music className="h-4 w-4 text-[#111214]" />;
      default:
        return <FileText className="h-4 w-4 text-[#111214]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Fallback Warning if MongoDB is not connected */}
      {!system.mongoConfigured && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-700" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold">Database connection needed: </span>
            Uploads require an active MongoDB connection. The app is currently running in fallback mode.
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111214] tracking-tight flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#111214] text-white shadow-sm">
              <FolderOpen className="h-4 w-4 text-white" />
            </span>
            Media & Asset Vault
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#66686c]">
            Upload raw footage, images, b-roll, audio, and documents stored directly in MongoDB chunks with video seeking.
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="creator-btn-primary px-4 py-2.5 text-xs font-semibold"
        >
          <UploadCloud className="h-4 w-4 text-white" />
          <span>Upload Files</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/mp4,video/webm,video/quicktime,image/png,image/jpeg,image/webp,image/gif,audio/mpeg,audio/wav,audio/mp4,audio/webm,audio/ogg,application/pdf"
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFilesSelected(e.dataTransfer.files);
        }}
        className={`rounded-3xl border-2 border-dashed p-8 text-center transition-all ${
          isDragging
            ? "border-black bg-black/5 scale-[1.01]"
            : "border-black/15 bg-white/60 hover:border-black/30 hover:bg-white/80"
        } shadow-xs backdrop-blur-md`}
      >
        <div className="max-w-md mx-auto space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111214] text-white shadow-sm">
            <UploadCloud className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111214]">
              Drag and drop media files here, or{" "}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="underline hover:text-black font-extrabold cursor-pointer"
              >
                browse
              </button>
            </h3>
            <p className="text-xs text-[#66686c] mt-1">
              Supports MP4, WebM, MOV, PNG, JPG, WebP, GIF, MP3, WAV, PDF up to 100 MB each.
            </p>
          </div>

          {/* Project selector for new uploads */}
          {projects.length > 0 && (
            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-[#66686c]">
              <span>Assign to project:</span>
              <select
                value={uploadTargetProject}
                onChange={(e) => setUploadTargetProject(e.target.value)}
                className="rounded-xl border border-black/15 bg-white px-2.5 py-1 text-xs text-[#111214] focus:outline-none"
              >
                <option value="">No Project (General Vault)</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Upload Progress Queue */}
      {uploadQueue.length > 0 && (
        <div className="rounded-3xl border border-black/10 bg-white/70 p-5 space-y-3 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#111214] uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-[#111214]" />
              Upload Queue ({uploadQueue.filter((q) => q.status === "complete").length}/{uploadQueue.length} done)
            </h3>
            {uploadQueue.every((q) => q.status === "complete" || q.status === "error") && (
              <button
                onClick={() => setUploadQueue([])}
                className="text-xs text-[#66686c] hover:text-[#111214] font-medium"
              >
                Clear Queue
              </button>
            )}
          </div>

          <div className="space-y-2">
            {uploadQueue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-3 shadow-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-[#111214] truncate max-w-sm">{item.file.name}</span>
                    <span className="text-[10px] font-mono text-[#66686c]">
                      {item.status === "uploading" && `${item.progress}%`}
                      {item.status === "complete" && "Completed ✓"}
                      {item.status === "error" && "Failed"}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-black/5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 ${
                        item.status === "error" ? "bg-red-500" : "bg-[#111214]"
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  {item.error && <p className="text-[10px] text-red-600 mt-1">{item.error}</p>}
                </div>

                {item.status === "uploading" && (
                  <button
                    onClick={() => cancelUpload(item.id)}
                    className="p-1 rounded-lg text-[#66686c] hover:bg-black/5 hover:text-[#111214]"
                    title="Cancel upload"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {item.status === "complete" && (
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {["ALL", "VIDEO", "IMAGE", "AUDIO", "DOCUMENT"].map((tab) => (
            <button
              key={tab}
              onClick={() => setCategory(tab)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                category === tab
                  ? "bg-[#111214] text-white shadow-xs"
                  : "bg-white/60 border border-black/10 text-[#66686c] hover:bg-white hover:text-[#111214]"
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Project & Search Inputs */}
        <div className="flex items-center gap-2.5">
          {projects.length > 0 && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="rounded-full border border-black/15 bg-white/70 px-3 py-1.5 text-xs text-[#111214] focus:outline-none"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "size")}
            className="rounded-full border border-black/15 bg-white/70 px-3 py-1.5 text-xs text-[#111214] focus:outline-none"
          >
            <option value="date">Newest</option>
            <option value="size">Largest Size</option>
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8a8b8e]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets or tags..."
              className="w-44 sm:w-56 rounded-full border border-black/15 bg-white/80 pl-9 pr-3.5 py-1.5 text-xs text-[#111214] placeholder-[#8a8b8e] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tag Chips Bar */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-[#8a8b8e] uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Tag className="h-3 w-3" /> Tags:
          </span>
          {selectedTag && (
            <button
              onClick={() => setSelectedTag("")}
              className="rounded-full bg-[#111214] text-white px-2.5 py-0.5 text-[10px] font-semibold flex items-center gap-1"
            >
              All Tags <X className="h-3 w-3" />
            </button>
          )}
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTag(selectedTag === t ? "" : t)}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium border transition ${
                selectedTag === t
                  ? "bg-[#111214] text-white border-transparent"
                  : "border-black/10 bg-white/70 text-[#111214] hover:bg-white"
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {/* Asset Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#111214]" />
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-20 rounded-3xl border border-dashed border-black/10 bg-white/40">
          <FolderOpen className="mx-auto h-8 w-8 text-[#8a8b8e]" />
          <h3 className="mt-3 text-sm font-semibold text-[#111214]">No media assets found</h3>
          <p className="mt-1 text-xs text-[#66686c] max-w-sm mx-auto">
            Drag and drop videos, audio files, images or documents above to populate your vault.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => {
            const linkedProject = projects.find((p) => p._id === asset.projectId);

            return (
              <div
                key={asset._id}
                className="group rounded-3xl border border-black/10 bg-white/70 overflow-hidden hover:border-black/30 transition flex flex-col justify-between shadow-xs backdrop-blur-md"
              >
                {/* Media Preview Box */}
                <div
                  onClick={() => setPreviewAsset(asset)}
                  className="relative h-40 w-full overflow-hidden bg-black/5 cursor-pointer flex items-center justify-center"
                >
                  {asset.type === "video" ? (
                    asset.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.thumbnail}
                        alt={asset.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[#66686c]">
                        <Video className="h-8 w-8 mb-1" />
                        <span className="text-[10px] font-mono">Video Asset</span>
                      </div>
                    )
                  ) : asset.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : asset.type === "audio" ? (
                    <div className="flex flex-col items-center justify-center text-[#66686c]">
                      <Music className="h-8 w-8 mb-1" />
                      <span className="text-[10px] font-mono">Audio Track</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#66686c]">
                      <FileText className="h-8 w-8 mb-1" />
                      <span className="text-[10px] font-mono">PDF Document</span>
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="rounded-full bg-white/90 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-[#111214] shadow-xs flex items-center gap-1">
                      {getTypeIcon(asset.type)}
                      <span className="uppercase">{asset.type}</span>
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                    <span className="rounded-full bg-white/90 backdrop-blur-md px-2 py-0.5 text-[9px] font-mono font-medium text-[#111214] shadow-xs">
                      {formatFileSize(asset.size)}
                    </span>
                  </div>
                </div>

                {/* Metadata & Details */}
                <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4
                      title={asset.name}
                      className="text-xs font-bold text-[#111214] truncate group-hover:underline cursor-pointer"
                      onClick={() => setPreviewAsset(asset)}
                    >
                      {asset.name}
                    </h4>

                    {asset.description && (
                      <p className="text-[11px] text-[#66686c] line-clamp-2 mt-1">
                        {asset.description}
                      </p>
                    )}

                    {/* Project Assignment */}
                    <div className="mt-2 text-[10px] text-[#66686c]">
                      {editingAssetId === asset._id ? (
                        <select
                          defaultValue={asset.projectId || ""}
                          onChange={(e) => handleAssignProject(asset._id!, e.target.value)}
                          onBlur={() => setEditingAssetId(null)}
                          autoFocus
                          className="w-full rounded-lg border border-black/15 bg-white p-1 text-[10px] text-[#111214]"
                        >
                          <option value="">No Project</option>
                          {projects.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.title}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div
                          onClick={() => setEditingAssetId(asset._id!)}
                          className="cursor-pointer hover:text-[#111214] truncate"
                          title="Click to reassign project"
                        >
                          Project:{" "}
                          <span className="font-semibold text-[#111214]">
                            {linkedProject ? linkedProject.title : "None (General)"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tag Chips */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(asset.tags || []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-black/5 text-[#111214] px-2 py-0.5 text-[9px] font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                    {(asset.tags || []).length > 3 && (
                      <span className="text-[9px] text-[#8a8b8e] self-center">
                        +{(asset.tags || []).length - 3}
                      </span>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-black/10 text-xs">
                    <span className="text-[10px] text-[#8a8b8e] font-mono">
                      {formatDate(asset.createdAt)}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewAsset(asset)}
                        className="p-1 rounded-lg text-[#66686c] hover:bg-black/5 hover:text-[#111214] transition"
                        title="Preview Asset"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <a
                        href={asset.url}
                        download={asset.name}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-lg text-[#66686c] hover:bg-black/5 hover:text-[#111214] transition"
                        title="Download Asset"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => handleDelete(asset._id)}
                        className="p-1 rounded-lg text-[#66686c] hover:bg-red-50 hover:text-red-600 transition"
                        title="Delete Asset"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Asset Preview Modal with Real Player & Editable Tags */}
      {previewAsset && (
        <Modal
          isOpen={Boolean(previewAsset)}
          onClose={() => setPreviewAsset(null)}
          title={previewAsset.name}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {/* Real Playback / Preview */}
            <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[420px]">
              {previewAsset.type === "video" ? (
                <video
                  controls
                  autoPlay
                  preload="metadata"
                  poster={previewAsset.thumbnail}
                  src={previewAsset.url}
                  className="w-full max-h-[400px] object-contain"
                />
              ) : previewAsset.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewAsset.url}
                  alt={previewAsset.name}
                  className="w-full max-h-[400px] object-contain"
                />
              ) : previewAsset.type === "audio" ? (
                <div className="w-full p-8 flex flex-col items-center justify-center bg-white/90">
                  <Music className="h-12 w-12 text-[#111214] mb-4" />
                  <audio controls src={previewAsset.url} className="w-full max-w-md" />
                </div>
              ) : (
                <div className="w-full p-8 text-center bg-white/90">
                  <FileText className="h-12 w-12 text-[#111214] mx-auto mb-2" />
                  <p className="text-xs text-[#66686c] mb-4">PDF Document Stored in Database</p>
                  <a
                    href={previewAsset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="creator-btn-primary px-4 py-2 text-xs"
                  >
                    Open Document in New Tab
                  </a>
                </div>
              )}
            </div>

            {/* Description & AI Metadata */}
            {previewAsset.description && (
              <div className="rounded-2xl border border-black/10 bg-white/80 p-3.5 text-xs text-[#111214]">
                <span className="font-semibold text-[#66686c] block text-[10px] uppercase font-mono mb-0.5">
                  AI Summary
                </span>
                {previewAsset.description}
              </div>
            )}

            {/* Tags Manager (Editable Chips) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#111214] flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-[#111214]" />
                Tags ({previewAsset.tags?.length || 0})
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {(previewAsset.tags || []).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-[#111214] text-white px-2.5 py-1 text-xs font-medium shadow-xs"
                  >
                    #{t}
                    <button
                      onClick={() => handleRemoveTag(previewAsset, t)}
                      className="hover:text-red-300 ml-0.5"
                      title="Remove tag"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                <div className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag(previewAsset, newTagInput);
                      }
                    }}
                    placeholder="+ Add tag..."
                    className="rounded-full border border-black/15 bg-white px-3 py-1 text-xs text-[#111214] focus:outline-none w-28"
                  />
                  {newTagInput.trim() && (
                    <button
                      onClick={() => handleAddTag(previewAsset, newTagInput)}
                      className="creator-btn-primary px-2.5 py-1 text-xs"
                    >
                      <Plus className="h-3 w-3 text-white" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="flex items-center justify-between text-xs text-[#66686c] pt-3 border-t border-black/10">
              <div>
                <span>Size: <strong className="text-[#111214]">{formatFileSize(previewAsset.size)}</strong></span>
                {previewAsset.mimeType && (
                  <span className="ml-3">Type: <strong className="text-[#111214]">{previewAsset.mimeType}</strong></span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewAsset.url}
                  download={previewAsset.name}
                  className="creator-btn-secondary px-3 py-1.5 text-xs"
                >
                  <Download className="h-3.5 w-3.5 text-[#111214]" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => handleDelete(previewAsset._id)}
                  className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 text-red-700 px-3 py-1.5 text-xs font-semibold hover:bg-red-100 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
