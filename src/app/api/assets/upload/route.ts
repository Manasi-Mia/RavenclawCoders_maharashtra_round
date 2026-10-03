import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Asset, AssetChunk } from "@/models";
import mongoose from "mongoose";

const ALLOWED_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/webm",
  "audio/ogg",
  "application/pdf",
]);

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

function getAssetType(mimeType: string): "video" | "image" | "audio" | "document" {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document";
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { error: "Uploads need the database connection" },
        { status: 400 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    // 1. Handle multipart form-data (for chunk uploads)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const action = formData.get("action") as string;
      const uploadId = formData.get("uploadId") as string;
      const indexStr = formData.get("index") as string;
      const chunkFile = formData.get("chunk") as File | Blob | null;

      if (action !== "chunk" || !uploadId || indexStr === null || !chunkFile) {
        return NextResponse.json(
          { error: "Invalid chunk upload payload" },
          { status: 400 }
        );
      }

      const index = parseInt(indexStr, 10);
      const arrayBuffer = await chunkFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await AssetChunk.findOneAndUpdate(
        { assetId: uploadId, index },
        { assetId: uploadId, index, data: buffer, createdAt: new Date() },
        { upsert: true, new: true }
      );

      return NextResponse.json({ success: true, index });
    }

    // 2. Handle JSON actions: "init", "chunk", "complete"
    const body = await req.json();
    const { action } = body;

    if (action === "init") {
      const { filename, mimeType, size } = body;

      if (!filename || !mimeType) {
        return NextResponse.json({ error: "Filename and mimeType are required" }, { status: 400 });
      }

      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        return NextResponse.json(
          {
            error: `File type "${mimeType}" is not supported. Allowed formats: MP4, WebM, MOV, PNG, JPG, WebP, GIF, MP3, WAV, OGG, PDF.`,
          },
          { status: 400 }
        );
      }

      if (size && size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File size exceeds the 100 MB limit (${Math.round(size / 1024 / 1024)} MB).` },
          { status: 400 }
        );
      }

      const uploadId = new mongoose.Types.ObjectId().toString();
      return NextResponse.json({ uploadId });
    }

    if (action === "chunk") {
      const { uploadId, index, data } = body;
      if (!uploadId || typeof index !== "number" || !data) {
        return NextResponse.json({ error: "uploadId, index, and data are required" }, { status: 400 });
      }

      const buffer = Buffer.from(data, "base64");
      await AssetChunk.findOneAndUpdate(
        { assetId: uploadId, index },
        { assetId: uploadId, index, data: buffer, createdAt: new Date() },
        { upsert: true, new: true }
      );

      return NextResponse.json({ success: true, index });
    }

    if (action === "complete") {
      const {
        uploadId,
        filename,
        mimeType,
        size,
        projectId,
        thumbnail,
        description,
        tags,
        durationSeconds,
      } = body;

      if (!uploadId || !filename || !mimeType) {
        return NextResponse.json({ error: "Missing required complete parameters" }, { status: 400 });
      }

      const chunkCount = await AssetChunk.countDocuments({ assetId: uploadId });
      if (chunkCount === 0) {
        return NextResponse.json({ error: "No uploaded chunks found for this file" }, { status: 400 });
      }

      const type = getAssetType(mimeType);
      const parsedTags = Array.isArray(tags)
        ? tags
        : typeof tags === "string"
        ? tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [];

      const asset = await Asset.create({
        _id: uploadId,
        userId: user._id,
        projectId: projectId || "",
        name: filename,
        type,
        url: `/api/assets/file/${uploadId}`,
        size: size || 0,
        mimeType,
        durationSeconds: durationSeconds || undefined,
        thumbnail: thumbnail || "",
        description: description || "",
        tags: parsedTags,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return NextResponse.json({ success: true, asset });
    }

    return NextResponse.json({ error: `Unknown action "${action}"` }, { status: 400 });
  } catch (error) {
    console.error("Asset Upload Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process upload" },
      { status: 500 }
    );
  }
}
