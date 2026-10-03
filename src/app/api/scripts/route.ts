import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { DataService } from "@/lib/data-service";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || undefined;

    const scripts = await DataService.getScripts(user._id, projectId);
    return NextResponse.json({ scripts });
  } catch (error) {
    console.error("GET Scripts Error:", error);
    return NextResponse.json({ error: "Failed to fetch scripts" }, { status: 500 });
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
      return NextResponse.json({ error: "Script title is required" }, { status: 400 });
    }

    const script = await DataService.createScript(user._id, {
      title: body.title,
      content: body.content || "",
      projectId: body.projectId || "",
      platform: body.platform || "YouTube",
      tone: body.tone || "Engaging",
      hooks: body.hooks || [],
      titles: body.titles || [],
      captions: body.captions || [],
    });

    return NextResponse.json({ script }, { status: 201 });
  } catch (error) {
    console.error("POST Script Error:", error);
    return NextResponse.json({ error: "Failed to create script" }, { status: 500 });
  }
}
