"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Scissors,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Save,
  Trash2,
  Copy,
  Split,
  Undo2,
  Redo2,
  Camera,
  Monitor,
  Download,
  Upload,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Plus,
  X,
  UploadCloud,
  Film,
} from "lucide-react";
import { IAsset, IClip, IScript } from "@/models";
import { formatDuration } from "@/lib/utils";
import { AIErrorAlert } from "@/components/ui/AIErrorAlert";
import { ClipCard } from "@/components/dashboard/ClipCard";
import { uploadInChunks } from "@/lib/upload-client";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

function StudioLoading() {
  return (
    <div className="flex h-96 items-center justify-center">
      <div className="flex items-center gap-3 text-sm font-bold text-[#111214]">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading Video Studio...</span>
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<StudioLoading />}>
      <StudioContent />
    </Suspense>
  );
}

interface HistoryItem {
  title: string;
  startTime: number;
  endTime: number;
  hook: string;
  caption: string;
  platform: string;
  status: string;
}

function StudioContent() {
  const searchParams = useSearchParams();
  const initialClipId = searchParams.get("clipId") || "";
  const initialAssetId = searchParams.get("assetId") || "";
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"edit" | "record">("edit");
  const [videoAssets, setVideoAssets] = useState<IAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState(initialAssetId);
  const [clips, setClips] = useState<IClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState(initialClipId);

  // Video playback state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [loopClip, setLoopClip] = useState(true);

  // Inspector edit state
  const [inspectorTitle, setInspectorTitle] = useState("");
  const [inspectorStart, setInspectorStart] = useState(0);
  const [inspectorEnd, setInspectorEnd] = useState(30);
  const [inspectorHook, setInspectorHook] = useState("");
  const [inspectorCaption, setInspectorCaption] = useState("");
  const [inspectorPlatform, setInspectorPlatform] = useState("YouTube Shorts");
  const [inspectorStatus, setInspectorStatus] = useState("SUGGESTED");

  // Track whether fields were edited by user or AI
  const [fieldEdited, setFieldEdited] = useState<{ [key: string]: boolean }>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Format preview state
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "1:1" | "16:9">("9:16");
  const [focusX, setFocusX] = useState(50); // percentage
  const [focusY, setFocusY] = useState(50); // percentage
  const [showCaptionOverlay, setShowCaptionOverlay] = useState(true);
  const [captionPosition, setCaptionPosition] = useState<"top" | "center" | "bottom">("bottom");
  const [captionSize, setCaptionSize] = useState<"sm" | "md" | "lg">("md");

  // Regeneration state
  const [regeneratingHook, setRegeneratingHook] = useState(false);
  const [regeneratingCaption, setRegeneratingCaption] = useState(false);
  const [inspectorAiError, setInspectorAiError] = useState<{ message: string; rawError: string } | null>(null);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [exportBlob, setExportBlob] = useState<Blob | null>(null);
  const [exportMessage, setExportMessage] = useState("");

  // Record Studio state
  const [scripts, setScripts] = useState<IScript[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState("");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordMode, setRecordMode] = useState<"camera" | "screen">("camera");
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedBytes, setRecordedBytes] = useState(0);
  const [isSavingTake, setIsSavingTake] = useState(false);
  const [takeSaveProgress, setTakeSaveProgress] = useState(0);

  const [prompterSpeed, setPrompterSpeed] = useState(2);
  const [prompterSize, setPrompterSize] = useState(20);
  const [isPrompterScrolling, setIsPrompterScrolling] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordVideoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const prompterContainerRef = useRef<HTMLDivElement | null>(null);

  // Upload state inside Studio
  const studioFileInputRef = useRef<HTMLInputElement | null>(null);
  const [studioUploadProgress, setStudioUploadProgress] = useState<number | null>(null);
  const [studioUploadFileName, setStudioUploadFileName] = useState("");
  const [studioUploadError, setStudioUploadError] = useState("");
  const studioUploadControllerRef = useRef<AbortController | null>(null);
  const [isDraggingFootage, setIsDraggingFootage] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "default";
    isLoading?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Timeline interactive dragging
  const timelineBarRef = useRef<HTMLDivElement | null>(null);
  const [draggingHandle, setDraggingHandle] = useState<"start" | "end" | null>(null);

  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const hasUnsavedEdits = Object.values(fieldEdited).some(Boolean);

  const loadClipIntoInspector = useCallback((clip: IClip) => {
    setSelectedClipId(clip._id || "");
    setInspectorTitle(clip.title);
    setInspectorStart(clip.startTime);
    setInspectorEnd(clip.endTime);
    setInspectorHook(clip.hook || "");
    setInspectorCaption(clip.caption || "");
    setInspectorPlatform(clip.platform || "YouTube Shorts");
    setInspectorStatus(clip.status || "SUGGESTED");
    setFieldEdited({});

    const initialHistory: HistoryItem = {
      title: clip.title,
      startTime: clip.startTime,
      endTime: clip.endTime,
      hook: clip.hook || "",
      caption: clip.caption || "",
      platform: clip.platform || "YouTube Shorts",
      status: clip.status || "SUGGESTED",
    };
    setHistory([initialHistory]);
    setHistoryIndex(0);

    if (videoRef.current) {
      videoRef.current.currentTime = clip.startTime;
      setCurrentTime(clip.startTime);
    }
  }, []);

  // TASK 3: Fetch initial assets, clips, and scripts ONCE on mount
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetch("/api/assets?type=video").then((r) => (r.ok ? r.json() : { assets: [] })),
      fetch("/api/clips").then((r) => (r.ok ? r.json() : { clips: [] })),
      fetch("/api/scripts").then((r) => (r.ok ? r.json() : { scripts: [] })),
    ])
      .then(([aData, cData, sData]) => {
        if (!isMounted) return;
        const vids: IAsset[] = aData.assets || [];
        setVideoAssets(vids);

        const allClips: IClip[] = cData.clips || [];
        setClips(allClips);

        const allScripts: IScript[] = sData.scripts || [];
        setScripts(allScripts);
        if (allScripts.length > 0) setSelectedScriptId(allScripts[0]._id || "");

        // Determine initial selected asset and clip
        let targetAssetId = initialAssetId;
        let targetClip: IClip | undefined;

        if (initialClipId) {
          targetClip = allClips.find((c) => c._id === initialClipId);
          if (targetClip && targetClip.assetId) {
            targetAssetId = targetClip.assetId;
          }
        }

        if (!targetAssetId && vids.length > 0) {
          targetAssetId = vids[0]._id || "";
        }

        setSelectedAssetId(targetAssetId);

        if (targetClip) {
          loadClipIntoInspector(targetClip);
        } else if (targetAssetId) {
          const footageClips = allClips.filter((c) => c.assetId === targetAssetId);
          if (footageClips.length > 0) {
            loadClipIntoInspector(footageClips[0]);
          }
        }
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "Failed to load studio assets";
        toast.error(msg);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONCE on mount

  // Selected asset & clips for currently selected asset
  const selectedAsset = videoAssets.find((a) => a._id === selectedAssetId);
  const assetClips = clips.filter((c) => c.assetId === selectedAssetId);

  // Switching footage safely with unsaved changes dialog
  const performFootageSwitch = useCallback(
    (targetAssetId: string) => {
      setSelectedAssetId(targetAssetId);
      setCurrentTime(0);
      setDuration(0);
      setFieldEdited({});

      const matchingClips = clips.filter((c) => c.assetId === targetAssetId);
      if (matchingClips.length > 0) {
        loadClipIntoInspector(matchingClips[0]);
      } else {
        setSelectedClipId("");
        setInspectorTitle("");
        setInspectorStart(0);
        setInspectorEnd(30);
        setInspectorHook("");
        setInspectorCaption("");
        setInspectorPlatform("YouTube Shorts");
        setInspectorStatus("SUGGESTED");
        setHistory([]);
        setHistoryIndex(-1);
      }
    },
    [clips, loadClipIntoInspector]
  );

  const handleSelectFootage = (nextAssetId: string) => {
    if (nextAssetId === selectedAssetId) return;

    if (hasUnsavedEdits) {
      setConfirmDialog({
        isOpen: true,
        title: "Unsaved Changes",
        message:
          "You have unsaved changes in the Clip Inspector. Switching footage will discard these edits. Continue?",
        confirmLabel: "Discard & Switch",
        variant: "warning",
        onConfirm: () => {
          setConfirmDialog(null);
          performFootageSwitch(nextAssetId);
        },
      });
    } else {
      performFootageSwitch(nextAssetId);
    }
  };

  const pushHistory = useCallback(
    (newState: Partial<HistoryItem>) => {
      const current: HistoryItem = {
        title: inspectorTitle,
        startTime: inspectorStart,
        endTime: inspectorEnd,
        hook: inspectorHook,
        caption: inspectorCaption,
        platform: inspectorPlatform,
        status: inspectorStatus,
        ...newState,
      };

      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(current);
        if (newHistory.length > 15) newHistory.shift();
        return newHistory;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 14));
    },
    [
      inspectorTitle,
      inspectorStart,
      inspectorEnd,
      inspectorHook,
      inspectorCaption,
      inspectorPlatform,
      inspectorStatus,
      historyIndex,
    ]
  );

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setInspectorTitle(prev.title);
      setInspectorStart(prev.startTime);
      setInspectorEnd(prev.endTime);
      setInspectorHook(prev.hook);
      setInspectorCaption(prev.caption);
      setInspectorPlatform(prev.platform);
      setInspectorStatus(prev.status);
      setHistoryIndex(historyIndex - 1);
      toast.info("Undo change");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setInspectorTitle(next.title);
      setInspectorStart(next.startTime);
      setInspectorEnd(next.endTime);
      setInspectorHook(next.hook);
      setInspectorCaption(next.caption);
      setInspectorPlatform(next.platform);
      setInspectorStatus(next.status);
      setHistoryIndex(historyIndex + 1);
      toast.info("Redo change");
    }
  };

  // Video Player Event Handlers
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);

    if (selectedClipId && inspectorEnd > inspectorStart) {
      if (curr >= inspectorEnd) {
        if (loopClip) {
          videoRef.current.currentTime = inspectorStart;
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    }
  };

  // TASK 4: WebM duration Infinity fix and safe duration extraction
  const handleLoadedMetadata = () => {
    const vid = videoRef.current;
    if (!vid) return;

    if (Number.isFinite(vid.duration) && vid.duration > 0) {
      setDuration(vid.duration);
      return;
    }

    // Standard fix for MediaRecorder WebM files that report duration = Infinity
    const onSeekedFix = () => {
      vid.removeEventListener("seeked", onSeekedFix);
      vid.removeEventListener("timeupdate", onSeekedFix);

      let realDuration = vid.duration;
      if (!Number.isFinite(realDuration) || realDuration === 0) {
        if (selectedAsset?.durationSeconds && selectedAsset.durationSeconds > 0) {
          realDuration = selectedAsset.durationSeconds;
        } else if (recordSeconds > 0) {
          realDuration = recordSeconds;
        } else {
          realDuration = vid.currentTime || 0;
        }
      }

      vid.currentTime = 0;
      if (Number.isFinite(realDuration) && realDuration > 0) {
        setDuration(realDuration);
      }
    };

    vid.addEventListener("seeked", onSeekedFix);
    vid.addEventListener("timeupdate", onSeekedFix);
    vid.currentTime = 1e101;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentTime >= inspectorEnd && inspectorEnd > inspectorStart) {
        videoRef.current.currentTime = inspectorStart;
      }
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    const safeTime = Math.max(0, Math.min(time, safeDuration > 0 ? safeDuration : 100));
    videoRef.current.currentTime = safeTime;
    setCurrentTime(safeTime);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Safe percentage helper for timeline rendering
  const getTimelinePercent = (seconds: number): number => {
    if (!safeDuration || safeDuration <= 0) return 0;
    return Math.max(0, Math.min(100, (seconds / safeDuration) * 100));
  };

  // Draggable timeline handles logic (Task 3 & 4)
  const handleHandlePointerDown = (type: "start" | "end", e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingHandle(type);
  };

  useEffect(() => {
    if (!draggingHandle) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!timelineBarRef.current || safeDuration <= 0) return;
      const rect = timelineBarRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const targetTime = Math.round(ratio * safeDuration * 10) / 10;

      if (draggingHandle === "start") {
        const clampedStart = Math.max(0, Math.min(targetTime, Math.max(0, inspectorEnd - 0.5)));
        setInspectorStart(clampedStart);
        setFieldEdited((prev) => ({ ...prev, start: true }));
        if (videoRef.current) {
          videoRef.current.currentTime = clampedStart;
          setCurrentTime(clampedStart);
        }
      } else if (draggingHandle === "end") {
        const clampedEnd = Math.max(inspectorStart + 0.5, Math.min(targetTime, safeDuration));
        setInspectorEnd(clampedEnd);
        setFieldEdited((prev) => ({ ...prev, end: true }));
        if (videoRef.current) {
          videoRef.current.currentTime = clampedEnd;
          setCurrentTime(clampedEnd);
        }
      }
    };

    const handlePointerUp = () => {
      if (draggingHandle === "start") {
        pushHistory({ startTime: inspectorStart });
      } else if (draggingHandle === "end") {
        pushHistory({ endTime: inspectorEnd });
      }
      setDraggingHandle(null);
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove);
    window.addEventListener("touchend", handlePointerUp);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [draggingHandle, inspectorStart, inspectorEnd, safeDuration, pushHistory]);

  // TASK 3: Manual Clip Creation
  const handleAddManualClip = async () => {
    if (!selectedAssetId) {
      toast.error("Please upload or select footage first.");
      return;
    }

    const start = Math.max(0, Math.min(currentTime, safeDuration > 0 ? safeDuration - 1 : 0));
    const end = safeDuration > 0 ? Math.min(start + 15, safeDuration) : start + 15;
    const clipTitle = `Clip at ${formatDuration(start)}`;

    try {
      const res = await fetch("/api/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: clipTitle,
          startTime: Math.round(start * 10) / 10,
          endTime: Math.round(end * 10) / 10,
          hook: "",
          caption: "",
          platform: "YouTube Shorts",
          assetId: selectedAssetId,
          status: "SUGGESTED",
          origin: "manual",
          confidence: 1.0,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create clip");
      }

      const data = await res.json();
      setClips((prev) => [data.clip, ...prev]);
      loadClipIntoInspector(data.clip);
      toast.success("New clip created!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create clip";
      toast.error(msg);
    }
  };

  // TASK 3: Mark In / Mark Out Buttons
  const handleMarkIn = () => {
    if (!selectedClipId) {
      toast.error("Select or create a clip first.");
      return;
    }
    const newStart = Math.max(0, Math.min(currentTime, Math.max(0, inspectorEnd - 0.5)));
    setInspectorStart(newStart);
    setFieldEdited((prev) => ({ ...prev, start: true }));
    pushHistory({ startTime: newStart });
    toast.info(`Marked In at ${formatDuration(newStart)}`);
  };

  const handleMarkOut = () => {
    if (!selectedClipId) {
      toast.error("Select or create a clip first.");
      return;
    }
    const maxBound = safeDuration > 0 ? safeDuration : currentTime + 1;
    const newEnd = Math.max(inspectorStart + 0.5, Math.min(currentTime, maxBound));
    setInspectorEnd(newEnd);
    setFieldEdited((prev) => ({ ...prev, end: true }));
    pushHistory({ endTime: newEnd });
    toast.info(`Marked Out at ${formatDuration(newEnd)}`);
  };

  // Save clip changes to API
  const handleSaveClip = async () => {
    if (!selectedClipId) return;
    try {
      const res = await fetch("/api/clips", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedClipId,
          title: inspectorTitle,
          startTime: inspectorStart,
          endTime: inspectorEnd,
          hook: inspectorHook,
          caption: inspectorCaption,
          platform: inspectorPlatform,
          status: inspectorStatus,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save clip");
      }

      const data = await res.json();
      setClips((prev) =>
        prev.map((c) => (c._id === selectedClipId ? ({ ...c, ...data.clip } as IClip) : c))
      );
      setFieldEdited({});
      toast.success("Clip saved successfully!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save clip";
      toast.error(msg);
    }
  };

  // Duplicate clip
  const handleDuplicateClip = async () => {
    try {
      const res = await fetch("/api/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${inspectorTitle} (Copy)`,
          startTime: inspectorStart,
          endTime: inspectorEnd,
          hook: inspectorHook,
          caption: inspectorCaption,
          platform: inspectorPlatform,
          assetId: selectedAssetId,
          status: "SUGGESTED",
          origin: "manual",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to duplicate clip");
      }

      const data = await res.json();
      setClips((prev) => [data.clip, ...prev]);
      loadClipIntoInspector(data.clip);
      toast.success("Clip duplicated!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to duplicate clip";
      toast.error(msg);
    }
  };

  // Split clip at playhead
  const handleSplitAtPlayhead = async () => {
    if (currentTime <= inspectorStart || currentTime >= inspectorEnd) {
      toast.error("Playhead must be inside the clip range to split.");
      return;
    }

    try {
      const splitTime = Math.round(currentTime * 10) / 10;
      const putRes = await fetch("/api/clips", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedClipId,
          endTime: splitTime,
        }),
      });

      if (!putRes.ok) {
        const d = await putRes.json().catch(() => ({}));
        throw new Error(d.error || "Failed to update first segment");
      }

      const postRes = await fetch("/api/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${inspectorTitle} (Part 2)`,
          startTime: splitTime,
          endTime: inspectorEnd,
          hook: inspectorHook,
          caption: inspectorCaption,
          platform: inspectorPlatform,
          assetId: selectedAssetId,
          status: inspectorStatus,
          origin: "manual",
        }),
      });

      if (!postRes.ok) {
        const d = await postRes.json().catch(() => ({}));
        throw new Error(d.error || "Failed to create second segment");
      }

      const postData = await postRes.json();
      setClips((prev) =>
        prev
          .map((c) => (c._id === selectedClipId ? { ...c, endTime: splitTime } : c))
          .concat(postData.clip)
      );
      setInspectorEnd(splitTime);
      toast.success("Clip split at playhead!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to split clip";
      toast.error(msg);
    }
  };

  // Delete clip with ConfirmDialog
  const handleDeleteClip = () => {
    if (!selectedClipId) return;

    setConfirmDialog({
      isOpen: true,
      title: "Delete Clip",
      message: `Are you sure you want to delete "${inspectorTitle || "this clip"}"? This cannot be undone.`,
      confirmLabel: "Delete Clip",
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/clips?id=${selectedClipId}`, { method: "DELETE" });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to delete clip");
          }
          setClips((prev) => prev.filter((c) => c._id !== selectedClipId));
          setSelectedClipId("");
          toast.success("Clip deleted.");
          setConfirmDialog(null);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Failed to delete clip";
          toast.error(msg);
          setConfirmDialog(null);
        }
      },
    });
  };

  // TASK 6: Delete footage from Studio
  const handleDeleteFootage = () => {
    if (!selectedAssetId) return;
    const currentAsset = videoAssets.find((a) => a._id === selectedAssetId);
    const footageClips = clips.filter((c) => c.assetId === selectedAssetId);

    setConfirmDialog({
      isOpen: true,
      title: "Delete Source Footage",
      message: (
        <div>
          <p>
            Are you sure you want to delete &ldquo;{currentAsset?.name || "this footage"}&rdquo;?
          </p>
          <p className="mt-2 text-rose-700 font-semibold">
            This will also delete {footageClips.length} associated clip
            {footageClips.length === 1 ? "" : "s"}.
          </p>
        </div>
      ),
      confirmLabel: "Delete Footage & Clips",
      variant: "danger",
      onConfirm: async () => {
        try {
          setConfirmDialog((prev) => (prev ? { ...prev, isLoading: true } : null));

          // 1. Delete asset from API
          const res = await fetch(`/api/assets?id=${selectedAssetId}`, { method: "DELETE" });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            throw new Error(d.error || "Failed to delete asset");
          }

          // 2. Delete associated clips
          await Promise.all(
            footageClips.map((c) =>
              fetch(`/api/clips?id=${c._id}`, { method: "DELETE" }).catch(() => {})
            )
          );

          // 3. Update state lists
          const remainingAssets = videoAssets.filter((a) => a._id !== selectedAssetId);
          const remainingClips = clips.filter((c) => c.assetId !== selectedAssetId);
          setVideoAssets(remainingAssets);
          setClips(remainingClips);

          toast.success("Footage and associated clips deleted.");
          setConfirmDialog(null);

          // 4. Select next asset or empty state
          if (remainingAssets.length > 0) {
            performFootageSwitch(remainingAssets[0]._id || "");
          } else {
            setSelectedAssetId("");
            setSelectedClipId("");
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Failed to delete footage";
          toast.error(msg);
          setConfirmDialog(null);
        }
      },
    });
  };

  // TASK 2: Upload inside Studio
  const handleStudioUploadFile = async (file: File) => {
    setStudioUploadError("");
    const allowedExts = [".mp4", ".webm", ".mov"];
    const fileExt = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    const isVideo = file.type.startsWith("video/") || allowedExts.includes(fileExt);

    if (!isVideo) {
      const msg = `Unsupported file type "${file.name}". Allowed formats: MP4, WebM, MOV.`;
      setStudioUploadError(msg);
      toast.error(msg);
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      const msg = `File size exceeds the 100 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`;
      setStudioUploadError(msg);
      toast.error(msg);
      return;
    }

    const controller = new AbortController();
    studioUploadControllerRef.current = controller;
    setStudioUploadProgress(0);
    setStudioUploadFileName(file.name);

    try {
      const newAsset = await uploadInChunks(file, {
        filename: file.name,
        mimeType: file.type || "video/webm",
        signal: controller.signal,
        onProgress: (pct) => setStudioUploadProgress(pct),
      });

      toast.success(`"${file.name}" uploaded successfully!`);

      // Refresh video assets
      const aRes = await fetch("/api/assets?type=video");
      if (aRes.ok) {
        const ad = await aRes.json();
        setVideoAssets(ad.assets || []);
      } else {
        setVideoAssets((prev) => [newAsset, ...prev]);
      }

      // Auto-select and display new asset immediately
      setSelectedAssetId(newAsset._id || "");
      setSelectedClipId("");
      setCurrentTime(0);
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        toast.info("Upload cancelled.");
      } else {
        const msg = err instanceof Error ? err.message : "Failed to upload video";
        setStudioUploadError(msg);
        toast.error(msg);
      }
    } finally {
      setStudioUploadProgress(null);
      studioUploadControllerRef.current = null;
      if (studioFileInputRef.current) studioFileInputRef.current.value = "";
    }
  };

  // Regenerate Hook / Caption via Gemini
  const handleRegenerateHook = async () => {
    setRegeneratingHook(true);
    setInspectorAiError(null);
    try {
      const res = await fetch("/api/clips/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: "hook",
          title: inspectorTitle,
          platform: inspectorPlatform,
          currentText: inspectorHook,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.text) {
        throw new Error(data.error || "Failed to regenerate hook");
      }
      setInspectorHook(data.text);
      setFieldEdited((prev) => ({ ...prev, hook: false }));
      pushHistory({ hook: data.text });
      toast.success("Hook regenerated!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to regenerate hook";
      setInspectorAiError({
        message: "The AI model is unavailable right now, please try again",
        rawError: msg,
      });
      toast.error("The AI model is unavailable right now, please try again", msg);
    } finally {
      setRegeneratingHook(false);
    }
  };

  const handleRegenerateCaption = async () => {
    setRegeneratingCaption(true);
    setInspectorAiError(null);
    try {
      const res = await fetch("/api/clips/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: "caption",
          title: inspectorTitle,
          platform: inspectorPlatform,
          currentText: inspectorCaption,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.text) {
        throw new Error(data.error || "Failed to regenerate caption");
      }
      setInspectorCaption(data.text);
      setFieldEdited((prev) => ({ ...prev, caption: false }));
      pushHistory({ caption: data.text });
      toast.success("Caption regenerated!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to regenerate caption";
      setInspectorAiError({
        message: "The AI model is unavailable right now, please try again",
        rawError: msg,
      });
      toast.error("The AI model is unavailable right now, please try again", msg);
    } finally {
      setRegeneratingCaption(false);
    }
  };

  // Browser MediaRecorder Render & Export Engine
  const handleRenderExport = async () => {
    if (!selectedAssetId || !videoRef.current) return;

    if (typeof MediaRecorder === "undefined") {
      toast.error("MediaRecorder is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportMessage("Initializing rendering canvas...");

    const sourceVideo = document.createElement("video");
    sourceVideo.src = `/api/assets/file/${selectedAssetId}`;
    sourceVideo.crossOrigin = "anonymous";
    sourceVideo.preload = "auto";
    sourceVideo.muted = false;

    await new Promise((resolve) => {
      sourceVideo.onloadedmetadata = resolve;
      sourceVideo.load();
    });

    const canvas = document.createElement("canvas");
    let targetWidth = 1080;
    let targetHeight = 1920;

    if (aspectRatio === "1:1") {
      targetWidth = 1080;
      targetHeight = 1080;
    } else if (aspectRatio === "16:9") {
      targetWidth = 1920;
      targetHeight = 1080;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsExporting(false);
      toast.error("Failed to acquire 2D rendering canvas context.");
      return;
    }

    const stream = canvas.captureStream(30);

    try {
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaElementSource(sourceVideo);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
    } catch {
      // Audio capture fallback
    }

    const recordedChunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm",
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    const clipDuration = Math.max(0.5, inspectorEnd - inspectorStart);
    sourceVideo.currentTime = inspectorStart;

    await new Promise((r) => setTimeout(r, 500));

    mediaRecorder.start();
    sourceVideo.play();

    setExportMessage("Burning video crop & caption overlay...");

    const drawInterval = setInterval(() => {
      if (sourceVideo.currentTime >= inspectorEnd || sourceVideo.paused || sourceVideo.ended) {
        clearInterval(drawInterval);
        sourceVideo.pause();
        mediaRecorder.stop();
        return;
      }

      const progress = Math.min(
        100,
        Math.round(((sourceVideo.currentTime - inspectorStart) / clipDuration) * 100)
      );
      setExportProgress(progress);

      const vWidth = sourceVideo.videoWidth || 1920;
      const vHeight = sourceVideo.videoHeight || 1080;

      const targetAspect = targetWidth / targetHeight;
      const videoAspect = vWidth / vHeight;

      let sWidth = vWidth;
      let sHeight = vHeight;
      let sx = 0;
      let sy = 0;

      if (videoAspect > targetAspect) {
        sWidth = vHeight * targetAspect;
        sx = (vWidth - sWidth) * (focusX / 100);
      } else {
        sHeight = vWidth / targetAspect;
        sy = (vHeight - sHeight) * (focusY / 100);
      }

      ctx.drawImage(sourceVideo, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

      if (showCaptionOverlay && (inspectorHook || inspectorCaption)) {
        const text = inspectorHook || inspectorCaption;
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const fontSize = captionSize === "lg" ? 48 : captionSize === "md" ? 38 : 28;
        ctx.font = `bold ${fontSize}px sans-serif`;

        let yPos = targetHeight * 0.82;
        if (captionPosition === "top") yPos = targetHeight * 0.18;
        if (captionPosition === "center") yPos = targetHeight * 0.5;

        const maxLineWidth = targetWidth * 0.85;
        const words = text.split(" ");
        const lines = [];
        let curLine = "";

        for (const w of words) {
          const testLine = curLine ? `${curLine} ${w}` : w;
          if (ctx.measureText(testLine).width > maxLineWidth) {
            lines.push(curLine);
            curLine = w;
          } else {
            curLine = testLine;
          }
        }
        if (curLine) lines.push(curLine);

        const lineHeight = fontSize * 1.35;
        const boxHeight = lines.length * lineHeight + 30;
        const boxY = yPos - boxHeight / 2;

        ctx.beginPath();
        ctx.roundRect(targetWidth * 0.05, boxY, targetWidth * 0.9, boxHeight, 24);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        lines.forEach((l, idx) => {
          ctx.fillText(l, targetWidth / 2, boxY + 20 + idx * lineHeight + fontSize / 2);
        });

        ctx.restore();
      }
    }, 1000 / 30);

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setExportBlob(blob);
      setExportedUrl(url);
      setIsExporting(false);
      setExportProgress(100);
      setExportMessage("Clip render complete! Ready to download or save.");
      toast.success("Clip rendered successfully!");
    };
  };

  // TASK 1: Upload exported / recorded blob to MongoDB assets via shared uploadInChunks
  const handleSaveToAssets = async (blob: Blob, name: string) => {
    try {
      setExportMessage("Uploading clip to MongoDB assets (0%)...");
      const filename =
        name.endsWith(".webm") || name.endsWith(".mp4") ? name : `${name || "clip"}.webm`;

      const newAsset = await uploadInChunks(blob, {
        filename,
        mimeType: blob.type || "video/webm",
        onProgress: (pct) => {
          setExportProgress(pct);
          setExportMessage(`Uploading clip to MongoDB assets (${pct}%)...`);
        },
      });

      setExportMessage("Saved successfully to Assets library!");
      toast.success("Saved successfully to Assets library!");

      const aRes = await fetch("/api/assets?type=video");
      if (aRes.ok) {
        const ad = await aRes.json();
        setVideoAssets(ad.assets || []);
      } else {
        setVideoAssets((prev) => [newAsset, ...prev]);
      }
      return newAsset;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setExportMessage(`Failed to save to assets: ${msg}`);
      toast.error(`Failed to save to assets: ${msg}`);
      throw e;
    }
  };

  // Export Cut List (CSV)
  const handleExportCutList = () => {
    const headers = [
      "Title",
      "Start Time (s)",
      "End Time (s)",
      "Duration (s)",
      "Platform",
      "Hook",
      "Caption",
    ];
    const rows = assetClips.map((c) => [
      `"${c.title.replace(/"/g, '""')}"`,
      c.startTime,
      c.endTime,
      c.endTime - c.startTime,
      `"${c.platform}"`,
      `"${(c.hook || "").replace(/"/g, '""')}"`,
      `"${(c.caption || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cut_list_${selectedAsset?.name || "clips"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Cut list CSV exported!");
  };

  // TASK 5: Live track stopper & tab cleanup
  const stopLiveTracks = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    if (recordVideoPreviewRef.current) {
      recordVideoPreviewRef.current.srcObject = null;
    }
  }, [cameraStream]);

  // Clean up hardware tracks and blob URLs on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [cameraStream, recordedVideoUrl]);

  // Warn user before leaving page if unsaved take exists
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (recordedBlob) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [recordedBlob]);

  // Record Studio Functions
  const startCameraRecording = async () => {
    try {
      if (recordMode === "screen" && (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia)) {
        toast.error("Screen recording is not supported in this browser.");
        return;
      }

      const stream =
        recordMode === "camera"
          ? await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          : await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });

      setCameraStream(stream);
      if (recordVideoPreviewRef.current) {
        recordVideoPreviewRef.current.srcObject = stream;
        recordVideoPreviewRef.current.play().catch(() => {});
      }

      recordedChunksRef.current = [];
      setRecordedBytes(0);

      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const recorder = new MediaRecorder(stream, { mimeType: mime });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
          setRecordedBytes((prev) => prev + e.data.size);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        stream.getTracks().forEach((t) => t.stop());
        setCameraStream(null);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
      setRecordSeconds(0);
      setIsPrompterScrolling(true);
    } catch (err: unknown) {
      let msg = "Could not start recording.";
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          msg =
            "Camera and microphone permissions were denied. Please allow permissions in your browser settings.";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          msg = "No camera or microphone hardware was detected.";
        } else {
          msg = err.message;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      toast.error(msg);
    }
  };

  const stopCameraRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPrompterScrolling(false);
    }
  };

  // Discard take with confirmation
  const handleDiscardTake = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Discard Recording",
      message: "Are you sure you want to discard this recorded take? This cannot be undone.",
      confirmLabel: "Discard Take",
      variant: "danger",
      onConfirm: () => {
        if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
        setRecordedVideoUrl(null);
        setRecordedBlob(null);
        recordedChunksRef.current = [];
        setRecordSeconds(0);
        setRecordedBytes(0);
        setConfirmDialog(null);
        toast.info("Recording discarded.");
      },
    });
  };

  // Retake recording
  const handleRetake = () => {
    if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
    setRecordedVideoUrl(null);
    setRecordedBlob(null);
    recordedChunksRef.current = [];
    setRecordSeconds(0);
    setRecordedBytes(0);
    startCameraRecording();
  };

  // Download recorded take
  const handleDownloadTake = () => {
    if (!recordedBlob || !recordedVideoUrl) return;
    const a = document.createElement("a");
    a.href = recordedVideoUrl;
    a.download = `take_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.webm`;
    a.click();
    toast.success("Download started!");
  };

  // Save recorded take to Assets and optionally switch to Edit tab
  const handleSaveTake = async (andEditInStudio: boolean) => {
    if (!recordedBlob) return;
    setIsSavingTake(true);
    setTakeSaveProgress(0);

    try {
      const filename = `take_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.webm`;
      const newAsset = await uploadInChunks(recordedBlob, {
        filename,
        mimeType: "video/webm",
        durationSeconds: recordSeconds > 0 ? recordSeconds : undefined,
        onProgress: (pct) => setTakeSaveProgress(pct),
      });

      toast.success("Recording saved to Assets library!");

      // Refresh video assets
      const aRes = await fetch("/api/assets?type=video");
      if (aRes.ok) {
        const ad = await aRes.json();
        setVideoAssets(ad.assets || []);
      } else {
        setVideoAssets((prev) => [newAsset, ...prev]);
      }

      // Cleanup take
      if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
      setRecordedBlob(null);
      recordedChunksRef.current = [];
      setRecordSeconds(0);
      setRecordedBytes(0);

      if (andEditInStudio) {
        setSelectedAssetId(newAsset._id || "");
        setSelectedClipId("");
        setCurrentTime(0);
        setActiveTab("edit");
        toast.info("Opened recorded take in Studio Editor.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save take";
      toast.error(msg);
    } finally {
      setIsSavingTake(false);
      setTakeSaveProgress(0);
    }
  };

  // Teleprompter scroll effect
  useEffect(() => {
    let prompterTimer: ReturnType<typeof setInterval> | undefined;
    if (isPrompterScrolling && prompterContainerRef.current) {
      prompterTimer = setInterval(() => {
        if (prompterContainerRef.current) {
          prompterContainerRef.current.scrollTop += prompterSpeed;
        }
      }, 50);
    }
    return () => {
      if (prompterTimer) clearInterval(prompterTimer);
    };
  }, [isPrompterScrolling, prompterSpeed]);

  // Recording timer effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isRecording) {
      timer = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  const selectedScript = scripts.find((s) => s._id === selectedScriptId);

  return (
    <div className="space-y-6">
      {/* Hidden file input for Studio upload */}
      <input
        type="file"
        ref={studioFileInputRef}
        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleStudioUploadFile(file);
        }}
      />

      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-black/10 bg-black/5 px-3 py-1 text-[11px] font-bold text-[#111214]">
              <Scissors className="h-3.5 w-3.5" />
              CreatorAI Video Studio
            </span>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
              Interactive Timeline & Export
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#111214] sm:text-3xl">
            Watch, Edit, Record & Export
          </h1>
          <p className="mt-1 text-xs text-[#77797c] sm:text-sm">
            Fine-tune AI-suggested clips, burn custom platform crops with hook overlays, or record
            new footage with the built-in teleprompter.
          </p>
        </div>

        {/* View Switcher: Studio Editor vs Record Booth */}
        <div className="flex items-center rounded-2xl border border-black/10 bg-white/70 p-1 shadow-sm backdrop-blur-xl">
          <button
            onClick={() => {
              stopLiveTracks();
              setActiveTab("edit");
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "edit"
                ? "bg-[#111214] text-white shadow-md"
                : "text-[#77797c] hover:text-[#111214]"
            }`}
          >
            <Scissors className="h-3.5 w-3.5" />
            Studio Editor
          </button>
          <button
            onClick={() => setActiveTab("record")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "record"
                ? "bg-[#111214] text-white shadow-md"
                : "text-[#77797c] hover:text-[#111214]"
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            Recording Booth
          </button>
        </div>
      </div>

      {/* Global Upload Progress in Studio (Task 2) */}
      {studioUploadProgress !== null && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3.5 text-xs text-[#111214] shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between font-semibold">
                <span className="truncate">Uploading &ldquo;{studioUploadFileName}&rdquo;</span>
                <span className="font-mono text-indigo-700">{studioUploadProgress}%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-indigo-200">
                <div
                  className="h-full bg-indigo-600 transition-all duration-200"
                  style={{ width: `${studioUploadProgress}%` }}
                />
              </div>
            </div>
          </div>
          <button
            onClick={() => studioUploadControllerRef.current?.abort()}
            className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-[#111214] hover:bg-black/5"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Studio Upload Error Message */}
      {studioUploadError && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-900">
          <span>{studioUploadError}</span>
          <button
            onClick={() => setStudioUploadError("")}
            className="rounded-lg p-1 text-rose-700 hover:bg-rose-500/20"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {activeTab === "edit" ? (
        <div className="space-y-6">
          {/* Source Video Asset Selector Bar (Tasks 2 & 6) */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-[#111214]">Source Footage:</span>
              {videoAssets.length > 0 ? (
                <select
                  value={selectedAssetId}
                  onChange={(e) => handleSelectFootage(e.target.value)}
                  className="max-w-[240px] truncate rounded-2xl border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#111214] outline-none focus:border-black"
                >
                  {videoAssets.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({(v.size / (1024 * 1024)).toFixed(1)} MB)
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs italic text-[#77797c]">No footage uploaded</span>
              )}

              {/* Upload video button in Source Footage bar */}
              <button
                onClick={() => studioFileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-[#111214] hover:bg-black/5 transition"
              >
                <Upload className="h-3.5 w-3.5 text-indigo-600" />
                Upload Video
              </button>

              {/* Delete footage button (Task 6) */}
              {selectedAssetId && (
                <button
                  onClick={handleDeleteFootage}
                  title="Delete this footage and its clips"
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-500/20 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Footage
                </button>
              )}

              <span className="text-xs text-[#77797c]">
                {assetClips.length} clip{assetClips.length === 1 ? "" : "s"} on this footage
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Add Clip button */}
              {selectedAssetId && (
                <button
                  onClick={handleAddManualClip}
                  title="Create 15s clip at playhead"
                  className="btn-primary flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Clip
                </button>
              )}

              <button
                onClick={handleExportCutList}
                disabled={assetClips.length === 0}
                title="Export EDL / CSV cut list"
                className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#44464a] hover:bg-black/5 disabled:opacity-40"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Export Cut List (CSV)
              </button>

              <Link
                href={
                  selectedAssetId
                    ? `/dashboard/video-intelligence?assetId=${selectedAssetId}`
                    : "/dashboard/video-intelligence"
                }
                className="btn-secondary flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold"
              >
                <Sparkles className="h-3 w-3" />
                Find More Clips
              </Link>
            </div>
          </div>

          {/* Empty state when NO footage exists (Task 2 Drag & Drop) */}
          {videoAssets.length === 0 ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingFootage(true);
              }}
              onDragLeave={() => setIsDraggingFootage(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingFootage(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleStudioUploadFile(file);
              }}
              className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 text-center transition ${
                isDraggingFootage
                  ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
                  : "border-black/15 bg-white/60 backdrop-blur-xl"
              }`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/5 text-[#111214]">
                <UploadCloud className="h-7 w-7 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#111214]">
                No footage yet: upload a video, record one, or pick from your assets
              </h3>
              <p className="mt-1 max-w-md text-xs text-[#77797c]">
                Drag and drop your video file here (MP4, WebM, MOV up to 100 MB) or choose an action
                below to start editing clips.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => studioFileInputRef.current?.click()}
                  className="btn-primary rounded-xl px-4 py-2 text-xs font-bold"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload Video
                </button>
                <button
                  onClick={() => setActiveTab("record")}
                  className="btn-secondary rounded-xl px-4 py-2 text-xs font-bold"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Record Footage
                </button>
                <Link
                  href="/dashboard/assets"
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-[#111214] hover:bg-black/5"
                >
                  Pick from Assets
                </Link>
              </div>
            </div>
          ) : (
            /* Studio Main Workspace: Player & Timeline on Left, Inspector on Right */
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left 7 Columns: Player, Timeline, Format Preview */}
              <div className="space-y-5 lg:col-span-7">
                {/* HTML5 Video Player */}
                <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-black/15 bg-[#111214] shadow-lg">
                  {selectedAssetId ? (
                    <video
                      ref={videoRef}
                      src={`/api/assets/file/${selectedAssetId}`}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      muted={isMuted}
                      playsInline
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-white/50">
                      No video asset selected.
                    </div>
                  )}

                  {/* Overlaid Player Controls */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={togglePlay}
                          aria-label={isPlaying ? "Pause" : "Play"}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-md transition hover:bg-white/30"
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
                        </button>

                        <button
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.currentTime = inspectorStart;
                              setCurrentTime(inspectorStart);
                            }
                          }}
                          title="Jump to Clip Start"
                          className="rounded-xl p-2 text-white/80 hover:bg-white/20"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>

                        <span className="font-mono text-xs font-semibold">
                          {formatDuration(currentTime)} / {formatDuration(safeDuration)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setLoopClip(!loopClip)}
                          className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                            loopClip
                              ? "bg-emerald-500/80 text-white"
                              : "bg-white/10 text-white/60 hover:text-white"
                          }`}
                        >
                          Loop Clip: {loopClip ? "ON" : "OFF"}
                        </button>

                        <select
                          value={playbackSpeed}
                          onChange={(e) => handleSpeedChange(Number(e.target.value))}
                          className="rounded-xl bg-white/20 px-2 py-1 text-[11px] font-bold text-white outline-none"
                        >
                          <option value={0.5} className="text-black">0.5x</option>
                          <option value={1} className="text-black">1.0x</option>
                          <option value={1.25} className="text-black">1.25x</option>
                          <option value={1.5} className="text-black">1.5x</option>
                          <option value={2} className="text-black">2.0x</option>
                        </select>

                        <button
                          onClick={() => {
                            setIsMuted(!isMuted);
                            if (videoRef.current) videoRef.current.muted = !isMuted;
                          }}
                          className="rounded-xl p-2 text-white/80 hover:bg-white/20"
                        >
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Timeline with Clips, Handles & Scrubber (Tasks 3 & 4) */}
                <div className="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#111214]">Interactive Clip Timeline</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleMarkIn}
                        disabled={!selectedClipId}
                        title="Set clip start at playhead"
                        className="rounded-lg border border-black/10 bg-white px-2 py-1 text-[11px] font-bold text-[#111214] hover:bg-black/5 disabled:opacity-40"
                      >
                        [ Mark In
                      </button>
                      <button
                        onClick={handleMarkOut}
                        disabled={!selectedClipId}
                        title="Set clip end at playhead"
                        className="rounded-lg border border-black/10 bg-white px-2 py-1 text-[11px] font-bold text-[#111214] hover:bg-black/5 disabled:opacity-40"
                      >
                        Mark Out ]
                      </button>
                      <button
                        onClick={handleAddManualClip}
                        className="rounded-lg bg-[#111214] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-black transition"
                      >
                        + Add Clip
                      </button>
                    </div>
                  </div>

                  {/* Timeline Bar Container with Draggable Handles */}
                  <div
                    ref={timelineBarRef}
                    className="relative mt-3 h-14 w-full select-none rounded-2xl bg-black/10 p-1"
                  >
                    {/* Render non-selected clip bands */}
                    {safeDuration > 0 &&
                      assetClips.map((c) => {
                        const isSelected = c._id === selectedClipId;
                        if (isSelected) return null; // rendered with handles below

                        const leftPct = getTimelinePercent(c.startTime);
                        const widthPct = Math.max(2, getTimelinePercent(c.endTime) - leftPct);

                        return (
                          <div
                            key={c._id}
                            onClick={() => loadClipIntoInspector(c)}
                            title={`${c.title} (${c.startTime}s - ${c.endTime}s)`}
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                            }}
                            className="absolute top-2 bottom-2 cursor-pointer rounded-xl border border-black/10 bg-indigo-500/25 hover:bg-indigo-500/40 text-[#111214] transition z-5"
                          >
                            <div className="truncate px-2 py-1 text-[10px] font-bold">
                              {c.title}
                            </div>
                          </div>
                        );
                      })}

                    {/* Active Selected Clip with Draggable Handles */}
                    {safeDuration > 0 && selectedClipId && (
                      <div
                        style={{
                          left: `${getTimelinePercent(inspectorStart)}%`,
                          width: `${Math.max(
                            2,
                            getTimelinePercent(inspectorEnd) - getTimelinePercent(inspectorStart)
                          )}%`,
                        }}
                        className="absolute top-1 bottom-1 rounded-xl border-2 border-[#111214] bg-[#111214] text-white shadow-md z-15"
                      >
                        {/* Left Handle (In Point) */}
                        <div
                          onMouseDown={(e) => handleHandlePointerDown("start", e)}
                          onTouchStart={(e) => handleHandlePointerDown("start", e)}
                          title="Drag to trim Start"
                          className="absolute -left-2 top-0 bottom-0 w-4 cursor-ew-resize flex items-center justify-center z-30 group"
                        >
                          <div className="h-7 w-1.5 rounded-full bg-white shadow-md ring-2 ring-[#111214] group-hover:scale-110 transition-transform" />
                        </div>

                        {/* Title text */}
                        <div className="truncate px-3 py-1.5 text-[10px] font-bold">
                          {inspectorTitle || "Active Clip"} ({formatDuration(inspectorStart)} -{" "}
                          {formatDuration(inspectorEnd)})
                        </div>

                        {/* Right Handle (Out Point) */}
                        <div
                          onMouseDown={(e) => handleHandlePointerDown("end", e)}
                          onTouchStart={(e) => handleHandlePointerDown("end", e)}
                          title="Drag to trim End"
                          className="absolute -right-2 top-0 bottom-0 w-4 cursor-ew-resize flex items-center justify-center z-30 group"
                        >
                          <div className="h-7 w-1.5 rounded-full bg-white shadow-md ring-2 ring-[#111214] group-hover:scale-110 transition-transform" />
                        </div>
                      </div>
                    )}

                    {/* Playhead Scrubber */}
                    {safeDuration > 0 && (
                      <div
                        style={{
                          left: `${getTimelinePercent(currentTime)}%`,
                        }}
                        className="pointer-events-none absolute top-0 bottom-0 z-20 w-0.5 bg-red-600 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                      >
                        <div className="absolute -top-1.5 -left-1.5 h-3.5 w-3.5 rounded-full bg-red-600 ring-2 ring-white" />
                      </div>
                    )}
                  </div>

                  {/* Scrub Slider Input */}
                  <input
                    type="range"
                    min={0}
                    max={safeDuration > 0 ? safeDuration : 100}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="mt-3 w-full accent-[#111214]"
                  />

                  {/* Range Markers under timeline */}
                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#77797c]">
                    <span>00:00</span>
                    <span>{formatDuration(safeDuration / 2)}</span>
                    <span>{formatDuration(safeDuration)}</span>
                  </div>
                </div>

                {/* Format Preview & Caption Overlay Settings */}
                <div className="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#111214]">
                      Social Format Preview & Focus Positioning
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {(["9:16", "1:1", "16:9"] as const).map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => setAspectRatio(ratio)}
                          className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                            aspectRatio === ratio
                              ? "bg-[#111214] text-white shadow-sm"
                              : "bg-black/5 text-[#77797c] hover:bg-black/10 hover:text-[#111214]"
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Crop Focus Point Sliders */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#111214]">Horizontal Focus (X)</span>
                          <span className="font-mono text-[#77797c]">{focusX}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={focusX}
                          onChange={(e) => setFocusX(Number(e.target.value))}
                          className="mt-1 w-full accent-[#111214]"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#111214]">Vertical Focus (Y)</span>
                          <span className="font-mono text-[#77797c]">{focusY}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={focusY}
                          onChange={(e) => setFocusY(Number(e.target.value))}
                          className="mt-1 w-full accent-[#111214]"
                        />
                      </div>

                      <div className="pt-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-[#111214]">
                          <input
                            type="checkbox"
                            checked={showCaptionOverlay}
                            onChange={(e) => setShowCaptionOverlay(e.target.checked)}
                            className="rounded accent-[#111214]"
                          />
                          Burn Caption Overlay on Export
                        </label>
                      </div>

                      {showCaptionOverlay && (
                        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                          <div>
                            <label className="text-[10px] font-bold text-[#77797c]">Position</label>
                            <select
                              value={captionPosition}
                              onChange={(e) =>
                                setCaptionPosition(e.target.value as "top" | "center" | "bottom")
                              }
                              className="mt-1 w-full rounded-xl border border-black/15 bg-white p-1.5 font-semibold text-[#111214]"
                            >
                              <option value="top">Top (18%)</option>
                              <option value="center">Center</option>
                              <option value="bottom">Bottom (82%)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#77797c]">Size</label>
                            <select
                              value={captionSize}
                              onChange={(e) =>
                                setCaptionSize(e.target.value as "sm" | "md" | "lg")
                              }
                              className="mt-1 w-full rounded-xl border border-black/15 bg-white p-1.5 font-semibold text-[#111214]"
                            >
                              <option value="sm">Small</option>
                              <option value="md">Medium</option>
                              <option value="lg">Large</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Live Mini Preview Box */}
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-black/10 bg-black/5 p-4">
                      <div
                        style={{
                          aspectRatio:
                            aspectRatio === "9:16"
                              ? "9/16"
                              : aspectRatio === "1:1"
                              ? "1/1"
                              : "16/9",
                          maxHeight: "180px",
                        }}
                        className="relative overflow-hidden rounded-xl border-2 border-black/20 bg-[#111214] shadow-md"
                      >
                        {selectedAssetId && (
                          <video
                            src={`/api/assets/file/${selectedAssetId}`}
                            className="h-full w-full object-cover"
                            style={{
                              objectPosition: `${focusX}% ${focusY}%`,
                            }}
                          />
                        )}
                        {showCaptionOverlay && (inspectorHook || inspectorCaption) && (
                          <div
                            style={{
                              top:
                                captionPosition === "top"
                                  ? "15%"
                                  : captionPosition === "center"
                                  ? "50%"
                                  : "80%",
                              transform: "translateY(-50%)",
                            }}
                            className="absolute inset-x-2 text-center"
                          >
                            <span className="rounded-lg bg-black/75 px-2 py-1 text-[9px] font-bold text-white shadow-sm">
                              {inspectorHook || inspectorCaption}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="mt-2 text-[10px] font-bold text-[#77797c]">
                        {aspectRatio} Live Crop Frame
                      </span>
                    </div>
                  </div>

                  {/* Render & Export Actions */}
                  <div className="mt-5 border-t border-black/10 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        onClick={handleRenderExport}
                        disabled={isExporting || !selectedClipId}
                        className="btn-primary flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold shadow-md transition disabled:opacity-50"
                      >
                        {isExporting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Rendering Clip ({exportProgress}%)...</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            <span>Export & Burn Selected Clip (.webm)</span>
                          </>
                        )}
                      </button>

                      {exportedUrl && exportBlob && (
                        <div className="flex items-center gap-2">
                          <a
                            href={exportedUrl}
                            download={`${inspectorTitle || "clip"}_${aspectRatio.replace(":", "x")}.webm`}
                            className="btn-secondary flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download .webm
                          </a>

                          <button
                            onClick={() => handleSaveToAssets(exportBlob, inspectorTitle)}
                            className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[#111214] hover:bg-black/5"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            Save to Assets
                          </button>
                        </div>
                      )}
                    </div>

                    {exportMessage && (
                      <p className="mt-2 text-xs font-medium text-[#111214]">{exportMessage}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right 5 Columns: Clip Inspector Panel */}
              <div className="space-y-5 lg:col-span-5">
                <div className="rounded-3xl border border-white/80 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
                  {/* Inspector Header with Undo/Redo & Actions */}
                  <div className="flex items-center justify-between border-b border-black/10 pb-4">
                    <div>
                      <h3 className="text-base font-black tracking-tight text-[#111214]">
                        Clip Inspector
                      </h3>
                      <p className="text-[11px] text-[#77797c]">
                        All AI edits remain 100% human-customizable
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleUndo}
                        disabled={historyIndex <= 0}
                        title="Undo change"
                        className="rounded-xl p-1.5 text-[#77797c] hover:bg-black/5 disabled:opacity-30"
                      >
                        <Undo2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleRedo}
                        disabled={historyIndex >= history.length - 1}
                        title="Redo change"
                        className="rounded-xl p-1.5 text-[#77797c] hover:bg-black/5 disabled:opacity-30"
                      >
                        <Redo2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {selectedClipId ? (
                    <div className="mt-4 space-y-4">
                      {/* Title */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
                            Clip Title
                          </label>
                          <span className="text-[9px] font-bold text-[#77797c]">
                            {fieldEdited.title ? "Edited by you" : "Saved"}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={inspectorTitle}
                          onChange={(e) => {
                            setInspectorTitle(e.target.value);
                            setFieldEdited((prev) => ({ ...prev, title: true }));
                            pushHistory({ title: e.target.value });
                          }}
                          className="mt-1 w-full rounded-2xl border border-black/15 bg-white px-3 py-2 text-xs font-bold text-[#111214] outline-none focus:border-black"
                        />
                      </div>

                      {/* Start & End Range Controls */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
                            Start Time (sec)
                          </label>
                          <input
                            type="number"
                            step={0.1}
                            value={inspectorStart}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value));
                              setInspectorStart(val);
                              setFieldEdited((prev) => ({ ...prev, start: true }));
                              pushHistory({ startTime: val });
                              if (videoRef.current) videoRef.current.currentTime = val;
                            }}
                            className="mt-1 w-full rounded-2xl border border-black/15 bg-white px-3 py-2 font-mono text-xs font-semibold text-[#111214] outline-none focus:border-black"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
                            End Time (sec)
                          </label>
                          <input
                            type="number"
                            step={0.1}
                            value={inspectorEnd}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setInspectorEnd(val);
                              setFieldEdited((prev) => ({ ...prev, end: true }));
                              pushHistory({ endTime: val });
                            }}
                            className="mt-1 w-full rounded-2xl border border-black/15 bg-white px-3 py-2 font-mono text-xs font-semibold text-[#111214] outline-none focus:border-black"
                          />
                        </div>
                      </div>

                      {/* Platform & Status */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
                            Target Platform
                          </label>
                          <select
                            value={inspectorPlatform}
                            onChange={(e) => {
                              setInspectorPlatform(e.target.value);
                              setFieldEdited((prev) => ({ ...prev, platform: true }));
                              pushHistory({ platform: e.target.value });
                            }}
                            className="mt-1 w-full rounded-2xl border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-[#111214] outline-none focus:border-black"
                          >
                            <option value="YouTube Shorts">YouTube Shorts</option>
                            <option value="Instagram Reels">Instagram Reels</option>
                            <option value="TikTok">TikTok</option>
                            <option value="LinkedIn">LinkedIn</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
                            Status
                          </label>
                          <select
                            value={inspectorStatus}
                            onChange={(e) => {
                              setInspectorStatus(e.target.value);
                              setFieldEdited((prev) => ({ ...prev, status: true }));
                              pushHistory({ status: e.target.value });
                            }}
                            className="mt-1 w-full rounded-2xl border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-[#111214] outline-none focus:border-black"
                          >
                            <option value="SUGGESTED">SUGGESTED</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="REJECTED">REJECTED</option>
                            <option value="READY">READY</option>
                          </select>
                        </div>
                      </div>

                      {/* AI Error Alert if regeneration failed */}
                      {inspectorAiError && (
                        <AIErrorAlert
                          message={inspectorAiError.message}
                          rawError={inspectorAiError.rawError}
                          onDismiss={() => setInspectorAiError(null)}
                        />
                      )}

                      {/* Hook with Gemini Regenerate */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
                            Spoken Opening Hook
                          </label>
                          <button
                            onClick={handleRegenerateHook}
                            disabled={regeneratingHook}
                            className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                          >
                            <RefreshCw className={`h-3 w-3 ${regeneratingHook ? "animate-spin" : ""}`} />
                            Regenerate Hook
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={inspectorHook}
                          onChange={(e) => {
                            setInspectorHook(e.target.value);
                            setFieldEdited((prev) => ({ ...prev, hook: true }));
                            pushHistory({ hook: e.target.value });
                          }}
                          className="mt-1 w-full rounded-2xl border border-black/15 bg-white p-3 text-xs text-[#111214] outline-none focus:border-black"
                        />
                      </div>

                      {/* Caption with Gemini Regenerate */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
                            Social Caption
                          </label>
                          <button
                            onClick={handleRegenerateCaption}
                            disabled={regeneratingCaption}
                            className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                          >
                            <RefreshCw className={`h-3 w-3 ${regeneratingCaption ? "animate-spin" : ""}`} />
                            Regenerate Caption
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          value={inspectorCaption}
                          onChange={(e) => {
                            setInspectorCaption(e.target.value);
                            setFieldEdited((prev) => ({ ...prev, caption: true }));
                            pushHistory({ caption: e.target.value });
                          }}
                          className="mt-1 w-full rounded-2xl border border-black/15 bg-white p-3 text-xs text-[#111214] outline-none focus:border-black"
                        />
                      </div>

                      {/* Inspector Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/10">
                        <button
                          onClick={handleSaveClip}
                          className="btn-primary flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-bold"
                        >
                          <Save className="h-3.5 w-3.5" />
                          Save Changes
                        </button>

                        <button
                          onClick={handleDuplicateClip}
                          className="flex items-center justify-center gap-1.5 rounded-2xl border border-black/10 bg-white py-2.5 text-xs font-semibold text-[#111214] hover:bg-black/5"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Duplicate
                        </button>

                        <button
                          onClick={handleSplitAtPlayhead}
                          title="Split clip at the current player timestamp"
                          className="flex items-center justify-center gap-1.5 rounded-2xl border border-black/10 bg-white py-2.5 text-xs font-semibold text-[#111214] hover:bg-black/5"
                        >
                          <Split className="h-3.5 w-3.5" />
                          Split at Playhead
                        </button>

                        <button
                          onClick={handleDeleteClip}
                          className="flex items-center justify-center gap-1.5 rounded-2xl border border-rose-500/20 bg-rose-500/10 py-2.5 text-xs font-bold text-rose-800 hover:bg-rose-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete Clip
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-[#77797c]">
                      {assetClips.length > 0
                        ? "Select a clip from the timeline or library below to edit and inspect."
                        : "No clips yet. Add a clip manually above to start editing."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Clips Library Grid & Empty State when asset has no clips (Task 3) */}
          {videoAssets.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-black/10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black tracking-tight text-[#111214]">
                  All Clips for this Footage ({assetClips.length})
                </h3>
                {assetClips.length > 0 && (
                  <button
                    onClick={handleAddManualClip}
                    className="flex items-center gap-1 rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-[#111214] hover:bg-black/5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Clip
                  </button>
                )}
              </div>

              {assetClips.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-black/10 bg-white/60 p-8 text-center backdrop-blur-xl">
                  <Film className="h-8 w-8 text-[#77797c]" />
                  <p className="mt-2 text-xs font-bold text-[#111214]">
                    No clips yet. Add a clip manually or auto-generate clips.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      onClick={handleAddManualClip}
                      className="btn-primary rounded-xl px-4 py-2 text-xs font-bold"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Clip Manually
                    </button>
                    <Link
                      href={
                        selectedAssetId
                          ? `/dashboard/video-intelligence?assetId=${selectedAssetId}`
                          : "/dashboard/video-intelligence"
                      }
                      className="btn-secondary rounded-xl px-4 py-2 text-xs font-bold"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Auto-Generate Clips
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {assetClips.map((clip) => (
                    <ClipCard
                      key={clip._id}
                      clip={clip}
                      assetUrl={`/api/assets/file/${clip.assetId || selectedAssetId}`}
                      onUpdate={(updated) => {
                        setClips((prev) =>
                          prev.map((c) => (c._id === updated._id ? ({ ...c, ...updated } as IClip) : c))
                        );
                        if (selectedClipId === updated._id) {
                          loadClipIntoInspector({ ...clip, ...updated } as IClip);
                        }
                      }}
                      onDelete={(id) => {
                        setClips((prev) => prev.filter((c) => c._id !== id));
                        if (selectedClipId === id) setSelectedClipId("");
                      }}
                      onApprove={async (id) => {
                        const res = await fetch("/api/clips", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id, status: "APPROVED" }),
                        });
                        if (res.ok) {
                          setClips((prev) =>
                            prev.map((c) => (c._id === id ? { ...c, status: "APPROVED" } : c))
                          );
                          toast.success("Clip approved!");
                        }
                      }}
                      onReject={async (id) => {
                        const res = await fetch("/api/clips", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id, status: "REJECTED" }),
                        });
                        if (res.ok) {
                          setClips((prev) =>
                            prev.map((c) => (c._id === id ? { ...c, status: "REJECTED" } : c))
                          );
                          toast.info("Clip rejected.");
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* TASK 5: RECORDING BOOTH & TELEPROMPTER VIEW */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left 7 Columns: Camera / Screen Viewfinder & Recording Controls */}
          <div className="space-y-5 lg:col-span-7">
            <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-black/15 bg-[#111214] shadow-lg">
              <video
                ref={recordVideoPreviewRef}
                playsInline
                muted
                className="h-full w-full object-cover"
              />

              {/* Recording Indicator Overlay with Timer and Live Size */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-3 rounded-full bg-red-600/90 px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-lg backdrop-blur-md">
                  <span className="h-2 w-2 animate-ping rounded-full bg-white" />
                  <span>
                    REC {Math.floor(recordSeconds / 60)}:
                    {String(recordSeconds % 60).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] text-white/80">
                    ({(recordedBytes / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                </div>
              )}

              {/* Viewfinder prompt when not recording and no take */}
              {!cameraStream && !recordedVideoUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white/60">
                  <Camera className="h-10 w-10 text-white/40" />
                  <p className="mt-2 text-xs font-semibold text-white">Camera Viewfinder Ready</p>
                  <p className="mt-1 max-w-xs text-[11px] text-white/50">
                    Click &ldquo;Start Recording&rdquo; to prompt for camera and microphone access.
                  </p>
                </div>
              )}

              {/* Playback of recorded take */}
              {recordedVideoUrl && !cameraStream && (
                <video
                  src={recordedVideoUrl}
                  controls
                  className="absolute inset-0 h-full w-full object-contain bg-black"
                />
              )}
            </div>

            {/* Hardware Mode Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <button
                  disabled={isRecording}
                  onClick={() => setRecordMode("camera")}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    recordMode === "camera"
                      ? "bg-[#111214] text-white"
                      : "bg-black/5 text-[#77797c] hover:text-[#111214]"
                  }`}
                >
                  <Camera className="h-3.5 w-3.5" />
                  Webcam + Mic
                </button>
                <button
                  disabled={isRecording}
                  onClick={() => setRecordMode("screen")}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    recordMode === "screen"
                      ? "bg-[#111214] text-white"
                      : "bg-black/5 text-[#77797c] hover:text-[#111214]"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  Screen Capture
                </button>
              </div>

              <div className="flex items-center gap-2">
                {!isRecording ? (
                  <button
                    onClick={startCameraRecording}
                    className="flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-red-700"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-white" />
                    Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopCameraRecording}
                    className="flex items-center gap-2 rounded-2xl bg-[#111214] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-black"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    Stop Recording
                  </button>
                )}
              </div>
            </div>

            {/* Post-Record Take Actions (Task 5: Retake, Discard, Download, Save, Save & Edit) */}
            {recordedBlob && (
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-emerald-950 shadow-sm backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/10 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                    <div>
                      <h4 className="text-xs font-bold">Footage Recorded Successfully</h4>
                      <p className="text-[11px] text-emerald-800">
                        Size: {(recordedBlob.size / (1024 * 1024)).toFixed(1)} MB • Duration:{" "}
                        {formatDuration(recordSeconds)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRetake}
                      className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#111214] hover:bg-black/5"
                    >
                      Retake
                    </button>
                    <button
                      onClick={handleDiscardTake}
                      className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-500/20"
                    >
                      Discard
                    </button>
                  </div>
                </div>

                {/* Progress indicator while saving take */}
                {isSavingTake && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Uploading take to assets...</span>
                      <span>{takeSaveProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-200">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-200"
                        style={{ width: `${takeSaveProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5">
                  <button
                    onClick={handleDownloadTake}
                    className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[#111214] hover:bg-black/5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download (.webm)
                  </button>
                  <button
                    disabled={isSavingTake}
                    onClick={() => handleSaveTake(false)}
                    className="rounded-xl border border-emerald-800/20 bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50"
                  >
                    Save to Assets
                  </button>
                  <button
                    disabled={isSavingTake}
                    onClick={() => handleSaveTake(true)}
                    className="btn-primary rounded-xl px-4 py-2 text-xs font-bold shadow-md disabled:opacity-50"
                  >
                    Save & Edit in Studio →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right 5 Columns: Script-Linked Scrolling Teleprompter */}
          <div className="space-y-4 lg:col-span-5">
            <div className="flex flex-col h-[520px] rounded-3xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
              {/* Teleprompter Header */}
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#111214]" />
                  <span className="text-xs font-bold text-[#111214]">Creator Teleprompter</span>
                </div>

                <select
                  value={selectedScriptId}
                  onChange={(e) => setSelectedScriptId(e.target.value)}
                  className="max-w-[180px] truncate rounded-xl border border-black/15 bg-white px-2 py-1 text-xs font-semibold text-[#111214]"
                >
                  {scripts.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Speed & Size Settings */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-black/5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#77797c]">Speed:</span>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={prompterSpeed}
                    onChange={(e) => setPrompterSpeed(Number(e.target.value))}
                    className="w-20 accent-[#111214]"
                  />
                  <span className="font-mono">{prompterSpeed}x</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#77797c]">Size:</span>
                  <input
                    type="range"
                    min={14}
                    max={32}
                    value={prompterSize}
                    onChange={(e) => setPrompterSize(Number(e.target.value))}
                    className="w-20 accent-[#111214]"
                  />
                  <span className="font-mono">{prompterSize}px</span>
                </div>

                <button
                  onClick={() => setIsPrompterScrolling(!isPrompterScrolling)}
                  className="rounded-lg bg-black/5 px-2 py-1 font-bold text-[#111214] hover:bg-black/10"
                >
                  {isPrompterScrolling ? "Pause" : "Scroll"}
                </button>
              </div>

              {/* Scrolling Text Viewport */}
              <div
                ref={prompterContainerRef}
                style={{ fontSize: `${prompterSize}px` }}
                className="flex-1 overflow-y-auto p-4 font-sans leading-relaxed text-[#111214]"
              >
                {selectedScript ? (
                  <div className="space-y-4">
                    <h3 className="font-black text-indigo-900">{selectedScript.title}</h3>
                    {selectedScript.hooks?.length > 0 && (
                      <div className="rounded-xl bg-amber-500/10 p-3 font-semibold text-amber-950">
                        HOOK: &ldquo;{selectedScript.hooks[0]}&rdquo;
                      </div>
                    )}
                    <div className="whitespace-pre-line">{selectedScript.content}</div>
                  </div>
                ) : (
                  <p className="text-center text-xs text-[#77797c] py-20">
                    No script selected. Choose a script from above to display teleprompter text.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reusable ConfirmDialog (Replacing window.confirm/alert) */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          cancelLabel={confirmDialog.cancelLabel}
          variant={confirmDialog.variant}
          isLoading={confirmDialog.isLoading}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
