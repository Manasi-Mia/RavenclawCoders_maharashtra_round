"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Key,
  Trash2,
  Save,
  Plus,
  X,
  AlertTriangle,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const SUGGESTED_SPECIALIZATIONS = [
  "Tech",
  "Education",
  "Fitness",
  "Finance",
  "Lifestyle",
  "Comedy",
  "Gaming",
  "Productivity",
  "AI & Coding",
  "Design",
];

export default function SettingsPage() {
  const { user, refreshUser, seedDemo } = useAuth();
  const router = useRouter();

  // Profile Form State
  const [name, setName] = useState("");
  const [creatorType, setCreatorType] = useState("YouTuber");
  const [bio, setBio] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [newChipInput, setNewChipInput] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Danger Zone State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Demo tool state
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // Sync state when user prop changes (e.g. async fetch completes)
  const [prevUserId, setPrevUserId] = useState<string | null>(null);
  if (user && user._id !== prevUserId) {
    setPrevUserId(user._id);
    setName(user.name || "");
    setCreatorType(user.creatorType || "YouTuber");
    setBio(user.bio || "");
    setSpecializations(user.specializations || ["Tech", "Productivity"]);
  }

  const handleAddChip = (chip: string) => {
    const trimmed = chip.trim();
    if (!trimmed) return;
    if (!specializations.includes(trimmed)) {
      setSpecializations([...specializations, trimmed]);
    }
    setNewChipInput("");
  };

  const handleRemoveChip = (chipToRemove: string) => {
    setSpecializations(specializations.filter((s) => s !== chipToRemove));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess("");
    setProfileError("");

    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          creatorType,
          specializations,
          bio,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setProfileSuccess("Profile updated successfully!");
      await refreshUser();
      setTimeout(() => setProfileSuccess(""), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving profile";
      setProfileError(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setPasswordSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating password";
      setPasswordError(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setDeleteError("Please type DELETE to confirm.");
      return;
    }
    if (!deletePassword) {
      setDeleteError("Password is required.");
      return;
    }

    setDeletingAccount(true);
    setDeleteError("");

    try {
      const res = await fetch("/api/auth/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirm: "DELETE",
          password: deletePassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting account";
      setDeleteError(msg);
      setDeletingAccount(false);
    }
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    const res = await seedDemo();
    setSeeding(false);
    if (res.success) {
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
      router.refresh();
    }
  };

  const getInitials = (userName?: string) => {
    if (!userName) return "C";
    const parts = userName.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-black/10 bg-black/5 px-3 py-1 text-[11px] font-bold text-[#111214]">
            <Settings className="h-3.5 w-3.5" />
            Account Management
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-[#111214] sm:text-3xl">
          Profile & Preferences
        </h1>
        <p className="mt-1 text-xs text-[#77797c] sm:text-sm">
          Customize your creator identity and niches to personalize AI scripts, hooks, and content
          recommendations.
        </p>
      </div>

      {/* 1. Profile Settings Card */}
      <div className="rounded-3xl border border-white/80 bg-white/70 p-6 shadow-sm backdrop-blur-xl sm:p-8">
        <div className="flex items-center gap-4 border-b border-black/10 pb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#111214] text-xl font-black text-white shadow-md">
            {getInitials(user?.name)}
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight text-[#111214]">
              {user?.name || "Creator Profile"}
            </h2>
            <p className="text-xs text-[#77797c]">{user?.email}</p>
            <span className="mt-1 inline-block rounded-full border border-black/10 bg-black/5 px-2.5 py-0.5 text-[10px] font-bold text-[#44464a]">
              {creatorType}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
          {profileSuccess && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-900">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold text-rose-900">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1.5 w-full rounded-2xl border border-black/15 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#111214] outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
                Creator Platform Type
              </label>
              <select
                value={creatorType}
                onChange={(e) => setCreatorType(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-black/15 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#111214] outline-none focus:border-black"
              >
                <option value="YouTuber">YouTuber</option>
                <option value="Instagram Creator">Instagram Creator</option>
                <option value="Podcaster">Podcaster</option>
                <option value="Educator">Educator</option>
                <option value="Business Creator">Business Creator</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Specializations & Niches Chip Input */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
                Specializations & Content Niches
              </label>
              <span className="text-[10px] text-[#77797c]">
                Used by Gemini to personalize scripts and ideas
              </span>
            </div>

            {/* Active Chips List */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-2xl border border-black/15 bg-white p-2.5 min-h-[46px]">
              {specializations.map((spec) => (
                <span
                  key={spec}
                  className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-black/5 px-2.5 py-1 text-xs font-bold text-[#111214]"
                >
                  {spec}
                  <button
                    type="button"
                    onClick={() => handleRemoveChip(spec)}
                    className="text-[#77797c] hover:text-[#111214]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-1 flex-1 min-w-[120px]">
                <input
                  type="text"
                  placeholder="Add custom niche..."
                  value={newChipInput}
                  onChange={(e) => setNewChipInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddChip(newChipInput);
                    }
                  }}
                  className="w-full bg-transparent px-2 py-1 text-xs text-[#111214] outline-none placeholder:text-[#999b9e]"
                />
                {newChipInput.trim() && (
                  <button
                    type="button"
                    onClick={() => handleAddChip(newChipInput)}
                    className="rounded-lg bg-black/10 p-1 text-[#111214]"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Suggested Chip Recommendations */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold text-[#77797c]">Suggested:</span>
              {SUGGESTED_SPECIALIZATIONS.filter((s) => !specializations.includes(s)).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => handleAddChip(s)}
                  className="rounded-lg border border-black/5 bg-black/[0.02] px-2 py-0.5 text-[10px] font-medium text-[#44464a] hover:bg-black/5 hover:text-[#111214]"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* Bio (Max 280 chars) */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
                Creator Bio
              </label>
              <span className="text-[10px] font-mono text-[#77797c]">{bio.length}/280</span>
            </div>
            <textarea
              rows={3}
              maxLength={280}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us what you create, your voice, and who your audience is..."
              className="mt-1.5 w-full rounded-2xl border border-black/15 bg-white p-3 text-xs text-[#111214] outline-none focus:border-black"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="btn-primary flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{savingProfile ? "Saving Profile..." : "Save Profile"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Security & Password Change */}
      <div className="rounded-3xl border border-white/80 bg-white/70 p-6 shadow-sm backdrop-blur-xl sm:p-8">
        <h2 className="flex items-center gap-2 border-b border-black/10 pb-4 text-base font-black tracking-tight text-[#111214]">
          <Key className="h-4 w-4" />
          Change Password
        </h2>

        <form onSubmit={handleChangePassword} className="mt-5 space-y-4 max-w-md">
          {passwordSuccess && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-900">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold text-rose-900">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{passwordError}</span>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-2xl border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-[#111214] outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 w-full rounded-2xl border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-[#111214] outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 w-full rounded-2xl border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-[#111214] outline-none focus:border-black"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="btn-secondary flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold"
          >
            <Key className="h-3.5 w-3.5" />
            <span>{savingPassword ? "Updating..." : "Update Password"}</span>
          </button>
        </form>
      </div>

      {/* 3. Demo Workspace Tools (Moved away from tech clutter) */}
      <div className="rounded-3xl border border-white/80 bg-white/70 p-6 shadow-sm backdrop-blur-xl sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-black tracking-tight text-[#111214]">Demo Tools</h3>
            <p className="mt-1 text-xs text-[#77797c]">
              Need realistic sample data? One click populates &ldquo;How I Built My First AI App in 48
              Hours&rdquo; with scripts, clips, assets, and analytics.
            </p>
          </div>

          <button
            onClick={handleSeedDemo}
            disabled={seeding}
            className="btn-secondary flex shrink-0 items-center gap-2 self-start rounded-2xl px-4 py-2 text-xs font-bold"
          >
            <RotateCw className={`h-3.5 w-3.5 ${seeding ? "animate-spin" : ""}`} />
            <span>{seeding ? "Seeding..." : seedSuccess ? "Workspace Seeded!" : "Seed Demo Data"}</span>
          </button>
        </div>
      </div>

      {/* 4. Danger Zone: Delete Account */}
      <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 shadow-sm backdrop-blur-xl sm:p-8">
        <div className="flex items-center gap-2 border-b border-rose-500/10 pb-4">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
          <h2 className="text-base font-black tracking-tight text-rose-950">Danger Zone</h2>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h4 className="text-xs font-bold text-rose-950">Delete Account & Permanent Wipe</h4>
            <p className="mt-1 text-xs text-rose-800">
              Permanently removes your user profile and all associated projects, ideas, scripts,
              video assets, chunks, and analytics. This cannot be undone.
            </p>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 self-start rounded-2xl border border-rose-500/30 bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Account
          </button>
        </div>

        {/* Modal for Deletion Confirmation */}
        {showDeleteModal && (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-white p-5 shadow-xl">
            <h4 className="text-sm font-black text-rose-950">Confirm Permanent Account Deletion</h4>
            <p className="mt-1 text-xs text-[#77797c]">
              To prevent accidental deletion, please type <strong className="text-rose-600">DELETE</strong> and
              enter your password.
            </p>

            {deleteError && (
              <div className="mt-3 text-xs font-bold text-rose-600">{deleteError}</div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
                  Type DELETE
                </label>
                <input
                  type="text"
                  placeholder="DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-xs font-mono font-bold text-[#111214] outline-none focus:border-rose-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#77797c]">
                  Your Password
                </label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-xs font-semibold text-[#111214] outline-none focus:border-rose-600"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                  setDeletePassword("");
                  setDeleteError("");
                }}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-[#77797c] hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteConfirmText !== "DELETE" || !deletePassword}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-40"
              >
                {deletingAccount ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting All Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Permanently Wipe Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
