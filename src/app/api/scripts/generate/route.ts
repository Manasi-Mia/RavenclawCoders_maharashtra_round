import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateScript } from "@/lib/gemini";
import { DataService } from "@/lib/data-service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topic, targetAudience, platform, tone, duration, contentType, projectId, saveToProject } =
      await req.json();

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json({ error: "Topic is required for script generation" }, { status: 400 });
    }

    const result = await generateScript({
      topic,
      targetAudience,
      platform,
      tone,
      duration,
      contentType,
    });

    let savedScript = null;
    if (saveToProject && projectId) {
      savedScript = await DataService.createScript(user._id, {
        projectId,
        title: result.title,
        content: result.script,
        hooks: result.hooks,
        titles: result.titles,
        captions: result.captions,
        tone: tone || "Engaging",
        platform: platform || "YouTube",
      });
    }

    return NextResponse.json({
      data: result,
      savedScript,
    });
  } catch (error) {
    console.error("Script Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate script" }, { status: 500 });
  }
}
