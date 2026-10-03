import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateIdeas } from "@/lib/gemini";
import { DataService } from "@/lib/data-service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topic, targetAudience, platform, contentStyle, autoSave } = await req.json();

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json({ error: "Topic is required for idea generation" }, { status: 400 });
    }

    const generated = await generateIdeas({
      topic,
      targetAudience,
      platform,
      contentStyle,
      creatorType: user.creatorType,
      specializations: user.specializations,
    });

    // If autoSave requested, save directly to user's idea list
    const savedIdeas = [];
    if (autoSave && Array.isArray(generated)) {
      for (const item of generated) {
        const saved = await DataService.createIdea(user._id, {
          title: item.title,
          description: item.description,
          topic: item.topic,
          platform: item.platform,
          status: "IDEA",
          priority: item.priority,
          targetAudience: item.targetAudience,
          contentType: item.contentType,
        });
        savedIdeas.push(saved);
      }
    }

    return NextResponse.json({
      ideas: generated,
      savedIdeas: savedIdeas.length > 0 ? savedIdeas : undefined,
    });
  } catch (error) {
    console.error("AI Idea Gen Error:", error);
    return NextResponse.json({ error: "Failed to generate ideas" }, { status: 500 });
  }
}
