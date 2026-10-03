import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { analyzeTranscriptForClips } from "@/lib/gemini";
import { DataService } from "@/lib/data-service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transcript, script, projectId, autoSave } = await req.json();

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ error: "Transcript is required for analysis" }, { status: 400 });
    }

    const candidates = await analyzeTranscriptForClips({
      transcript,
      script,
    });

    let savedClips = [];
    if (autoSave && projectId && Array.isArray(candidates)) {
      for (const item of candidates) {
        const saved = await DataService.createClip(user._id, {
          projectId,
          title: item.title,
          startTime: item.startTime,
          endTime: item.endTime,
          hook: item.hook,
          caption: item.caption,
          platform: item.platform,
          reason: item.reason,
          matchedScriptSection: item.matchedScriptSection,
          status: "SUGGESTED",
        });
        savedClips.push(saved);
      }
    }

    return NextResponse.json({
      candidates,
      savedClips: savedClips.length > 0 ? savedClips : undefined,
    });
  } catch (error) {
    console.error("Clip Analysis Error:", error);
    return NextResponse.json({ error: "Failed to analyze transcript" }, { status: 500 });
  }
}
