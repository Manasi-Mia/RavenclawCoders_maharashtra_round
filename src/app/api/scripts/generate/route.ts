import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateScriptVariants, ScriptAngle } from "@/lib/gemini";
import { DataService } from "@/lib/data-service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    } = await req.json();

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json({ error: "Topic is required for script generation" }, { status: 400 });
    }

    const variants = await generateScriptVariants({
      topic,
      targetAudience,
      platform,
      tone,
      duration,
      contentType,
      creatorType: user.creatorType,
      specializations: user.specializations,
      singleVariantAngle: singleVariantAngle as ScriptAngle | undefined,
    });

    let savedScript = null;
    if (saveToProject && projectId && variants.length > 0) {
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
        tone: tone || "Engaging",
        platform: platform || "YouTube",
      });
    }

    return NextResponse.json({
      variants,
      data: variants[0],
      savedScript,
    });
  } catch (error) {
    console.error("Script Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate script" }, { status: 500 });
  }
}
