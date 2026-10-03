import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { DataService } from "@/lib/data-service";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await DataService.getProjects(user._id);
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("GET Projects Error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
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
      return NextResponse.json({ error: "Project title is required" }, { status: 400 });
    }

    const project = await DataService.createProject(user._id, {
      title: body.title,
      description: body.description || "",
      platform: body.platform || "YouTube",
      status: body.status || "IDEA",
      thumbnail: body.thumbnail || "",
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      progress: body.progress ?? 10,
      targetAudience: body.targetAudience || "",
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("POST Project Error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
