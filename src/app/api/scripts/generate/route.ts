import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateScriptVariants, ScriptAngle, BadAiResponseError } from "@/lib/gemini";
import { isQuotaError } from "@/lib/gemini-model";
import { DataService } from "@/lib/data-service";

export const maxDuration = 60;

function isModelUnavailableError(err: unknown): boolean {
  if (!err) return false;
  const status = (err as { status?: number })?.status;
  if (status === 404 || status === 503) return true;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.includes("404")) return true;
  if (msg.includes("503")) return true;
  if (msg.includes("no longer available")) return true;
  if (msg.includes("not found")) return true;
  if (msg.includes("is not supported")) return true;
  if (msg.includes("no available gemini model")) return true;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json(
        {
          error: "Your session expired. Please log in again.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid request payload.",
          code: "INVALID_REQUEST",
        },
        { status: 400 }
      );
    }

    const {
      topic,
      targetAudience,
      platform,
      tone,
      duration,
      contentType,
      projectId,
      saveToProject,
      singleVariantAngle,
      selectedVariantIndex,
    } = body;

    const trimmedTopic = typeof topic === "string" ? topic.trim() : "";
    if (!trimmedTopic) {
      return NextResponse.json(
        {
          error: "Topic is required for script generation",
          code: "TOPIC_REQUIRED",
        },
        { status: 400 }
      );
    }

    if (trimmedTopic.length > 300) {
      return NextResponse.json(
        {
          error: "Topic cannot exceed 300 characters",
          code: "TOPIC_TOO_LONG",
        },
        { status: 400 }
      );
    }

    const checkFieldLength = (val: unknown, name: string) => {
      if (typeof val === "string" && val.trim().length > 200) {
        return `${name} cannot exceed 200 characters`;
      }
      return null;
    };

    const fieldError =
      checkFieldLength(targetAudience, "Target audience") ||
      checkFieldLength(platform, "Platform") ||
      checkFieldLength(tone, "Tone") ||
      checkFieldLength(duration, "Duration") ||
      checkFieldLength(contentType, "Content type") ||
      checkFieldLength(singleVariantAngle, "Story angle");

    if (fieldError) {
      return NextResponse.json(
        {
          error: fieldError,
          code: "FIELD_TOO_LONG",
        },
        { status: 400 }
      );
    }

    const variants = await generateScriptVariants({
      topic: trimmedTopic,
      targetAudience: typeof targetAudience === "string" ? targetAudience.trim() : undefined,
      platform: typeof platform === "string" ? platform.trim() : undefined,
      tone: typeof tone === "string" ? tone.trim() : undefined,
      duration: typeof duration === "string" ? duration.trim() : undefined,
      contentType: typeof contentType === "string" ? contentType.trim() : undefined,
      creatorType: user.creatorType,
      specializations: user.specializations,
      singleVariantAngle: typeof singleVariantAngle === "string" ? (singleVariantAngle as ScriptAngle) : undefined,
    });

    let savedScript = null;
    if (saveToProject && typeof projectId === "string" && projectId && variants.length > 0) {
      const idx = typeof selectedVariantIndex === "number" && selectedVariantIndex < variants.length
        ? selectedVariantIndex
        : 0;
      const targetVariant = variants[idx];

      savedScript = await DataService.createScript(user._id, {
        projectId,
        title: targetVariant.title,
        content: targetVariant.script,
        hooks: targetVariant.hooks,
        titles: targetVariant.titles,
        captions: targetVariant.captions,
        tone: typeof tone === "string" ? tone.trim() : "Engaging",
        platform: typeof platform === "string" ? platform.trim() : "YouTube",
      });
    }

    return NextResponse.json({
      variants,
      data: variants[0],
      savedScript,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Script Generation Error:", errorMsg);

    if (
      error instanceof BadAiResponseError ||
      (error as { code?: string })?.code === "AI_BAD_RESPONSE"
    ) {
      return NextResponse.json(
        {
          error: "The AI returned an unreadable response. Please try again.",
          code: "AI_BAD_RESPONSE",
        },
        { status: 502 }
      );
    }

    if (isQuotaError(error)) {
      return NextResponse.json(
        {
          error: "Daily free AI limit reached. Please try again later or ask the team to check the API quota.",
          code: "AI_QUOTA",
        },
        { status: 429 }
      );
    }

    if (isModelUnavailableError(error)) {
      return NextResponse.json(
        {
          error: "AI model is currently unavailable. Please try again in a few moments.",
          code: "AI_MODEL_UNAVAILABLE",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: errorMsg || "Failed to generate script",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
