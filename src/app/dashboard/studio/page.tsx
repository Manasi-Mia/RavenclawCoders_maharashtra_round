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
  Film,
  Camera,
  Mic,
  Monitor,
  Video,
  Download,
  Upload,
  Settings2,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Layers,
  FileText,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { IAsset, IClip, IScript } from "@/models";
import { formatDuration } from "@/lib/utils";
import { ClipCard } from "@/components/dashboard/ClipCard";

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
  const [prompterSpeed, setPrompterSpeed] = useState(2);
  const [prompterSize, setPrompterSize] = useState(20);
  const [isPrompterScrolling, setIsPrompterScrolling] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordVideoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const prompterContainerRef = useRef<HTMLDivElement | null>(null);

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
    }
  }, []);

  // Fetch initial assets and clips
  useEffect(() => {
    Promise.all([
      fetch("/api/assets?type=video").then((r) => (r.ok ? r.json() : { assets: [] })),
      fetch("/api/clips").then((r) => (r.ok ? r.json() : { clips: [] })),
      fetch("/api/scripts").then((r) => (r.ok ? r.json() : { scripts: [] })),
    ])
      .then(([aData, cData, sData]) => {
        const vids: IAsset[] = aData.assets || [];
        setVideoAssets(vids);
        if (!selectedAssetId && vids.length > 0) {
          setSelectedAssetId(vids[0]._id || "");
        }

        const allClips: IClip[] = cData.clips || [];
        setClips(allClips);

        const allScripts: IScript[] = sData.scripts || [];
        setScripts(allScripts);
        if (allScripts.length > 0) setSelectedScriptId(allScripts[0]._id || "");

        if (initialClipId) {
          const match = allClips.find((c) => c._id === initialClipId);
          if (match) {
            loadClipIntoInspector(match);
            if (match.assetId) setSelectedAssetId(match.assetId);
          }
        } else if (allClips.length > 0) {
          loadClipIntoInspector(allClips[0]);
        }
      })
      .catch((e) => console.error("Studio initial load error:", e));
  }, [initialClipId, loadClipIntoInspector, selectedAssetId]);

  // When selected asset changes, filter clips or update player
  const selectedAsset = videoAssets.find((a) => a._id === selectedAssetId);
  const assetClips = clips.filter((c) => !c.assetId || c.assetId === selectedAssetId);

  const pushHistory = (newState: Partial<HistoryItem>) => {
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

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(current);
    if (newHistory.length > 10) newHistory.shift();

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

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
    }
  };

  // Video Player Event Handlers
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);

    // If loopClip is on and we reached the end of the active clip
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

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentTime >= inspectorEnd && inspectorEnd > inspectorStart) {
        videoRef.current.currentTime = inspectorStart;
      }
      videoRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.error(e));
    }
  };

  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
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

      if (res.ok) {
        const data = await res.json();
        setClips((prev) =>
          prev.map((c) => (c._id === selectedClipId ? ({ ...c, ...data.clip } as IClip) : c))
        );
        setFieldEdited({});
      }
    } catch (e) {
      console.error("Save clip error:", e);
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
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setClips((prev) => [data.clip, ...prev]);
        loadClipIntoInspector(data.clip);
      }
    } catch (e) {
      console.error("Duplicate clip error:", e);
    }
  };

  // Split clip at playhead
  const handleSplitAtPlayhead = async () => {
    if (currentTime <= inspectorStart || currentTime >= inspectorEnd) return;

    try {
      // 1. Update current clip to end at playhead
      const splitTime = Math.round(currentTime * 10) / 10;
      await fetch("/api/clips", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedClipId,
          endTime: splitTime,
        }),
      });

      // 2. Create second clip from playhead to original end
      const res = await fetch("/api/clips", {
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
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setClips((prev) =>
          prev
            .map((c) => (c._id === selectedClipId ? { ...c, endTime: splitTime } : c))
            .concat(data.clip)
        );
        setInspectorEnd(splitTime);
      }
    } catch (e) {
      console.error("Split clip error:", e);
    }
  };

  // Delete clip
  const handleDeleteClip = async () => {
    if (!selectedClipId) return;
    try {
      const res = await fetch(`/api/clips?id=${selectedClipId}`, { method: "DELETE" });
      if (res.ok) {
        setClips((prev) => prev.filter((c) => c._id !== selectedClipId));
        setSelectedClipId("");
      }
    } catch (e) {
      console.error("Delete clip error:", e);
    }
  };

  // Regenerate Hook / Caption via Gemini
  const handleRegenerateHook = async () => {
    setRegeneratingHook(true);
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
      if (data.text) {
        setInspectorHook(data.text);
        setFieldEdited((prev) => ({ ...prev, hook: false })); // Marked as AI regenerated
        pushHistory({ hook: data.text });
      }
    } catch (e) {
      console.error("Regenerate hook error:", e);
    } finally {
      setRegeneratingHook(false);
    }
  };

  const handleRegenerateCaption = async () => {
    setRegeneratingCaption(true);
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
      if (data.text) {
        setInspectorCaption(data.text);
        setFieldEdited((prev) => ({ ...prev, caption: false })); // Marked as AI regenerated
        pushHistory({ caption: data.text });
      }
    } catch (e) {
      console.error("Regenerate caption error:", e);
    } finally {
      setRegeneratingCaption(false);
    }
  };

  // Browser MediaRecorder Render & Export Engine
  const handleRenderExport = async () => {
    if (!selectedAssetId || !videoRef.current) return;

    if (typeof MediaRecorder === "undefined") {
      alert("MediaRecorder is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
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
      return;
    }

    const stream = canvas.captureStream(30);

    // Attempt to capture audio track
    try {
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaElementSource(sourceVideo);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
    } catch (err) {
      console.warn("Audio capture fallback:", err);
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

    const clipDuration = inspectorEnd - inspectorStart;
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

      // Draw cropped video with focus alignment
      const vWidth = sourceVideo.videoWidth || 1920;
      const vHeight = sourceVideo.videoHeight || 1080;

      // Calculate object-fit: cover coordinates
      const targetAspect = targetWidth / targetHeight;
      const videoAspect = vWidth / vHeight;

      let sWidth = vWidth;
      let sHeight = vHeight;
      let sx = 0;
      let sy = 0;

      if (videoAspect > targetAspect) {
        // Video is wider than target aspect ratio
        sWidth = vHeight * targetAspect;
        sx = (vWidth - sWidth) * (focusX / 100);
      } else {
        // Video is taller than target aspect ratio
        sHeight = vWidth / targetAspect;
        sy = (vHeight - sHeight) * (focusY / 100);
      }

      ctx.drawImage(sourceVideo, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

      // Draw burned-in caption overlay if enabled
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

        // Draw pill box
        ctx.beginPath();
        ctx.roundRect(targetWidth * 0.05, boxY, targetWidth * 0.9, boxHeight, 24);
        ctx.fill();

        // Draw text lines
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
    };
  };

  // Upload exported / recorded blob to MongoDB assets via chunked uploader
  const handleSaveToAssets = async (blob: Blob, name: string) => {
    try {
      setExportMessage("Uploading clip to MongoDB assets...");
      const chunkSize = 2 * 1024 * 1024;
      const totalChunks = Math.ceil(blob.size / chunkSize);

      // 1. Init
      const initRes = await fetch("/api/assets/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "init",
          name: `${name}.webm`,
          mimeType: "video/webm",
          totalChunks,
          totalSize: blob.size,
        }),
      });

      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.error || "Failed to initialize upload");
      const assetId = initData.assetId;

      // 2. Chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(blob.size, start + chunkSize);
        const slice = blob.slice(start, end);
        const buffer = await slice.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString("base64");

        await fetch("/api/assets/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "chunk",
            assetId,
            index: i,
            data: base64Data,
          }),
        });
      }

      // 3. Complete
      const completeRes = await fetch("/api/assets/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          assetId,
        }),
      });

      if (completeRes.ok) {
        setExportMessage("Saved successfully to Assets library!");
        const aRes = await fetch("/api/assets?type=video");
        if (aRes.ok) {
          const ad = await aRes.json();
          setVideoAssets(ad.assets || []);
        }
      }
    } catch (e: unknown) {
      console.error("Save to assets error:", e);
      const msg = e instanceof Error ? e.message : String(e);
      setExportMessage(`Failed to save to assets: ${msg}`);
    }
  };

  // Export Cut List (CSV)
  const handleExportCutList = () => {
    const headers = ["Title", "Start Time (s)", "End Time (s)", "Duration (s)", "Platform", "Hook", "Caption"];
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
  };

  // Record Studio Functions
  const startCameraRecording = async () => {
    try {
      const stream =
        recordMode === "camera"
          ? await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          : await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });

      setCameraStream(stream);
      if (recordVideoPreviewRef.current) {
        recordVideoPreviewRef.current.srcObject = stream;
        recordVideoPreviewRef.current.play();
      }

      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        setRecordedBlob(blob);
        setRecordedVideoUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        setCameraStream(null);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      setIsPrompterScrolling(true);
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Could not start recording: ${msg}`);
    }
  };

  const stopCameraRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPrompterScrolling(false);
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
            onClick={() => setActiveTab("edit")}
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

      {activeTab === "edit" ? (
        <div className="space-y-6">
          {/* Source Video Asset Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-[#111214]">Source Footage:</span>
              <select
                value={selectedAssetId}
                onChange={(e) => {
                  setSelectedAssetId(e.target.value);
                  setSelectedClipId("");
                }}
                className="rounded-2xl border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#111214] outline-none focus:border-black"
              >
                {videoAssets.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name} ({(v.size / (1024 * 1024)).toFixed(1)} MB)
                  </option>
                ))}
              </select>

              <span className="text-xs text-[#77797c]">
                {assetClips.length} clips on this footage
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCutList}
                title="Export EDL / CSV cut list"
                className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#44464a] hover:bg-black/5"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Export Cut List (CSV)
              </button>
              <Link
                href="/dashboard/video-intelligence"
                className="btn-secondary flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold"
              >
                <Sparkles className="h-3 w-3" />
                Find More Clips
              </Link>
            </div>
          </div>

          {/* Studio Main Workspace: Player & Timeline on Left, Inspector on Right */}
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
                    onLoadedMetadata={() => {
                      if (videoRef.current) setDuration(videoRef.current.duration);
                    }}
                    muted={isMuted}
                    playsInline
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-white/50">
                    No video asset selected. Upload a video in Assets.
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
                        {formatDuration(currentTime)} / {formatDuration(duration)}
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

              {/* Interactive Timeline with Clips & Scrubber */}
              <div className="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#111214]">Interactive Clip Timeline</span>
                  <span className="text-[#77797c]">
                    Click any clip segment to cue range • Drag scrubber to scrub
                  </span>
                </div>

                {/* Timeline Bar Container */}
                <div className="relative mt-3 h-12 w-full rounded-2xl bg-black/10 p-1">
                  {/* Render clip bands */}
                  {duration > 0 &&
                    assetClips.map((c) => {
                      const leftPercent = Math.max(0, Math.min(100, (c.startTime / duration) * 100));
                      const widthPercent = Math.max(
                        2,
                        Math.min(100 - leftPercent, ((c.endTime - c.startTime) / duration) * 100)
                      );
                      const isSelected = c._id === selectedClipId;

                      return (
                        <div
                          key={c._id}
                          onClick={() => loadClipIntoInspector(c)}
                          title={`${c.title} (${c.startTime}s - ${c.endTime}s)`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                          className={`absolute top-1 bottom-1 cursor-pointer rounded-xl transition ${
                            isSelected
                              ? "border-2 border-[#111214] bg-[#111214] text-white shadow-md z-10"
                              : "border border-black/10 bg-indigo-500/30 hover:bg-indigo-500/50 text-[#111214]"
                          }`}
                        >
                          <div className="truncate px-2 py-1 text-[10px] font-bold">
                            {c.title}
                          </div>
                        </div>
                      );
                    })}

                  {/* Playhead Scrubber */}
                  {duration > 0 && (
                    <div
                      style={{
                        left: `${Math.max(0, Math.min(100, (currentTime / duration) * 100))}%`,
                      }}
                      className="pointer-events-none absolute top-0 bottom-0 z-20 w-0.5 bg-red-600 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                    >
                      <div className="absolute -top-1.5 -left-1.5 h-3.5 w-3.5 rounded-full bg-red-600" />
                    </div>
                  )}
                </div>

                {/* Scrub Slider Input */}
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="mt-3 w-full accent-[#111214]"
                />

                {/* Range Markers under timeline */}
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#77797c]">
                  <span>00:00</span>
                  <span>{formatDuration(duration / 2)}</span>
                  <span>{formatDuration(duration)}</span>
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

            {/* Right 5 Columns: Clip Inspector Panel (EDITABLE) */}
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
                          {fieldEdited.title ? "Edited by you" : "AI Generated"}
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
                            const val = Number(e.target.value);
                            setInspectorStart(val);
                            pushHistory({ startTime: val });
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
                    Select a clip from the timeline or library below to edit and inspect.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Clips Library Grid */}
          <div className="space-y-4 pt-4 border-t border-black/10">
            <h3 className="text-sm font-black tracking-tight text-[#111214]">
              All Clips for this Footage ({assetClips.length})
            </h3>
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
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* RECORDING BOOTH & TELEPROMPTER VIEW */
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

              {/* Recording Indicator Overlay */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-red-600/90 px-3 py-1 font-mono text-xs font-bold text-white shadow-lg backdrop-blur-md">
                  <span className="h-2 w-2 animate-ping rounded-full bg-white" />
                  REC {Math.floor(recordSeconds / 60)}:
                  {String(recordSeconds % 60).padStart(2, "0")}
                </div>
              )}

              {/* Prompt message when not recording */}
              {!cameraStream && !recordedVideoUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white/60">
                  <Camera className="h-10 w-10 text-white/40" />
                  <p className="mt-2 text-xs font-semibold text-white">Camera Viewfinder Ready</p>
                  <p className="mt-1 max-w-xs text-[11px] text-white/50">
                    Click &ldquo;Start Recording&rdquo; to prompt for camera and microphone access.
                  </p>
                </div>
              )}

              {recordedVideoUrl && !cameraStream && (
                <video
                  src={recordedVideoUrl}
                  controls
                  className="absolute inset-0 h-full w-full object-contain bg-black"
                />
              )}
            </div>

            {/* Recording Mode and Hardware Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <button
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

            {/* Post-Record Save Actions */}
            {recordedBlob && (
              <div className="flex items-center justify-between rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-900 shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                  <div>
                    <h4 className="text-xs font-bold">Footage Recorded Successfully</h4>
                    <p className="text-[11px] text-emerald-800">
                      Size: {(recordedBlob.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSaveToAssets(recordedBlob, "Recorded_Take")}
                    className="btn-primary rounded-xl px-4 py-2 text-xs font-bold"
                  >
                    Save directly to Assets →
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
    </div>
  );
}
