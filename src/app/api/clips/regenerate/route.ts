import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { field, title, platform, currentText, context } = await req.json();

    if (!field || !title) {
      return NextResponse.json({ error: "Field and title are required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      // Fallback if no API key
      if (field === "hook") {
        return NextResponse.json({
          text: `Here is the one thing 99% of creators overlook about ${title}: it changes everything.`,
        });
      }
      return NextResponse.json({
        text: `Master ${title} with this exact framework. Save this clip for later! 🚀 #creator #productivity #growth`,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = "";
    if (field === "hook") {
      prompt = `You are a world-class short-form viral hook specialist for ${platform || "YouTube Shorts"}.
Write ONE magnetic, high-retention spoken opening hook for a clip titled "${title}".
Current hook: "${currentText || ""}"
Context: "${context || ""}"
Guidelines:
- 1 to 2 sentences maximum.
- Strong curiosity gap, bold statement, or pattern interrupt.
- Return ONLY the hook text without quotes or explanation.`;
    } else {
      prompt = `You are an elite social media copywriter for ${platform || "YouTube Shorts"}.
Write ONE engaging, viral caption for a clip titled "${title}".
Current caption: "${currentText || ""}"
Context: "${context || ""}"
Guidelines:
- Punchy 2-3 line body.
- Call to action.
- 3 to 5 high-converting hashtags.
- Return ONLY the caption text without meta commentary.`;
    }

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/^["']|["']$/g, "");

    return NextResponse.json({ text });
  } catch (error: unknown) {
    console.error("Clip Regenerate Error:", error);
    const msg = error instanceof Error ? error.message : "Failed to regenerate text with Gemini";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
