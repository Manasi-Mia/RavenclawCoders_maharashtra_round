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
    const assetId = searchParams.get("assetId") || undefined;

    const clips = await DataService.getClips(user._id, projectId, assetId);
    return NextResponse.json({ clips });
  } catch (error) {
    console.error("GET Clips Error:", error);
    return NextResponse.json({ error: "Failed to fetch clips" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.title || body.startTime === undefined || body.endTime === undefined) {
      return NextResponse.json({ error: "Title, startTime, and endTime are required" }, { status: 400 });
    }

    const clip = await DataService.createClip(user._id, {
      title: body.title,
      startTime: Number(body.startTime),
      endTime: Number(body.endTime),
      hook: body.hook || "",
      caption: body.caption || "",
      platform: body.platform || "YouTube Shorts",
      reason: body.reason || "",
      matchedScriptSection: body.matchedScriptSection || "",
      status: body.status || "SUGGESTED",
      projectId: body.projectId || "",
      assetId: body.assetId || "",
      confidence: body.confidence !== undefined ? Number(body.confidence) : 0.9,
      origin: body.origin || "user",
    });

    return NextResponse.json({ clip }, { status: 201 });
  } catch (error) {
    console.error("POST Clip Error:", error);
    return NextResponse.json({ error: "Failed to create clip" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Clip ID is required" }, { status: 400 });
    }

    const updated = await DataService.updateClip(user._id, body.id, body);
    if (!updated) {
      return NextResponse.json({ error: "Clip not found or update failed" }, { status: 404 });
    }

    return NextResponse.json({ clip: updated });
  } catch (error) {
    console.error("PUT Clip Error:", error);
    return NextResponse.json({ error: "Failed to update clip" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clipId = searchParams.get("id");
    if (!clipId) {
      return NextResponse.json({ error: "Clip ID is required" }, { status: 400 });
    }

    const success = await DataService.deleteClip(user._id, clipId);
    if (!success) {
      return NextResponse.json({ error: "Clip not found or delete failed" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Clip deleted" });
  } catch (error) {
    console.error("DELETE Clip Error:", error);
    return NextResponse.json({ error: "Failed to delete clip" }, { status: 500 });
  }
}
