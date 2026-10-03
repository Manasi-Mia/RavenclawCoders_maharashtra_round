import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { repurposeContent } from "@/lib/gemini";
import { DataService } from "@/lib/data-service";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || undefined;

    const items = await DataService.getRepurposed(user._id, projectId);
    return NextResponse.json({ repurposed: items });
  } catch (error) {
    console.error("GET Repurposed Error:", error);
    return NextResponse.json({ error: "Failed to fetch repurposed content" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Mode 1: Generate using AI
    if (body.action === "generate") {
      const { sourceText, sourceType, projectId } = body;
      if (!sourceText) {
        return NextResponse.json({ error: "Source text is required" }, { status: 400 });
      }

      const results = await repurposeContent({
        sourceText,
        sourceType: sourceType || "Script",
        creatorType: user.creatorType,
        specializations: user.specializations,
      });

      return NextResponse.json({ results });
    }

    // Mode 2: Save a specific adapted version to database
    if (body.action === "save") {
      const { platform, content, hook, caption, chapters, cta, hashtags, projectId, title } = body;
      if (!platform || !content) {
        return NextResponse.json({ error: "Platform and content are required to save" }, { status: 400 });
      }

      const saved = await DataService.createRepurposed(user._id, {
        platform,
        content,
        hook,
        caption,
        chapters,
        cta,
        hashtags,
        projectId,
        title,
      });

      return NextResponse.json({ saved }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST Repurpose Error:", error);
    return NextResponse.json({ error: "Failed to process repurpose request" }, { status: 500 });
  }
}
