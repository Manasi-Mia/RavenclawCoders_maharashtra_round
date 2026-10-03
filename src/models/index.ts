import mongoose, { Schema, Model } from "mongoose";

// --- USER MODEL ---
export interface IUser {
  _id?: string;
  name: string;
  email: string;
  passwordHash: string;
  creatorType: "YouTuber" | "Instagram Creator" | "Podcaster" | "Educator" | "Business Creator" | "Other";
  avatar?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    creatorType: {
      type: String,
      enum: ["YouTuber", "Instagram Creator", "Podcaster", "Educator", "Business Creator", "Other"],
      default: "YouTuber",
    },
    avatar: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// --- PROJECT MODEL ---
export interface IProject {
  _id?: string;
  userId: string;
  title: string;
  description: string;
  platform: "YouTube" | "Instagram" | "TikTok" | "LinkedIn" | "Multi-Platform";
  status: "IDEA" | "PLANNED" | "RECORDING" | "EDITING" | "READY" | "PUBLISHED";
  thumbnail?: string;
  deadline?: Date;
  progress: number; // 0 - 100
  targetAudience?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    platform: {
      type: String,
      enum: ["YouTube", "Instagram", "TikTok", "LinkedIn", "Multi-Platform"],
      default: "YouTube",
    },
    status: {
      type: String,
      enum: ["IDEA", "PLANNED", "RECORDING", "EDITING", "READY", "PUBLISHED"],
      default: "IDEA",
      index: true,
    },
    thumbnail: { type: String, default: "" },
    deadline: { type: Date },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    targetAudience: { type: String, default: "" },
  },
  { timestamps: true }
);

// --- CONTENT IDEA MODEL ---
export interface IIdea {
  _id?: string;
  userId: string;
  projectId?: string;
  title: string;
  description: string;
  topic: string;
  platform: "YouTube" | "Instagram" | "TikTok" | "LinkedIn" | "Multi-Platform";
  status: "IDEA" | "PLANNED" | "IN PRODUCTION" | "PUBLISHED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  targetAudience?: string;
  contentType?: string;
  createdAt: Date;
}

