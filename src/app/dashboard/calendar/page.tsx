"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Video,
  Loader2,
} from "lucide-react";
import { IProject } from "@/models";
import { Modal } from "@/components/ui/Modal";

export default function ContentCalendarPage() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Quick Schedule Modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [schedulePlatform, setSchedulePlatform] = useState("YouTube");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduling, setScheduling] = useState(false);

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

  const handleCreateScheduled = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTitle.trim()) return;
    setScheduling(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: scheduleTitle,
          platform: schedulePlatform,
          deadline: scheduleDate ? new Date(scheduleDate) : new Date(),
          status: "PLANNED",
        }),
      });

      if (res.ok) {
        await fetchProjects();
        setScheduleModalOpen(false);
        setScheduleTitle("");
      }
    } finally {
      setScheduling(false);
    }
  };

  // Month calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const platformBadge = (platform: string) => {
    switch (platform) {
      case "YouTube":
        return <span className="bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded text-[9px] font-mono">YT</span>;
      case "Instagram":
        return <span className="bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded text-[9px] font-mono">IG</span>;
      case "LinkedIn":
        return <span className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded text-[9px] font-mono">LI</span>;
      case "TikTok":
        return <span className="bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded text-[9px] font-mono">TT</span>;
      default:
        return <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded text-[9px] font-mono">Multi</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="h-6 w-6 text-cyan-400" />
            Content Publishing Calendar
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Schedule target release dates, coordinate cross-channel pacing, and maintain publishing velocity.
          </p>
        </div>

        <button
          onClick={() => {
            setScheduleDate(new Date().toISOString().split("T")[0]);
            setScheduleModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:opacity-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Content</span>
        </button>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0d121f]/90 p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white tracking-tight">
            {monthName} {year}
          </h2>
          <span className="rounded-full bg-indigo-500/20 text-cyan-300 px-2.5 py-0.5 text-xs font-mono">
            {projects.length} Scheduled
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={prevMonth}
            className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-white/10 bg-[#0d121f]/90 p-4 shadow-xl overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 border-b border-white/[0.08] pb-3 mb-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Cells */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty offset padding */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[110px] rounded-xl border border-transparent p-2 opacity-20" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

              // Match projects with deadline on this day
              const dayProjects = projects.filter((p) => {
                if (!p.deadline) return false;
                const d = new Date(p.deadline);
                return (
                  d.getFullYear() === year &&
                  d.getMonth() === month &&
                  d.getDate() === dayNum
                );
              });

              const isToday =
                new Date().getDate() === dayNum &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={dayNum}
                  onClick={() => {
                    setScheduleDate(dateString);
                    setScheduleModalOpen(true);
                  }}
                  className={`min-h-[110px] rounded-xl border p-2 flex flex-col justify-between transition cursor-pointer group ${
                    isToday
                      ? "border-cyan-500/50 bg-cyan-500/[0.04]"
                      : "border-white/5 bg-white/[0.01] hover:border-indigo-500/30 hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isToday ? "text-cyan-400" : "text-slate-400 group-hover:text-white"
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayProjects.length > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    )}
                  </div>

                  <div className="space-y-1.5 my-1 overflow-y-auto max-h-[70px] no-scrollbar">
                    {dayProjects.map((p) => (
                      <Link
                        key={p._id}
                        href={`/dashboard/projects/${p._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="block rounded-lg bg-black/40 border border-white/10 p-1.5 text-[10px] hover:border-indigo-500/40 transition"
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          {platformBadge(p.platform)}
                          <span className="font-semibold text-white truncate">{p.title}</span>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <span className="text-[9px] text-slate-600 group-hover:text-slate-400 font-mono text-right">
                    + Schedule
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Schedule Content"
      >
        <form onSubmit={handleCreateScheduled} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
            <input
              type="text"
              required
              value={scheduleTitle}
              onChange={(e) => setScheduleTitle(e.target.value)}
              placeholder="e.g. 5 Gemini Features You Missed"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Platform</label>
              <select
                value={schedulePlatform}
                onChange={(e) => setSchedulePlatform(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#090d16] px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="YouTube">YouTube</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Multi-Platform">Multi-Platform</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Publish Date</label>
              <input
                type="date"
                required
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setScheduleModalOpen(false)}
              className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={scheduling}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:opacity-95 transition disabled:opacity-50"
            >
              {scheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span>Add to Calendar</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
