import { connectToDatabase } from "./mongodb";
import {
  User,
  Project,
  Idea,
  Script,
  Asset,
  Clip,
  RepurposedContent,
  Analytics,
  AIHistory,
  IUser,
  IProject,
  IIdea,
  IScript,
  IAsset,
  IClip,
  IRepurposedContent,
  IAnalytics,
  IAIHistory,
} from "@/models";
import { memoryStore, generateId, seedRealisticDemoData } from "./memory-store";

// UNIFIED DATA SERVICE

export const DataService = {
  // --- USERS ---
  async getUserByEmail(email: string): Promise<IUser | null> {
    const conn = await connectToDatabase();
    if (conn) {
      const user = await User.findOne({ email: email.toLowerCase() }).lean();
      return user ? (JSON.parse(JSON.stringify(user)) as IUser) : null;
    }
    const memUser = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return memUser ? { ...memUser } : null;
  },

  async getUserById(id: string): Promise<IUser | null> {
    const conn = await connectToDatabase();
    if (conn) {
      const user = await User.findById(id).lean();
      return user ? (JSON.parse(JSON.stringify(user)) as IUser) : null;
    }
    const memUser = memoryStore.users.find((u) => u._id === id);
    return memUser ? { ...memUser } : null;
  },

  async createUser(data: Omit<IUser, "_id" | "createdAt">): Promise<IUser> {
    const conn = await connectToDatabase();
    if (conn) {
      const created = await User.create({
        ...data,
        email: data.email.toLowerCase(),
        createdAt: new Date(),
      });
      return JSON.parse(JSON.stringify(created)) as IUser;
    }
    const newUser: IUser = {
      ...data,
      _id: generateId(),
      email: data.email.toLowerCase(),
      createdAt: new Date(),
    };
    memoryStore.users.push(newUser);
    return newUser;
  },

  // --- PROJECTS ---
  async getProjects(userId: string): Promise<IProject[]> {
    const conn = await connectToDatabase();
    if (conn) {
      const items = await Project.find({ userId }).sort({ updatedAt: -1 }).lean();
      return JSON.parse(JSON.stringify(items)) as IProject[];
    }
    return memoryStore.projects
      .filter((p) => p.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getProjectById(userId: string, projectId: string): Promise<IProject | null> {
    const conn = await connectToDatabase();
    if (conn) {
      const item = await Project.findOne({ _id: projectId, userId }).lean();
      return item ? (JSON.parse(JSON.stringify(item)) as IProject) : null;
    }
    const item = memoryStore.projects.find((p) => p._id === projectId && p.userId === userId);
    return item ? { ...item } : null;
  },

  async createProject(userId: string, data: Partial<IProject>): Promise<IProject> {
    const conn = await connectToDatabase();
    const now = new Date();
    if (conn) {
      const item = await Project.create({
        ...data,
        userId,
        createdAt: now,
        updatedAt: now,
      });
      return JSON.parse(JSON.stringify(item)) as IProject;
    }
    const newProject: IProject = {
      _id: generateId(),
      userId,
      title: data.title || "Untitled Project",
      description: data.description || "",
      platform: data.platform || "YouTube",
      status: data.status || "IDEA",
      thumbnail:
        data.thumbnail ||
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      progress: data.progress ?? 10,
      targetAudience: data.targetAudience || "",
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.projects.unshift(newProject);
    return newProject;
  },

  async updateProject(userId: string, projectId: string, data: Partial<IProject>): Promise<IProject | null> {
    const conn = await connectToDatabase();
    if (conn) {
      const updated = await Project.findOneAndUpdate(
        { _id: projectId, userId },
        { ...data, updatedAt: new Date() },
        { new: true }
      ).lean();
      return updated ? (JSON.parse(JSON.stringify(updated)) as IProject) : null;
    }
    const idx = memoryStore.projects.findIndex((p) => p._id === projectId && p.userId === userId);
    if (idx === -1) return null;
    const updated = {
      ...memoryStore.projects[idx],
      ...data,
      updatedAt: new Date(),
    };
    memoryStore.projects[idx] = updated;
    return updated;
  },

  async deleteProject(userId: string, projectId: string): Promise<boolean> {
    const conn = await connectToDatabase();
    if (conn) {
      const res = await Project.deleteOne({ _id: projectId, userId });
      // also cleanup associated scripts, clips, assets
      await Script.deleteMany({ projectId, userId });
      await Clip.deleteMany({ projectId, userId });
      await Asset.deleteMany({ projectId, userId });
      await RepurposedContent.deleteMany({ projectId, userId });
      return res.deletedCount > 0;
    }
    const initialLen = memoryStore.projects.length;
    memoryStore.projects = memoryStore.projects.filter((p) => !(p._id === projectId && p.userId === userId));
    memoryStore.scripts = memoryStore.scripts.filter((s) => !(s.projectId === projectId && s.userId === userId));
    memoryStore.clips = memoryStore.clips.filter((c) => !(c.projectId === projectId && c.userId === userId));
    memoryStore.assets = memoryStore.assets.filter((a) => !(a.projectId === projectId && a.userId === userId));
    memoryStore.repurposed = memoryStore.repurposed.filter((r) => !(r.projectId === projectId && r.userId === userId));
    return memoryStore.projects.length < initialLen;
  },

  // --- CONTENT IDEAS ---
  async getIdeas(userId: string): Promise<IIdea[]> {
    const conn = await connectToDatabase();
    if (conn) {
      const items = await Idea.find({ userId }).sort({ createdAt: -1 }).lean();
      return JSON.parse(JSON.stringify(items)) as IIdea[];
    }
    return memoryStore.ideas
      .filter((i) => i.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createIdea(userId: string, data: Partial<IIdea>): Promise<IIdea> {
    const conn = await connectToDatabase();
    const now = new Date();
    if (conn) {
      const item = await Idea.create({
        ...data,
        userId,
        createdAt: now,
      });
      return JSON.parse(JSON.stringify(item)) as IIdea;
    }
    const newIdea: IIdea = {
      _id: generateId(),
      userId,
      projectId: data.projectId || "",
      title: data.title || "Untitled Idea",
      description: data.description || "",
      topic: data.topic || "",
      platform: data.platform || "YouTube",
      status: data.status || "IDEA",
      priority: data.priority || "MEDIUM",
      targetAudience: data.targetAudience || "",
      contentType: data.contentType || "Video",
      createdAt: now,
    };
    memoryStore.ideas.unshift(newIdea);
    return newIdea;
  },

  async updateIdea(userId: string, ideaId: string, data: Partial<IIdea>): Promise<IIdea | null> {
    const conn = await connectToDatabase();
    if (conn) {
      const updated = await Idea.findOneAndUpdate({ _id: ideaId, userId }, data, { new: true }).lean();
      return updated ? (JSON.parse(JSON.stringify(updated)) as IIdea) : null;
    }
    const idx = memoryStore.ideas.findIndex((i) => i._id === ideaId && i.userId === userId);
    if (idx === -1) return null;
    const updated = { ...memoryStore.ideas[idx], ...data };
    memoryStore.ideas[idx] = updated;
    return updated;
  },

  async deleteIdea(userId: string, ideaId: string): Promise<boolean> {
    const conn = await connectToDatabase();
    if (conn) {
      const res = await Idea.deleteOne({ _id: ideaId, userId });
      return res.deletedCount > 0;
    }
    const initialLen = memoryStore.ideas.length;
    memoryStore.ideas = memoryStore.ideas.filter((i) => !(i._id === ideaId && i.userId === userId));
    return memoryStore.ideas.length < initialLen;
  },

  // --- SCRIPTS ---
  async getScripts(userId: string, projectId?: string): Promise<IScript[]> {
    const conn = await connectToDatabase();
    const query: Record<string, string> = { userId };
    if (projectId) query.projectId = projectId;

    if (conn) {
      const items = await Script.find(query).sort({ updatedAt: -1 }).lean();
      return JSON.parse(JSON.stringify(items)) as IScript[];
    }
    return memoryStore.scripts
      .filter((s) => s.userId === userId && (!projectId || s.projectId === projectId))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getScriptById(userId: string, scriptId: string): Promise<IScript | null> {
    const conn = await connectToDatabase();
    if (conn) {
      const item = await Script.findOne({ _id: scriptId, userId }).lean();
      return item ? (JSON.parse(JSON.stringify(item)) as IScript) : null;
    }
    const item = memoryStore.scripts.find((s) => s._id === scriptId && s.userId === userId);
    return item ? { ...item } : null;
  },

  async createScript(userId: string, data: Partial<IScript>): Promise<IScript> {
    const conn = await connectToDatabase();
    const now = new Date();
    const words = data.content?.trim() ? data.content.trim().split(/\s+/).length : 0;
    const estSec = Math.round((words / 130) * 60);
    const duration = `${Math.floor(estSec / 60)}m ${estSec % 60}s`;

    if (conn) {
      const item = await Script.create({
        ...data,
        userId,
        wordCount: words,
        estimatedDuration: duration,
        createdAt: now,
        updatedAt: now,
      });
      return JSON.parse(JSON.stringify(item)) as IScript;
    }
    const newScript: IScript = {
      _id: generateId(),
      userId,
      projectId: data.projectId || "",
      title: data.title || "Untitled Script",
      content: data.content || "",
      hooks: data.hooks || [],
      titles: data.titles || [],
      captions: data.captions || [],
      tone: data.tone || "Engaging",
      platform: data.platform || "YouTube",
      wordCount: words,
      estimatedDuration: duration,
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.scripts.unshift(newScript);
    return newScript;
  },

  async updateScript(userId: string, scriptId: string, data: Partial<IScript>): Promise<IScript | null> {
    const conn = await connectToDatabase();
    const now = new Date();
    let wordCount = data.wordCount;
    let estimatedDuration = data.estimatedDuration;
    if (data.content !== undefined) {
      const words = data.content.trim() ? data.content.trim().split(/\s+/).length : 0;
      const estSec = Math.round((words / 130) * 60);
      wordCount = words;
      estimatedDuration = `${Math.floor(estSec / 60)}m ${estSec % 60}s`;
    }

    if (conn) {
      const updated = await Script.findOneAndUpdate(
        { _id: scriptId, userId },
        { ...data, wordCount, estimatedDuration, updatedAt: now },
        { new: true }
      ).lean();
      return updated ? (JSON.parse(JSON.stringify(updated)) as IScript) : null;
    }
    const idx = memoryStore.scripts.findIndex((s) => s._id === scriptId && s.userId === userId);
    if (idx === -1) return null;
    const updated = {
      ...memoryStore.scripts[idx],
      ...data,
      wordCount: wordCount ?? memoryStore.scripts[idx].wordCount,
      estimatedDuration: estimatedDuration ?? memoryStore.scripts[idx].estimatedDuration,
      updatedAt: now,
    };
    memoryStore.scripts[idx] = updated;
    return updated;
  },

  async deleteScript(userId: string, scriptId: string): Promise<boolean> {
    const conn = await connectToDatabase();
    if (conn) {
      const res = await Script.deleteOne({ _id: scriptId, userId });
      return res.deletedCount > 0;
    }
    const initialLen = memoryStore.scripts.length;
    memoryStore.scripts = memoryStore.scripts.filter((s) => !(s._id === scriptId && s.userId === userId));
    return memoryStore.scripts.length < initialLen;
  },

  // --- ASSETS ---
  async getAssets(userId: string, projectId?: string): Promise<IAsset[]> {
    const conn = await connectToDatabase();
    const query: Record<string, string> = { userId };
    if (projectId) query.projectId = projectId;

    if (conn) {
      const items = await Asset.find(query).sort({ createdAt: -1 }).lean();
      return JSON.parse(JSON.stringify(items)) as IAsset[];
    }
    return memoryStore.assets
      .filter((a) => a.userId === userId && (!projectId || a.projectId === projectId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createAsset(userId: string, data: Partial<IAsset>): Promise<IAsset> {
    const conn = await connectToDatabase();
    const now = new Date();
    if (conn) {
      const item = await Asset.create({
        ...data,
        userId,
        createdAt: now,
      });
      return JSON.parse(JSON.stringify(item)) as IAsset;
    }
    const newAsset: IAsset = {
      _id: generateId(),
      userId,
      projectId: data.projectId || "",
      name: data.name || "File Asset",
      type: data.type || "image",
      url: data.url || "",
      size: data.size || 0,
      tags: data.tags || [],
      createdAt: now,
    };
    memoryStore.assets.unshift(newAsset);
    return newAsset;
  },

  async deleteAsset(userId: string, assetId: string): Promise<boolean> {
    const conn = await connectToDatabase();
    if (conn) {
      const res = await Asset.deleteOne({ _id: assetId, userId });
      return res.deletedCount > 0;
    }
    const initialLen = memoryStore.assets.length;
    memoryStore.assets = memoryStore.assets.filter((a) => !(a._id === assetId && a.userId === userId));
    return memoryStore.assets.length < initialLen;
  },

  // --- CLIPS ---
  async getClips(userId: string, projectId?: string): Promise<IClip[]> {
    const conn = await connectToDatabase();
    const query: Record<string, string> = { userId };
    if (projectId) query.projectId = projectId;

    if (conn) {
      const items = await Clip.find(query).sort({ startTime: 1 }).lean();
      return JSON.parse(JSON.stringify(items)) as IClip[];
    }
    return memoryStore.clips
      .filter((c) => c.userId === userId && (!projectId || c.projectId === projectId))
      .sort((a, b) => a.startTime - b.startTime);
  },

  async createClip(userId: string, data: Partial<IClip>): Promise<IClip> {
    const conn = await connectToDatabase();
    const now = new Date();
    if (conn) {
      const item = await Clip.create({
        ...data,
        userId,
        createdAt: now,
      });
      return JSON.parse(JSON.stringify(item)) as IClip;
    }
    const newClip: IClip = {
      _id: generateId(),
      userId,
      projectId: data.projectId || "",
      title: data.title || "Clip",
      startTime: data.startTime || 0,
      endTime: data.endTime || 30,
      hook: data.hook || "",
      caption: data.caption || "",
      platform: data.platform || "YouTube Shorts",
      reason: data.reason || "",
      matchedScriptSection: data.matchedScriptSection || "",
      status: data.status || "SUGGESTED",
      createdAt: now,
    };
    memoryStore.clips.push(newClip);
    return newClip;
  },

  async updateClip(userId: string, clipId: string, data: Partial<IClip>): Promise<IClip | null> {
    const conn = await connectToDatabase();
    if (conn) {
      const updated = await Clip.findOneAndUpdate({ _id: clipId, userId }, data, { new: true }).lean();
      return updated ? (JSON.parse(JSON.stringify(updated)) as IClip) : null;
    }
    const idx = memoryStore.clips.findIndex((c) => c._id === clipId && c.userId === userId);
    if (idx === -1) return null;
    const updated = { ...memoryStore.clips[idx], ...data };
    memoryStore.clips[idx] = updated;
    return updated;
  },

  async deleteClip(userId: string, clipId: string): Promise<boolean> {
    const conn = await connectToDatabase();
    if (conn) {
      const res = await Clip.deleteOne({ _id: clipId, userId });
      return res.deletedCount > 0;
    }
    const initialLen = memoryStore.clips.length;
    memoryStore.clips = memoryStore.clips.filter((c) => !(c._id === clipId && c.userId === userId));
    return memoryStore.clips.length < initialLen;
  },

  // --- REPURPOSED CONTENT ---
  async getRepurposed(userId: string, projectId?: string): Promise<IRepurposedContent[]> {
    const conn = await connectToDatabase();
    const query: Record<string, string> = { userId };
    if (projectId) query.projectId = projectId;

    if (conn) {
      const items = await RepurposedContent.find(query).sort({ createdAt: -1 }).lean();
      return JSON.parse(JSON.stringify(items)) as IRepurposedContent[];
    }
    return memoryStore.repurposed
      .filter((r) => r.userId === userId && (!projectId || r.projectId === projectId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createRepurposed(userId: string, data: Partial<IRepurposedContent>): Promise<IRepurposedContent> {
    const conn = await connectToDatabase();
    const now = new Date();
    if (conn) {
      const item = await RepurposedContent.create({
        ...data,
        userId,
        createdAt: now,
      });
      return JSON.parse(JSON.stringify(item)) as IRepurposedContent;
    }
    const newRep: IRepurposedContent = {
      _id: generateId(),
      userId,
      projectId: data.projectId || "",
      sourceType: data.sourceType || "Script",
      platform: data.platform || "Instagram",
      title: data.title || "",
      hook: data.hook || "",
      content: data.content || "",
      caption: data.caption || "",
      chapters: data.chapters || [],
      cta: data.cta || "",
      hashtags: data.hashtags || [],
      createdAt: now,
    };
    memoryStore.repurposed.unshift(newRep);
    return newRep;
  },

  // --- ANALYTICS ---
  async getAnalytics(userId: string, projectId?: string): Promise<IAnalytics[]> {
    const conn = await connectToDatabase();
    const query: Record<string, string> = { userId };
    if (projectId) query.projectId = projectId;

    if (conn) {
      const items = await Analytics.find(query).sort({ date: -1 }).lean();
      return JSON.parse(JSON.stringify(items)) as IAnalytics[];
    }
    return memoryStore.analytics
      .filter((a) => a.userId === userId && (!projectId || a.projectId === projectId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  // --- DEMO SEEDING ---
  async seedDemo(userId: string) {
    const conn = await connectToDatabase();
    // seed in memory
    const { projectId, scriptId } = seedRealisticDemoData(userId);

    // If connected to mongo, sync the seeded items into mongo
    if (conn) {
      // Clean previous demo user items
      await Project.deleteMany({ userId });
      await Idea.deleteMany({ userId });
      await Script.deleteMany({ userId });
      await Asset.deleteMany({ userId });
      await Clip.deleteMany({ userId });
      await RepurposedContent.deleteMany({ userId });
      await Analytics.deleteMany({ userId });

      const userProjects = memoryStore.projects.filter((p) => p.userId === userId);
      const userIdeas = memoryStore.ideas.filter((i) => i.userId === userId);
      const userScripts = memoryStore.scripts.filter((s) => s.userId === userId);
      const userAssets = memoryStore.assets.filter((a) => a.userId === userId);
      const userClips = memoryStore.clips.filter((c) => c.userId === userId);
      const userRepurposed = memoryStore.repurposed.filter((r) => r.userId === userId);
      const userAnalytics = memoryStore.analytics.filter((an) => an.userId === userId);

      if (userProjects.length) await Project.insertMany(userProjects);
      if (userIdeas.length) await Idea.insertMany(userIdeas);
      if (userScripts.length) await Script.insertMany(userScripts);
      if (userAssets.length) await Asset.insertMany(userAssets);
      if (userClips.length) await Clip.insertMany(userClips);
      if (userRepurposed.length) await RepurposedContent.insertMany(userRepurposed);
      if (userAnalytics.length) await Analytics.insertMany(userAnalytics);
    }

    return { success: true, projectId, scriptId };
  },
};
