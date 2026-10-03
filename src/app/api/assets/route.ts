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

    const assets = await DataService.getAssets(user._id, projectId);
    return NextResponse.json({ assets });
  } catch (error) {
    console.error("GET Assets Error:", error);
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.name || !body.type || !body.url) {
      return NextResponse.json(
        { error: "Asset name, type, and url are required" },
        { status: 400 }
      );
    }

    const asset = await DataService.createAsset(user._id, {
      name: body.name,
      type: body.type,
      url: body.url,
      size: typeof body.size === "number" ? body.size : 0,
      mimeType: body.mimeType || "",
      durationSeconds: body.durationSeconds || undefined,
      thumbnail: body.thumbnail || "",
      description: body.description || "",
      tags: Array.isArray(body.tags)
        ? body.tags
        : typeof body.tags === "string"
        ? body.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [],
      projectId: body.projectId || "",
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    console.error("POST Asset Error:", error);
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
    }

    const asset = await DataService.updateAsset(user._id, id, updates);
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, asset });
  } catch (error) {
    console.error("PUT Asset Error:", error);
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get("id");
    if (!assetId) {
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
    }

    const success = await DataService.deleteAsset(user._id, assetId);
    if (!success) {
      return NextResponse.json({ error: "Asset not found or delete failed" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Asset deleted" });
  } catch (error) {
    console.error("DELETE Asset Error:", error);
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
  }
}
