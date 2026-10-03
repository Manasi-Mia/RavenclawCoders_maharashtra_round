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
    if (!body.name || !body.type) {
      return NextResponse.json({ error: "Asset name and type are required" }, { status: 400 });
    }

    // URL can be an external storage URL, Cloudinary/S3 URL, or generated placeholder demo asset
    let url = body.url;
    if (!url) {
      switch (body.type) {
        case "video":
          url =
            "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-1728-large.mp4";
          break;
        case "audio":
          url = "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg";
          break;
        case "thumbnail":
        case "image":
          url = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";
          break;
        default:
          url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
      }
    }

    const asset = await DataService.createAsset(user._id, {
      name: body.name,
      type: body.type,
      url,
      size: body.size || Math.floor(Math.random() * 5000000) + 500000,
      tags: Array.isArray(body.tags) ? body.tags : (body.tags ? body.tags.split(",").map((t: string) => t.trim()) : []),
      projectId: body.projectId || "",
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    console.error("POST Asset Error:", error);
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
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