const IdeaSchema = new Schema<IIdea>(
  {
    userId: { type: String, required: true, index: true },
    projectId: { type: String, default: "" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    topic: { type: String, default: "" },
    platform: {
      type: String,
      enum: ["YouTube", "Instagram", "TikTok", "LinkedIn", "Multi-Platform"],
      default: "YouTube",
    },
    status: {
      type: String,
      enum: ["IDEA", "PLANNED", "IN PRODUCTION", "PUBLISHED"],
      default: "IDEA",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    targetAudience: { type: String, default: "" },
    contentType: { type: String, default: "Video" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// --- SCRIPT MODEL ---
export interface IScript {
  _id?: string;
  userId: string;
  projectId?: string;
  title: string;
  content: string;
  hooks: string[];
  titles: string[];
  captions: string[];
  tone?: string;
  platform: string;
  wordCount?: number;
  estimatedDuration?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScriptSchema = new Schema<IScript>(
  {
    userId: { type: String, required: true, index: true },
    projectId: { type: String, default: "", index: true },
    title: { type: String, required: true },
    content: { type: String, default: "" },
    hooks: [{ type: String }],
    titles: [{ type: String }],
    captions: [{ type: String }],
    tone: { type: String, default: "Engaging" },
    platform: { type: String, default: "YouTube" },
    wordCount: { type: Number, default: 0 },
    estimatedDuration: { type: String, default: "0m 0s" },
  },
  { timestamps: true }
);

// --- ASSET MODEL ---
export interface IAsset {
  _id?: string;
  userId: string;
  projectId?: string;
  name: string;
  type: "video" | "image" | "audio" | "thumbnail" | "document";
  url: string;
  size: number; // bytes
  tags: string[];
  createdAt: Date;
}

const AssetSchema = new Schema<IAsset>(
  {
    userId: { type: String, required: true, index: true },
    projectId: { type: String, default: "", index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["video", "image", "audio", "thumbnail", "document"],
      required: true,
    },
    url: { type: String, required: true },
    size: { type: Number, default: 0 },
    tags: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// --- CLIP MODEL ---
export interface IClip {
  _id?: string;
  userId: string;
  projectId?: string;
  title: string;
  startTime: number; // seconds
  endTime: number; // seconds
  hook: string;
  caption: string;
  platform: "Instagram Reels" | "YouTube Shorts" | "TikTok" | "LinkedIn";
  reason: string;
  matchedScriptSection?: string;
  status: "SUGGESTED" | "READY" | "EXPORTED";
  createdAt: Date;
}

const ClipSchema = new Schema<IClip>(
  {
    userId: { type: String, required: true, index: true },
    projectId: { type: String, default: "", index: true },
    title: { type: String, required: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    hook: { type: String, default: "" },
    caption: { type: String, default: "" },
    platform: {
      type: String,
      enum: ["Instagram Reels", "YouTube Shorts", "TikTok", "LinkedIn"],
      default: "YouTube Shorts",
    },
    reason: { type: String, default: "" },
    matchedScriptSection: { type: String, default: "" },
    status: {
      type: String,
      enum: ["SUGGESTED", "READY", "EXPORTED"],
      default: "SUGGESTED",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// --- REPURPOSED CONTENT MODEL ---
export interface IRepurposedContent {
  _id?: string;
  userId: string;
  projectId?: string;
  sourceType: "Script" | "Video Transcript" | "Existing Post" | "Podcast";
  platform: "Instagram" | "YouTube" | "LinkedIn" | "X" | "ShortForm";
  title?: string;
  hook?: string;
  content: string;
  caption?: string;
  chapters?: { time: string; title: string }[];
  cta?: string;
  hashtags?: string[];
  createdAt: Date;
}

const RepurposedContentSchema = new Schema<IRepurposedContent>(
  {
    userId: { type: String, required: true, index: true },
    projectId: { type: String, default: "", index: true },
    sourceType: { type: String, default: "Script" },
    platform: {
      type: String,
      enum: ["Instagram", "YouTube", "LinkedIn", "X", "ShortForm"],
      required: true,
    },
    title: { type: String, default: "" },
    hook: { type: String, default: "" },
    content: { type: String, required: true },
    caption: { type: String, default: "" },
    chapters: [{ time: String, title: String }],
    cta: { type: String, default: "" },
    hashtags: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// --- ANALYTICS MODEL ---
export interface IAnalytics {
  _id?: string;
  userId: string;
  projectId?: string;
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement: number; // percentage
  date: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    userId: { type: String, required: true, index: true },
    projectId: { type: String, default: "" },
    platform: { type: String, required: true },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// --- AI HISTORY MODEL ---
export interface IAIHistory {
  _id?: string;
  userId: string;
  projectId?: string;
  feature: string;
  prompt: string;
  response: string;
  createdAt: Date;
}

const AIHistorySchema = new Schema<IAIHistory>(
  {
    userId: { type: String, required: true, index: true },
    projectId: { type: String, default: "" },
    feature: { type: String, required: true },
    prompt: { type: String, required: true },
    response: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Model export helper to prevent recompilation in dev mode
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
export const Idea: Model<IIdea> = mongoose.models.Idea || mongoose.model<IIdea>("Idea", IdeaSchema);
export const Script: Model<IScript> = mongoose.models.Script || mongoose.model<IScript>("Script", ScriptSchema);
export const Asset: Model<IAsset> = mongoose.models.Asset || mongoose.model<IAsset>("Asset", AssetSchema);
export const Clip: Model<IClip> = mongoose.models.Clip || mongoose.model<IClip>("Clip", ClipSchema);
export const RepurposedContent: Model<IRepurposedContent> =
  mongoose.models.RepurposedContent || mongoose.model<IRepurposedContent>("RepurposedContent", RepurposedContentSchema);
export const Analytics: Model<IAnalytics> =
  mongoose.models.Analytics || mongoose.model<IAnalytics>("Analytics", AnalyticsSchema);
export const AIHistory: Model<IAIHistory> =
  mongoose.models.AIHistory || mongoose.model<IAIHistory>("AIHistory", AIHistorySchema);
