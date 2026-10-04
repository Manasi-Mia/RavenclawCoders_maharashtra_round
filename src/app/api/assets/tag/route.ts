import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateWithFallback } from "@/lib/gemini-model";

function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

export async function POST(req: NextRequest) {
  try {
    const genAI = getGeminiClient();
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { filename, mimeType, imageData, type } = body;

    // Default intelligent fallbacks based on filename & type
    const fallbackDescription = `${type ? type.charAt(0).toUpperCase() + type.slice(1) : "Production"} asset: ${filename}`;
    const baseTags: string[] = [type || "media"];
    const ext = filename?.split(".").pop()?.toLowerCase();
    if (ext) baseTags.push(ext.toUpperCase());

    const lower = (filename || "").toLowerCase();
    if (lower.includes("intro")) baseTags.push("Intro");
    if (lower.includes("hook")) baseTags.push("Hook");
    if (lower.includes("b-roll") || lower.includes("broll")) baseTags.push("B-Roll");
    if (lower.includes("podcast")) baseTags.push("Podcast");
    if (lower.includes("interview")) baseTags.push("Interview");
    if (lower.includes("tutorial")) baseTags.push("Tutorial");
    if (lower.includes("vlog")) baseTags.push("Vlog");
    if (lower.includes("thumbnail")) baseTags.push("Thumbnail");
    if (lower.includes("screen")) baseTags.push("Screen Recording");

    if (!genAI) {
      return NextResponse.json({
        description: fallbackDescription,
        tags: Array.from(new Set(baseTags)),
      });
    }

    // If image and imageData (base64) provided, use Gemini Vision with fallback
    if (mimeType?.startsWith("image/") && imageData) {
      const cleanBase64 = imageData.replace(/^data:image\/[a-z]+;base64,/, "");
      const prompt = `You are an AI assistant for a creator workspace. Analyze this image. Return ONLY a valid JSON object matching this structure:
{
  "description": "A concise one-line description of the visual content",
  "tags": ["3 to 5 relevant tags like Thumbnail, YouTube, Minimalist, Tech, etc."]
}`;

      const result = await generateWithFallback(genAI, [
        prompt,
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType || "image/jpeg",
          },
        },
      ]);

      const text = result.response.text();
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      return NextResponse.json({
        description: parsed.description || fallbackDescription,
        tags: Array.isArray(parsed.tags) ? Array.from(new Set([...parsed.tags, ...baseTags])) : baseTags,
      });
    }

    // For video/audio/other files: use Gemini text prompt with filename & metadata
    const prompt = `A creator uploaded a file named "${filename}" of type "${type || mimeType}".
Generate a one-line creator-focused description and 3-5 relevant production tags.
Return ONLY valid JSON:
{
  "description": "one sentence description",
  "tags": ["tag1", "tag2", "tag3"]
}`;
    const result = await generateWithFallback(genAI, prompt);
    const text = result.response.text();
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);
    return NextResponse.json({
      description: parsed.description || fallbackDescription,
      tags: Array.isArray(parsed.tags) ? Array.from(new Set([...parsed.tags, ...baseTags])) : baseTags,
    });
  } catch (error) {
    console.error("Auto Tagging Error:", error);
    const msg = error instanceof Error ? error.message : "Failed to generate tags";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
