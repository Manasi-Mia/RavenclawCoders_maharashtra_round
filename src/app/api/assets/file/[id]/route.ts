import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Asset, AssetChunk } from "@/models";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ error: "Database not connected" }, { status: 503 });
    }

    const asset = await Asset.findOne({ _id: id, userId: user._id }).lean();
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const chunks = await AssetChunk.find({ assetId: id }).sort({ index: 1 }).lean();
    if (!chunks || chunks.length === 0) {
      return NextResponse.json({ error: "Asset data not found" }, { status: 404 });
    }

    const fullBuffer = Buffer.concat(
      chunks.map((c) => Buffer.from((c.data as unknown as { buffer: ArrayBuffer }).buffer || (c.data as unknown as Uint8Array)))
    );
    const totalSize = fullBuffer.length;
    const contentType = asset.mimeType || "application/octet-stream";

    const rangeHeader = req.headers.get("range");

    if (rangeHeader) {
      // Parse Range header e.g. "bytes=0-1024" or "bytes=1024-"
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;

        if (start >= totalSize || end >= totalSize || start > end) {
          return new Response(null, {
            status: 416,
            headers: {
              "Content-Range": `bytes */${totalSize}`,
            },
          });
        }

        const chunk = fullBuffer.subarray(start, end + 1);

        return new Response(chunk, {
          status: 206,
          headers: {
            "Content-Range": `bytes ${start}-${end}/${totalSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": String(chunk.length),
            "Content-Type": contentType,
          },
        });
      }
    }

    return new Response(fullBuffer, {
      status: 200,
      headers: {
        "Content-Length": String(totalSize),
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    console.error("Asset File Stream Error:", error);
    return NextResponse.json({ error: "Failed to stream asset file" }, { status: 500 });
  }
}
