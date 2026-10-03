"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
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
        return <span className="bg-red-500/10 text-red-700 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium">YT</span>;
      case "Instagram":
        return <span className="bg-pink-500/10 text-pink-700 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium">IG</span>;
      case "LinkedIn":
        return <span className="bg-blue-500/10 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium">LI</span>;
      case "TikTok":
        return <span className="bg-cyan-500/10 text-cyan-800 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium">TT</span>;
      default:
        return <span className="bg-black/5 text-[#111214] px-1.5 py-0.5 rounded text-[9px] font-mono font-medium">Multi</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111214] tracking-tight flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#111214] text-white shadow-sm">
              <CalendarIcon className="h-4 w-4 text-white" />
            </span>
            Content Publishing Calendar
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#66686c]">
            Schedule target release dates, coordinate cross-channel pacing, and maintain publishing velocity.
          </p>
        </div>

        <button
          onClick={() => {
            setScheduleDate(new Date().toISOString().split("T")[0]);
            setScheduleModalOpen(true);
          }}
          className="creator-btn-primary px-4 py-2.5 text-xs font-semibold"
        >
          <Plus className="h-4 w-4 text-white" />
          <span>Schedule Content</span>
        </button>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between rounded-3xl border border-black/10 bg-white/70 p-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-[#111214] tracking-tight">
            {monthName} {year}
          </h2>
          <span className="rounded-full bg-black/5 text-[#111214] border border-black/10 px-2.5 py-0.5 text-xs font-mono font-medium">
            {projects.length} Scheduled
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={prevMonth}
            className="rounded-xl border border-black/10 bg-white/70 p-2 text-[#66686c] hover:bg-white hover:text-[#111214] transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#111214] hover:bg-white transition"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="rounded-xl border border-black/10 bg-white/70 p-2 text-[#66686c] hover:bg-white hover:text-[#111214] transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-3xl border border-black/10 bg-white/70 p-4 shadow-sm backdrop-blur-md overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 border-b border-black/10 pb-3 mb-2 text-center text-xs font-bold uppercase tracking-wider text-[#66686c]">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#111214]" />
            </div>
          ) : (
            /* Days Cells */
            <div className="grid grid-cols-7 gap-2">
              {/* Empty offset padding */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[110px] rounded-2xl border border-transparent p-2 opacity-20" />
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
                    className={`min-h-[110px] rounded-2xl border p-2 flex flex-col justify-between transition cursor-pointer group shadow-xs ${
                      isToday
                        ? "border-black/40 bg-white"
                        : "border-black/5 bg-white/60 hover:border-black/20 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-mono font-bold ${
                          isToday ? "text-[#111214] font-black" : "text-[#66686c] group-hover:text-[#111214]"
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayProjects.length > 0 && (
                        <span className="h-2 w-2 rounded-full bg-[#111214]" />
                      )}
                    </div>

                    <div className="space-y-1.5 my-1 overflow-y-auto max-h-[70px] no-scrollbar">
                      {dayProjects.map((p) => (
                        <Link
                          key={p._id}
                          href={`/dashboard/projects/${p._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="block rounded-xl bg-white border border-black/10 p-1.5 text-[10px] hover:border-black/30 transition shadow-xs"
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            {platformBadge(p.platform)}
                            <span className="font-semibold text-[#111214] truncate">{p.title}</span>
                          </div>
                        </Link>
                      ))}
                    </div>

                    <span className="text-[9px] text-[#8a8b8e] group-hover:text-[#111214] font-mono text-right font-medium">
                      + Schedule
                    </span>
                  </div>
                );
              })}
            </div>
          )}
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
            <label className="block text-xs font-semibold text-[#111214] mb-1">Title</label>
            <input
              type="text"
              required
              value={scheduleTitle}
              onChange={(e) => setScheduleTitle(e.target.value)}
              placeholder="e.g. 5 Gemini Features You Missed"
              className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#111214] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111214] mb-1">Target Platform</label>
              <select
                value={schedulePlatform}
                onChange={(e) => setSchedulePlatform(e.target.value)}
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
              <label className="block text-xs font-semibold text-[#111214] mb-1">Publish Date</label>
              <input
                type="date"
                required
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-xs text-[#111214] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10">
            <button
              type="button"
              onClick={() => setScheduleModalOpen(false)}
              className="rounded-full px-4 py-2 text-xs font-medium text-[#66686c] hover:text-[#111214]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={scheduling}
              className="creator-btn-primary px-5 py-2 text-xs"
            >
              {scheduling ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Plus className="h-4 w-4 text-white" />}
              <span>Add to Calendar</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
