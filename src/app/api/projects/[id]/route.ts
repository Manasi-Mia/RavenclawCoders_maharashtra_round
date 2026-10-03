import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { DataService } from "@/lib/data-service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const project = await DataService.getProjectById(user._id, id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Also gather connected project elements for project-centric workflow
    const [scripts, assets, clips, repurposed, analytics] = await Promise.all([
      DataService.getScripts(user._id, id),
      DataService.getAssets(user._id, id),
      DataService.getClips(user._id, id),
      DataService.getRepurposed(user._id, id),
      DataService.getAnalytics(user._id, id),
    ]);

    return NextResponse.json({
      project,
      scripts,
      assets,
      clips,
      repurposed,
      analytics,
    });
  } catch (error) {
    console.error("GET Project by ID Error:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await DataService.updateProject(user._id, id, body);
    if (!updated) {
      return NextResponse.json({ error: "Project not found or update failed" }, { status: 404 });
    }

    return NextResponse.json({ project: updated });
  } catch (error) {
    console.error("PUT Project Error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const success = await DataService.deleteProject(user._id, id);
    if (!success) {
      return NextResponse.json({ error: "Project not found or delete failed" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error("DELETE Project Error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
