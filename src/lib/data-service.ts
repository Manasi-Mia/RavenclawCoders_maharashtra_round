import { connectToDatabase } from "./mongodb";
import {
  User,
  Project,
  Idea,
  Script,
  Asset,
  AssetChunk,
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

  async updateUser(id: string, data: Partial<IUser>): Promise<IUser | null> {
    const conn = await connectToDatabase();
    if (conn) {
      const updated = await User.findByIdAndUpdate(id, data, { new: true }).lean();
      return updated ? (JSON.parse(JSON.stringify(updated)) as IUser) : null;
    }
    const idx = memoryStore.users.findIndex((u) => u._id === id);
    if (idx === -1) return null;
    const updated = { ...memoryStore.users[idx], ...data };
    memoryStore.users[idx] = updated;
    return updated;
  },

  async deleteUserAndData(userId: string): Promise<boolean> {
    const conn = await connectToDatabase();
    if (conn) {
      const userAssets = await Asset.find({ userId }).select("_id").lean();
      const assetIds = userAssets.map((a) => String(a._id));
      if (assetIds.length > 0) {
        await AssetChunk.deleteMany({ assetId: { $in: assetIds } });
      }
      await Asset.deleteMany({ userId });
      await Project.deleteMany({ userId });
      await Idea.deleteMany({ userId });
      await Script.deleteMany({ userId });
      await Clip.deleteMany({ userId });
      await RepurposedContent.deleteMany({ userId });
      await Analytics.deleteMany({ userId });
      await AIHistory.deleteMany({ userId });
      await User.deleteOne({ _id: userId });
    }

    // Always clear memory store as well
    memoryStore.users = memoryStore.users.filter((u) => u._id !== userId);
    memoryStore.projects = memoryStore.projects.filter((p) => p.userId !== userId);
    memoryStore.ideas = memoryStore.ideas.filter((i) => i.userId !== userId);
    memoryStore.scripts = memoryStore.scripts.filter((s) => s.userId !== userId);
    memoryStore.assets = memoryStore.assets.filter((a) => a.userId !== userId);
    memoryStore.clips = memoryStore.clips.filter((c) => c.userId !== userId);
    memoryStore.repurposed = memoryStore.repurposed.filter((r) => r.userId !== userId);
    memoryStore.analytics = memoryStore.analytics.filter((an) => an.userId !== userId);
    memoryStore.aiHistory = memoryStore.aiHistory.filter((ai) => ai.userId !== userId);

    return true;
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

  async updateAsset(userId: string, assetId: string, data: Partial<IAsset>): Promise<IAsset | null> {
    const conn = await connectToDatabase();
    if (conn) {
      const updated = await Asset.findOneAndUpdate(
        { _id: assetId, userId },
        { ...data, updatedAt: new Date() },
        { new: true }
      ).lean();
      return updated ? (JSON.parse(JSON.stringify(updated)) as IAsset) : null;
    }
    const idx = memoryStore.assets.findIndex((a) => a._id === assetId && a.userId === userId);
    if (idx === -1) return null;
    const updated = {
      ...memoryStore.assets[idx],
      ...data,
      updatedAt: new Date(),
    };
    memoryStore.assets[idx] = updated;
    return updated;
  },

  async deleteAsset(userId: string, assetId: string): Promise<boolean> {
    const conn = await connectToDatabase();
    if (conn) {
      const res = await Asset.deleteOne({ _id: assetId, userId });
      if (res.deletedCount > 0) {
        await AssetChunk.deleteMany({ assetId });
      }
      return res.deletedCount > 0;
    }
    const initialLen = memoryStore.assets.length;
    memoryStore.assets = memoryStore.assets.filter((a) => !(a._id === assetId && a.userId === userId));
    return memoryStore.assets.length < initialLen;
  },

  // --- CLIPS ---
  async getClips(userId: string, projectId?: string, assetId?: string): Promise<IClip[]> {
    const conn = await connectToDatabase();
    const query: Record<string, string> = { userId };
    if (projectId) query.projectId = projectId;
    if (assetId) query.assetId = assetId;

    if (conn) {
      const items = await Clip.find(query).sort({ startTime: 1 }).lean();
      return JSON.parse(JSON.stringify(items)) as IClip[];
    }
    return memoryStore.clips
      .filter(
        (c) =>
          c.userId === userId &&
          (!projectId || c.projectId === projectId) &&
          (!assetId || c.assetId === assetId)
      )
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
      assetId: data.assetId || "",
      title: data.title || "Clip",
      startTime: data.startTime || 0,
      endTime: data.endTime || 30,
      hook: data.hook || "",
      caption: data.caption || "",
      platform: data.platform || "YouTube Shorts",
      reason: data.reason || "",
      matchedScriptSection: data.matchedScriptSection || "",
      confidence: data.confidence || 0.9,
      origin: data.origin || "ai",
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

  async createAnalytics(userId: string, data: Partial<IAnalytics>): Promise<IAnalytics> {
    const conn = await connectToDatabase();
    const views = Number(data.views) || 0;
    const likes = Number(data.likes) || 0;
    const comments = Number(data.comments) || 0;
    const shares = Number(data.shares) || 0;
    const engagement = views > 0 ? Number((((likes + comments + shares) / views) * 100).toFixed(2)) : 0;
    const date = data.date ? new Date(data.date) : new Date();

    if (conn) {
      const item = await Analytics.create({
        ...data,
        userId,
        views,
        likes,
        comments,
        shares,
        engagement,
        date,
      });
      return JSON.parse(JSON.stringify(item)) as IAnalytics;
    }
    const newEntry: IAnalytics = {
      _id: generateId(),
      userId,
      projectId: data.projectId || "",
      platform: data.platform || "YouTube",
      views,
      likes,
      comments,
      shares,
      engagement,
      date,
    };
    memoryStore.analytics.unshift(newEntry);
    return newEntry;
  },

  async deleteAnalytics(userId: string, id: string): Promise<boolean> {
    const conn = await connectToDatabase();
    if (conn) {
      const res = await Analytics.deleteOne({ _id: id, userId });
      return res.deletedCount > 0;
    }
    const initialLen = memoryStore.analytics.length;
    memoryStore.analytics = memoryStore.analytics.filter((a) => !(a._id === id && a.userId === userId));
    return memoryStore.analytics.length < initialLen;
  },

  async getContentPipelineStats(userId: string) {
    const conn = await connectToDatabase();
    if (conn) {
      const [ideas, scripts, clips, repurposed, projects, analytics] = await Promise.all([
        Idea.find({ userId }).lean(),
        Script.find({ userId }).lean(),
        Clip.find({ userId }).lean(),
        RepurposedContent.find({ userId }).lean(),
        Project.find({ userId }).lean(),
        Analytics.find({ userId }).lean(),
      ]);

      const ideasByStatus = {
        IDEA: ideas.filter((i) => i.status === "IDEA").length,
        PLANNED: ideas.filter((i) => i.status === "PLANNED").length,
        IN_PRODUCTION: ideas.filter((i) => i.status === "IN PRODUCTION").length,
        PUBLISHED: ideas.filter((i) => i.status === "PUBLISHED").length,
      };

      const clipsByStatus = {
        SUGGESTED: clips.filter((c) => c.status === "SUGGESTED").length,
        APPROVED: clips.filter((c) => c.status === "APPROVED").length,
        REJECTED: clips.filter((c) => c.status === "REJECTED").length,
      };

      const repurposedByPlatform: Record<string, number> = {};
      repurposed.forEach((r) => {
        const plat = r.platform || "Other";
        repurposedByPlatform[plat] = (repurposedByPlatform[plat] || 0) + 1;
      });

      const projectsByStage: Record<string, number> = {
        IDEA: 0,
        SCRIPTING: 0,
        RECORDING: 0,
        EDITING: 0,
        REPURPOSING: 0,
        PUBLISHED: 0,
      };
      projects.forEach((p) => {
        const stage = p.status || "IDEA";
        projectsByStage[stage] = (projectsByStage[stage] || 0) + 1;
      });

      const activityDates = new Set<string>();
      analytics.forEach((a) => {
        if (a.date) activityDates.add(new Date(a.date).toISOString().split("T")[0]);
      });
      projects.filter((p) => p.status === "PUBLISHED").forEach((p) => {
        if (p.updatedAt) activityDates.add(new Date(p.updatedAt).toISOString().split("T")[0]);
      });

      let streak = 0;
      if (activityDates.size > 0) {
        const today = new Date();
        const cursor = new Date(today);
        const todayStr = cursor.toISOString().split("T")[0];
        cursor.setDate(cursor.getDate() - 1);
        const yesterdayStr = cursor.toISOString().split("T")[0];

        const startCursor = activityDates.has(todayStr) ? new Date(today) : (activityDates.has(yesterdayStr) ? cursor : null);
        if (startCursor) {
          while (true) {
            const dateStr = startCursor.toISOString().split("T")[0];
            if (activityDates.has(dateStr)) {
              streak++;
              startCursor.setDate(startCursor.getDate() - 1);
            } else {
              break;
            }
          }
        }
      }

      return {
        ideasCount: ideas.length,
        ideasByStatus,
        scriptsCount: scripts.length,
        clipsCount: clips.length,
        clipsByStatus,
        repurposedCount: repurposed.length,
        repurposedByPlatform,
        projectsCount: projects.length,
        projectsByStage,
        publishingStreak: streak,
      };
    }

    // In-memory fallback
    const ideas = memoryStore.ideas.filter((i) => i.userId === userId);
    const scripts = memoryStore.scripts.filter((s) => s.userId === userId);
    const clips = memoryStore.clips.filter((c) => c.userId === userId);
    const repurposed = memoryStore.repurposed.filter((r) => r.userId === userId);
    const projects = memoryStore.projects.filter((p) => p.userId === userId);
    const analytics = memoryStore.analytics.filter((a) => a.userId === userId);

    const ideasByStatus = {
      IDEA: ideas.filter((i) => i.status === "IDEA").length,
      PLANNED: ideas.filter((i) => i.status === "PLANNED").length,
      IN_PRODUCTION: ideas.filter((i) => i.status === "IN PRODUCTION").length,
      PUBLISHED: ideas.filter((i) => i.status === "PUBLISHED").length,
    };

    const clipsByStatus = {
      SUGGESTED: clips.filter((c) => c.status === "SUGGESTED").length,
      APPROVED: clips.filter((c) => c.status === "APPROVED").length,
      REJECTED: clips.filter((c) => c.status === "REJECTED").length,
    };

    const repurposedByPlatform: Record<string, number> = {};
    repurposed.forEach((r) => {
      const plat = r.platform || "Other";
      repurposedByPlatform[plat] = (repurposedByPlatform[plat] || 0) + 1;
    });

    const projectsByStage: Record<string, number> = {
      IDEA: 0,
      SCRIPTING: 0,
      RECORDING: 0,
      EDITING: 0,
      REPURPOSING: 0,
      PUBLISHED: 0,
    };
    projects.forEach((p) => {
      const stage = p.status || "IDEA";
      projectsByStage[stage] = (projectsByStage[stage] || 0) + 1;
    });

    return {
      ideasCount: ideas.length,
      ideasByStatus,
      scriptsCount: scripts.length,
      clipsCount: clips.length,
      clipsByStatus,
      repurposedCount: repurposed.length,
      repurposedByPlatform,
      projectsCount: projects.length,
      projectsByStage,
      publishingStreak: Math.min(analytics.length, 5),
    };
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
