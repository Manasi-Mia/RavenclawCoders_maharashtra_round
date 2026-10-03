import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { DataService } from "@/lib/data-service";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ideas = await DataService.getIdeas(user._id);
    return NextResponse.json({ ideas });
  } catch (error) {
    console.error("GET Ideas Error:", error);
    return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ error: "Idea title is required" }, { status: 400 });
    }

    const idea = await DataService.createIdea(user._id, {
      title: body.title,
      description: body.description || "",
      topic: body.topic || "",
      platform: body.platform || "YouTube",
      status: body.status || "IDEA",
      priority: body.priority || "MEDIUM",
      targetAudience: body.targetAudience || "",
      contentType: body.contentType || "Video",
      projectId: body.projectId || "",
    });

    return NextResponse.json({ idea }, { status: 201 });
  } catch (error) {
    console.error("POST Idea Error:", error);
    return NextResponse.json({ error: "Failed to create idea" }, { status: 500 });
  }
}
