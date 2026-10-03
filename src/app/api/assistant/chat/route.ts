import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { chatWithCreatorAssistant } from "@/lib/gemini";
import { DataService } from "@/lib/data-service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, projectId, history } = await req.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    let projectContext: Record<string, unknown> | undefined = undefined;
    if (projectId) {
      const p = await DataService.getProjectById(user._id, projectId);
      if (p) {
        projectContext = {
          title: p.title,
          platform: p.platform,
          status: p.status,
          targetAudience: p.targetAudience,
          description: p.description,
        };
      }
    }

    const reply = await chatWithCreatorAssistant(
      message,
      projectContext,
      history || [],
      { creatorType: user.creatorType, specializations: user.specializations }
    );

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Assistant Chat Error:", error);
    return NextResponse.json({ error: "Failed to communicate with AI Assistant" }, { status: 500 });
  }
}
