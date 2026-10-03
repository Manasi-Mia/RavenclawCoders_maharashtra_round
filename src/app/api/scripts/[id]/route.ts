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
    const script = await DataService.getScriptById(user._id, id);
    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    let project = null;
    if (script.projectId) {
      project = await DataService.getProjectById(user._id, script.projectId);
    }

    return NextResponse.json({ script, project });
  } catch (error) {
    console.error("GET Script Error:", error);
    return NextResponse.json({ error: "Failed to fetch script" }, { status: 500 });
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

    const updated = await DataService.updateScript(user._id, id, body);
    if (!updated) {
      return NextResponse.json({ error: "Script not found or update failed" }, { status: 404 });
    }

    return NextResponse.json({ script: updated });
  } catch (error) {
    console.error("PUT Script Error:", error);
    return NextResponse.json({ error: "Failed to update script" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const success = await DataService.deleteScript(user._id, id);
    if (!success) {
      return NextResponse.json({ error: "Script not found or delete failed" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Script deleted successfully" });
  } catch (error) {
    console.error("DELETE Script Error:", error);
    return NextResponse.json({ error: "Failed to delete script" }, { status: 500 });
  }
}
