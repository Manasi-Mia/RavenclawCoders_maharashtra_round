import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { DataService } from "@/lib/data-service";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await DataService.updateIdea(user._id, id, body);
    if (!updated) {
      return NextResponse.json({ error: "Idea not found or update failed" }, { status: 404 });
    }

    return NextResponse.json({ idea: updated });
  } catch (error) {
    console.error("PUT Idea Error:", error);
    return NextResponse.json({ error: "Failed to update idea" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const success = await DataService.deleteIdea(user._id, id);
    if (!success) {
      return NextResponse.json({ error: "Idea not found or delete failed" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Idea deleted successfully" });
  } catch (error) {
    console.error("DELETE Idea Error:", error);
    return NextResponse.json({ error: "Failed to delete idea" }, { status: 500 });
  }
}
