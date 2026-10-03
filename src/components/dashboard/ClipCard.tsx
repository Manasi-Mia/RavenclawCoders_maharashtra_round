"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  Scissors,
  Check,
  X,
  Trash2,
  Edit3,
  Clock,
  Sparkles,
  Save,
} from "lucide-react";
import { IClip } from "@/models";
import { formatDuration } from "@/lib/utils";

interface ClipCardProps {
  clip: Partial<IClip> & {
    _id?: string;
    title: string;
    startTime: number;
    endTime: number;
    hook?: string;
    caption?: string;
    platform?: string;
    reason?: string;
    status?: string;
    confidence?: number;
    assetId?: string;
    projectId?: string;
  };
  assetUrl?: string;
  onUpdate?: (updatedClip: Partial<IClip>) => void;
  onDelete?: (clipId: string) => void;
  onApprove?: (clipId: string) => void;
  onReject?: (clipId: string) => void;
  compact?: boolean;
}

export function ClipCard({
  clip,
  assetUrl,
  onUpdate,
  onDelete,
  onApprove,
  onReject,
  compact = false,
}: ClipCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(clip.title);
  const [editHook, setEditHook] = useState(clip.hook || "");
  const [editCaption, setEditCaption] = useState(clip.caption || "");
  const [editStart, setEditStart] = useState(clip.startTime);
  const [editEnd, setEditEnd] = useState(clip.endTime);
  const [editPlatform, setEditPlatform] = useState(clip.platform || "YouTube Shorts");
  const [saving, setSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const duration = Math.max(0, Math.round(clip.endTime - clip.startTime));
  const effectiveAssetUrl = assetUrl || (clip.assetId ? `/api/assets/file/${clip.assetId}` : "");

  const handleTogglePlay = () => {
    if (!videoRef.current || !effectiveAssetUrl) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.currentTime = clip.startTime;
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => console.error("Play error:", e));
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    if (videoRef.current.currentTime >= clip.endTime) {
      videoRef.current.pause();
      videoRef.current.currentTime = clip.startTime;
      setIsPlaying(false);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      if (clip._id) {
        const res = await fetch("/api/clips", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: clip._id,
            title: editTitle,
            hook: editHook,
            caption: editCaption,
            startTime: Number(editStart),
            endTime: Number(editEnd),
            platform: editPlatform,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          onUpdate?.(data.clip);
          setIsEditing(false);
        }
      } else {
        onUpdate?.({
          ...clip,
          title: editTitle,
          hook: editHook,
          caption: editCaption,
          startTime: Number(editStart),
          endTime: Number(editEnd),
          platform: editPlatform as IClip["platform"],
        });
        setIsEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const getPlatformBadge = (platform?: string) => {
    switch (platform) {
      case "Instagram Reels":
        return "bg-rose-500/10 text-rose-700 border-rose-500/20";
      case "TikTok":
        return "bg-cyan-500/10 text-cyan-800 border-cyan-500/20";
      case "LinkedIn":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      default:
        return "bg-red-500/10 text-red-700 border-red-500/20";
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "APPROVED":
      case "READY":
        return "bg-emerald-500/10 text-emerald-800 border-emerald-500/20";
      case "REJECTED":
        return "bg-rose-500/10 text-rose-800 border-rose-500/20";
      default:
        return "bg-amber-500/10 text-amber-800 border-amber-500/20";
    }
  };

  const studioUrl = `/dashboard/studio?clipId=${clip._id || ""}&assetId=${clip.assetId || ""}`;

  return (
    <div className="glass-card flex flex-col justify-between overflow-hidden rounded-3xl border border-white/80 bg-white/70 p-5 shadow-[0_12px_35px_rgba(20,20,20,.05)] backdrop-blur-xl transition hover:shadow-[0_16px_45px_rgba(20,20,20,.08)]">
      {/* Top Header: Platform, Duration, Status, Confidence */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getPlatformBadge(
              clip.platform
            )}`}
          >
            {clip.platform || "Shorts"}
          </span>
          <span className="flex items-center gap-1 rounded-full border border-black/10 bg-black/5 px-2.5 py-0.5 text-[10px] font-bold text-[#44464a]">
            <Clock className="h-3 w-3" />
            {duration}s ({formatDuration(clip.startTime)} - {formatDuration(clip.endTime)})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {clip.confidence && (
            <span
              title="AI Confidence Score"
              className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-800"
            >
              <Sparkles className="h-2.5 w-2.5" />
              {Math.round(clip.confidence * 100)}%
            </span>
          )}
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadge(
              clip.status
            )}`}
          >
            {clip.status || "SUGGESTED"}
          </span>
        </div>
      </div>

      {/* Video Preview Player (when assetUrl is available) */}
      {effectiveAssetUrl && (
        <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-2xl border border-black/10 bg-[#111214]">
          <video
            ref={videoRef}
            src={effectiveAssetUrl}
            onTimeUpdate={handleTimeUpdate}
            preload="metadata"
            className="h-full w-full object-contain"
          />
          <button
            onClick={handleTogglePlay}
            aria-label={isPlaying ? "Pause clip preview" : "Play clip preview"}
            className="absolute inset-0 flex items-center justify-center bg-black/25 transition hover:bg-black/40"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111214]/90 text-white shadow-xl backdrop-blur-md transition hover:scale-105">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
            </div>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {isEditing ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-black/10 bg-black/[0.02] p-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
              Clip Title
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#111214] outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
                Start (sec)
              </label>
              <input
                type="number"
                value={editStart}
                onChange={(e) => setEditStart(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#111214] outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
                End (sec)
              </label>
              <input
                type="number"
                value={editEnd}
                onChange={(e) => setEditEnd(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#111214] outline-none focus:border-black"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
              Platform
            </label>
            <select
              value={editPlatform}
              onChange={(e) => setEditPlatform(e.target.value as IClip["platform"])}
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#111214] outline-none focus:border-black"
            >
              <option value="YouTube Shorts">YouTube Shorts</option>
              <option value="Instagram Reels">Instagram Reels</option>
              <option value="TikTok">TikTok</option>
              <option value="LinkedIn">LinkedIn</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
              Hook
            </label>
            <input
              type="text"
              value={editHook}
              onChange={(e) => setEditHook(e.target.value)}
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-1.5 text-xs text-[#111214] outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
              Caption
            </label>
            <textarea
              rows={2}
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-1.5 text-xs text-[#111214] outline-none focus:border-black"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setIsEditing(false)}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold text-[#77797c] hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="btn-primary flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold"
            >
              <Save className="h-3 w-3" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex-1 space-y-2.5">
          <div>
            <h4 className="text-sm font-black tracking-tight text-[#111214]">{clip.title}</h4>
          </div>

          {clip.hook && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-2.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-900">
                Opening Hook
              </span>
              <p className="mt-0.5 text-xs font-medium italic text-[#111214]">
                &ldquo;{clip.hook}&rdquo;
              </p>
            </div>
          )}

          {clip.caption && (
            <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-2.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#77797c]">
                Caption
              </span>
              <p className="mt-0.5 line-clamp-2 text-xs text-[#333538]">{clip.caption}</p>
            </div>
          )}

          {clip.reason && !compact && (
            <p className="text-[11px] text-[#77797c]">
              <span className="font-semibold text-[#111214]">Retention note:</span> {clip.reason}
            </p>
          )}
        </div>
      )}

      {/* Bottom Actions Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-black/10 pt-3">
        <div className="flex items-center gap-1">
          {onApprove && clip.status !== "APPROVED" && (
            <button
              onClick={() => clip._id && onApprove(clip._id)}
              title="Approve Clip"
              className="flex items-center gap-1 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-800 transition hover:bg-emerald-500/20"
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </button>
          )}

          {onReject && clip.status !== "REJECTED" && (
            <button
              onClick={() => clip._id && onReject(clip._id)}
              title="Reject Clip"
              className="flex items-center gap-1 rounded-xl border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-800 transition hover:bg-rose-500/20"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </button>
          )}

          <button
            onClick={() => setIsEditing(!isEditing)}
            title="Edit Clip"
            className="flex items-center gap-1 rounded-xl border border-black/10 bg-white/60 px-2.5 py-1 text-xs font-semibold text-[#44464a] transition hover:bg-black/5 hover:text-[#111214]"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href={studioUrl}
            className="btn-primary flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-bold"
          >
            <Scissors className="h-3 w-3" />
            Open in Studio
          </Link>

          {onDelete && clip._id && (
            <button
              onClick={() => onDelete(clip._id!)}
              title="Delete Clip"
              className="rounded-xl p-1.5 text-[#77797c] transition hover:bg-rose-500/10 hover:text-rose-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
