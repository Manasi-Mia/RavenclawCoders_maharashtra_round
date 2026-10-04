import { IAsset } from "@/models";

export interface UploadOptions {
  filename?: string;
  mimeType?: string;
  projectId?: string;
  thumbnail?: string;
  description?: string;
  tags?: string[] | string;
  durationSeconds?: number;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

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

/**
 * Normalizes MIME type, stripping codec parameters and resolving common extensions.
 * e.g., "video/webm;codecs=vp9" -> "video/webm"
 */
export function normalizeMimeType(rawMimeType?: string, filename?: string): string {
  const cleaned = (rawMimeType || "").split(";")[0].trim().toLowerCase();

  if (ALLOWED_MIME_TYPES.has(cleaned)) {
    return cleaned;
  }

  if (cleaned === "video/x-matroska" || cleaned === "video/mkv") {
    return "video/webm";
  }

  if (filename) {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "mp4":
      case "m4v":
        return "video/mp4";
      case "webm":
        return "video/webm";
      case "mov":
        return "video/quicktime";
      case "png":
        return "image/png";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "webp":
        return "image/webp";
      case "gif":
        return "image/gif";
      case "mp3":
        return "audio/mpeg";
      case "wav":
        return "audio/wav";
      case "ogg":
        return "audio/ogg";
      case "pdf":
        return "application/pdf";
    }
  }

  return cleaned || "video/webm";
}

/**
 * Robust chunked client uploader for browser environments.
 * Follows the 3-step contract: init -> chunk (multipart) -> complete (json)
 * Chunks at 2 MB with a 1-time retry per chunk.
 */
export async function uploadInChunks(
  fileOrBlob: File | Blob,
  options: UploadOptions = {}
): Promise<IAsset> {
  const { onProgress, signal } = options;

  if (signal?.aborted) {
    throw new DOMException("Upload aborted", "AbortError");
  }

  if (fileOrBlob.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds 100 MB limit (${Math.round(fileOrBlob.size / (1024 * 1024))} MB)`
    );
  }

  const filename =
    options.filename ||
    (fileOrBlob instanceof File && fileOrBlob.name) ||
    `upload_${Date.now()}.webm`;

  const mimeType = normalizeMimeType(
    options.mimeType || fileOrBlob.type,
    filename
  );

  // 1. Init
  onProgress?.(2);
  const initRes = await fetch("/api/assets/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "init",
      filename,
      mimeType,
      size: fileOrBlob.size,
    }),
    signal,
  });

  const initData = await initRes.json();
  if (!initRes.ok || !initData.uploadId) {
    throw new Error(initData.error || "Failed to initialize chunked upload");
  }

  const uploadId: string = initData.uploadId;
  const totalChunks = Math.max(1, Math.ceil(fileOrBlob.size / CHUNK_SIZE));

  // 2. Chunks (FormData with retry)
  for (let i = 0; i < totalChunks; i++) {
    if (signal?.aborted) {
      throw new DOMException("Upload aborted", "AbortError");
    }

    const start = i * CHUNK_SIZE;
    const end = Math.min(fileOrBlob.size, start + CHUNK_SIZE);
    const chunkBlob = fileOrBlob.slice(start, end);

    const sendChunk = async () => {
      const formData = new FormData();
      formData.append("action", "chunk");
      formData.append("uploadId", uploadId);
      formData.append("index", String(i));
      formData.append("chunk", chunkBlob, `chunk-${i}`);

      const chunkRes = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData,
        signal,
      });

      if (!chunkRes.ok) {
        let errMessage = `Chunk ${i + 1}/${totalChunks} upload failed`;
        try {
          const errData = await chunkRes.json();
          if (errData.error) errMessage = errData.error;
        } catch {
          // fallback
        }
        throw new Error(errMessage);
      }
    };

    try {
      await sendChunk();
    } catch (err) {
      if (signal?.aborted) throw err;
      // Retry once per contract
      await sendChunk();
    }

    const pct = Math.round(5 + ((i + 1) / totalChunks) * 85);
    onProgress?.(pct);
  }

  // 3. Complete
  if (signal?.aborted) {
    throw new DOMException("Upload aborted", "AbortError");
  }

  const completeRes = await fetch("/api/assets/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "complete",
      uploadId,
      filename,
      mimeType,
      size: fileOrBlob.size,
      projectId: options.projectId || undefined,
      thumbnail: options.thumbnail || undefined,
      description: options.description || undefined,
      tags: options.tags || undefined,
      durationSeconds: options.durationSeconds || undefined,
    }),
    signal,
  });

  const completeData = await completeRes.json();
  if (!completeRes.ok || !completeData.asset) {
    throw new Error(completeData.error || "Failed to finalize asset creation");
  }

  onProgress?.(100);
  return completeData.asset as IAsset;
}
