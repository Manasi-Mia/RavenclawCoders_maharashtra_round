import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { DataService } from "@/lib/data-service";
import { analyzeContentPerformance } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await req.json().catch(() => ({}));
    const analyticsData = await DataService.getAnalytics(user._id, projectId);

    const report = await analyzeContentPerformance({
      analyticsData: analyticsData.map((d) => ({
        platform: d.platform,
        views: d.views,
        engagement: d.engagement,
        shares: d.shares,
      })),
      creatorType: user.creatorType,
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Analytics Insights Error:", error);
    return NextResponse.json({ error: "Failed to generate creator intelligence report" }, { status: 500 });
  }
}
