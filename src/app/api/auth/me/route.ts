import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isMongoConfigured } from "@/lib/mongodb";
import { isGeminiConfigured } from "@/lib/gemini";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ user: null, authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        creatorType: user.creatorType,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      system: {
        mongoConfigured: isMongoConfigured(),
        geminiConfigured: isGeminiConfigured(),
      },
    });
  } catch (error) {
    console.error("Auth Me Error:", error);
    return NextResponse.json({ error: "Failed to verify session" }, { status: 500 });
  }
}
