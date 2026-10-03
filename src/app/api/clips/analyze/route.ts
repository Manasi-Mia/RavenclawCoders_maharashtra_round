import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { DataService } from "@/lib/data-service";
import { connectToDatabase } from "@/lib/mongodb";
import { Asset, AssetChunk } from "@/models";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { analyzeTranscriptForClips } from "@/lib/gemini";
import os from "os";
import path from "path";
import fs from "fs";

export const maxDuration = 60;

interface GeneratedClipCandidate {
  title: string;
  startTime: number;
  endTime: number;
  hook: string;
  caption: string;
  platform: "Instagram Reels" | "YouTube Shorts" | "TikTok" | "LinkedIn";
  reason: string;
  matchedScriptSection: string;
  confidence?: number;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { assetId, transcript, script, projectId, autoSave } = body;

    const isDemoMode =
      user.email === "demo@creatorai.local" ||
      req.headers.get("x-demo-mode") === "true";

    const apiKey = process.env.GEMINI_API_KEY || "";

    // MODE 1: Direct Video Asset Analysis via Gemini Files API
    if (assetId) {
      if (!apiKey) {
        if (isDemoMode) {
          return returnDemoFallback(user._id, projectId, assetId);
        }
        return NextResponse.json(
          { error: "GEMINI_API_KEY is not configured on the server." },
          { status: 500 }
        );
      }

      await connectToDatabase();
      const asset = await Asset.findOne({ _id: assetId, userId: user._id }).lean();
      if (!asset) {
        return NextResponse.json({ error: "Video asset not found" }, { status: 404 });
      }

      // 50 MB / ~3 min limit check
      if (asset.size > 52428800) {
        return NextResponse.json(
          {
            error:
              "Video exceeds the 50 MB / ~3 minute auto-analysis limit. Please trim the video or use the transcript fallback mode below.",
          },
          { status: 400 }
        );
      }

      const chunks = await AssetChunk.find({ assetId }).sort({ index: 1 }).lean();
      if (!chunks || chunks.length === 0) {
        return NextResponse.json(
          { error: "Video chunks not found in storage. Ensure the file was uploaded properly." },
          { status: 404 }
        );
      }

      const fullBuffer = Buffer.concat(
        chunks.map((c) => Buffer.from((c.data as unknown as { buffer: ArrayBuffer }).buffer || (c.data as unknown as Uint8Array)))
      );
      const ext = asset.mimeType?.includes("webm")
        ? ".webm"
        : asset.mimeType?.includes("quicktime")
        ? ".mov"
        : ".mp4";
      const tempFilePath = path.join(os.tmpdir(), `gemini_analyze_${assetId}_${Date.now()}${ext}`);

      let uploadFileName: string | null = null;
      const fileManager = new GoogleAIFileManager(apiKey);

      try {
        await fs.promises.writeFile(tempFilePath, fullBuffer);

        // Upload to Gemini Files API
        const uploadResult = await fileManager.uploadFile(tempFilePath, {
          mimeType: asset.mimeType || "video/mp4",
          displayName: asset.name || "creator_footage",
        });

        uploadFileName = uploadResult.file.name;

        // Poll for ACTIVE state
        let file = await fileManager.getFile(uploadFileName);
        const pollStart = Date.now();
        while (file.state === FileState.PROCESSING) {
          if (Date.now() - pollStart > 45000) {
            throw new Error("Video processing timed out with Gemini Files API.");
          }
          await new Promise((r) => setTimeout(r, 2000));
          file = await fileManager.getFile(uploadFileName);
        }

        if (file.state === FileState.FAILED) {
          throw new Error("Gemini Files API could not process this video format.");
        }

        // Call gemini-2.5-flash
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
          },
        });

        const prompt = `You are an elite short-form video editor and creator retention analyst.
Analyze this creator video footage (both audio dialogue and visual scenes) and extract high-performing short-form clips.
${script ? `Reference Script for matched sections:\n"""\n${script.slice(0, 2000)}\n"""\n` : ""}

Tasks:
1. Provide a timestamped transcript with exact start/end in seconds.
2. Provide visual scene descriptions with start/end in seconds.
3. Identify 4 to 6 compelling 15-60 second short-form clip candidates for YouTube Shorts, TikTok, and Instagram Reels.
   Ensure each clip candidate has:
   - title: punchy clip title
   - startTime: in seconds
   - endTime: in seconds (duration between 15s and 60s)
   - hook: spoken or visual hook in first 3 seconds
   - caption: engaging social caption with relevant hashtags
   - platform: "YouTube Shorts" | "Instagram Reels" | "TikTok" | "LinkedIn"
   - reason: retention psychology breakdown
   - matchedScriptSection: section or concept reference
   - confidence: number between 0.85 and 0.99

Return ONLY valid JSON in this exact shape:
{
  "transcript": [
    { "start": 0, "end": 12, "text": "..." }
  ],
  "scenes": [
    { "start": 0, "end": 8, "description": "..." }
  ],
  "clips": [
    {
      "title": "...",
      "startTime": 0,
      "endTime": 35,
      "hook": "...",
      "caption": "...",
      "platform": "YouTube Shorts",
      "reason": "...",
      "matchedScriptSection": "...",
      "confidence": 0.95
    }
  ]
}`;

        const geminiRes = await model.generateContent([
          {
            fileData: {
              mimeType: uploadResult.file.mimeType,
              fileUri: uploadResult.file.uri,
            },
          },
          prompt,
        ]);

        const rawText = geminiRes.response.text();
        const parsed = JSON.parse(rawText);

        const clips: GeneratedClipCandidate[] = Array.isArray(parsed.clips) ? parsed.clips : [];
        const parsedTranscript = Array.isArray(parsed.transcript) ? parsed.transcript : [];
        const parsedScenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];

        // Save transcript & scenes to the asset
        await DataService.updateAsset(user._id, assetId, {
          transcript: parsedTranscript,
          scenes: parsedScenes,
        });

        // Save clips into Clip collection with status "SUGGESTED" and origin "ai"
        const savedClips = [];
        for (const c of clips) {
          const saved = await DataService.createClip(user._id, {
            projectId: projectId || asset.projectId || "",
            assetId,
            title: c.title,
            startTime: Number(c.startTime),
            endTime: Number(c.endTime),
            hook: c.hook || "",
            caption: c.caption || "",
            platform: c.platform || "YouTube Shorts",
            reason: c.reason || "",
            matchedScriptSection: c.matchedScriptSection || "",
            confidence: c.confidence || 0.9,
            origin: "ai",
            status: "SUGGESTED",
          });
          savedClips.push(saved);
        }

        return NextResponse.json({
          candidates: clips,
          transcript: parsedTranscript,
          scenes: parsedScenes,
          savedClips,
          isSampleData: false,
        });
      } finally {
        // Cleanup temp file and Gemini uploaded file
        fs.promises.unlink(tempFilePath).catch(() => {});
        if (uploadFileName) {
          fileManager.deleteFile(uploadFileName).catch(() => {});
        }
      }
    }

    // MODE 2: Transcript Fallback Analysis
    if (transcript && transcript.trim().length > 0) {
      try {
        const candidates = await analyzeTranscriptForClips({
          transcript,
          script,
        });

        const savedClips = [];
        if (autoSave && Array.isArray(candidates)) {
          for (const item of candidates) {
            const saved = await DataService.createClip(user._id, {
              projectId: projectId || "",
              title: item.title,
              startTime: item.startTime,
              endTime: item.endTime,
              hook: item.hook,
              caption: item.caption,
              platform: item.platform,
              reason: item.reason,
              matchedScriptSection: item.matchedScriptSection,
              origin: "ai",
              status: "SUGGESTED",
            });
            savedClips.push(saved);
          }
        }

        return NextResponse.json({
          candidates,
          savedClips: savedClips.length > 0 ? savedClips : undefined,
          isSampleData: false,
        });
      } catch (err: unknown) {
        if (isDemoMode) {
          return returnDemoFallback(user._id, projectId, assetId);
        }
        const msg = err instanceof Error ? err.message : String(err);
        return NextResponse.json(
          { error: `Gemini transcript analysis failed: ${msg}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Either a video assetId or transcript text must be provided for clip analysis." },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Clip Analysis Route Error:", error);
    const msg = error instanceof Error ? error.message : "Failed to analyze video footage";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

function returnDemoFallback(userId: string, projectId?: string, assetId?: string) {
  const sampleCandidates: GeneratedClipCandidate[] = [
    {
      title: "The 48-Hour AI App Framework",
      startTime: 14,
      endTime: 52,
      hook: "90% of developers spend 6 months building an MVP nobody wants. Stop doing that.",
      caption:
        "The exact sprint roadmap to validate and ship in 48 hours. ⏱️ #buildinpublic #solopreneur #ai",
      platform: "YouTube Shorts",
      reason: "Aggressive contrarian hook that immediately challenges common developer habit.",
      matchedScriptSection: "SECTION 1: THE CORE ARCHITECTURE",
      confidence: 0.94,
    },
    {
      title: "Why Kubernetes Before Users Is Procrastination",
      startTime: 58,
      endTime: 104,
      hook: "If you are configuring Kubernetes before your first paying user, you are procrastinating.",
      caption: "Keep it simple until scale actually forces you to complicate. 🛑 #startups #tech #coding",
      platform: "Instagram Reels",
      reason: "High emotional resonance and relatable developer humor with strong retention curve.",
      matchedScriptSection: "PRODUCTION REALITY",
      confidence: 0.92,
    },
    {
      title: "How We Got 500 Users in 48 Hours",
      startTime: 110,
      endTime: 155,
      hook: "We shared real-time commit logs on X and LinkedIn, driving our first 500 signups.",
      caption: "Building in public isn't bragging — it's customer discovery in real-time. 📈 #growth #saas",
      platform: "TikTok",
      reason: "Actionable traction proof point that provides immediate credibility.",
      matchedScriptSection: "DISTRIBUTION CHANNELS",
      confidence: 0.96,
    },
  ];

  return NextResponse.json({
    candidates: sampleCandidates,
    isSampleData: true,
    message: "Demo mode sample clips generated.",
  });
}
