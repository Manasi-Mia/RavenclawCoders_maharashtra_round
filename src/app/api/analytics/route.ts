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

    const data = await DataService.getAnalytics(user._id, projectId);

    // Compute aggregate metrics
    const totalViews = data.reduce((acc, curr) => acc + (curr.views || 0), 0);
    const totalLikes = data.reduce((acc, curr) => acc + (curr.likes || 0), 0);
    const totalComments = data.reduce((acc, curr) => acc + (curr.comments || 0), 0);
    const totalShares = data.reduce((acc, curr) => acc + (curr.shares || 0), 0);
    const avgEngagement =
      data.length > 0 ? (data.reduce((acc, curr) => acc + (curr.engagement || 0), 0) / data.length).toFixed(1) : "0.0";

    return NextResponse.json({
      records: data,
      summary: {
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        avgEngagement: Number(avgEngagement),
        postsPublished: data.length,
      },
    });
  } catch (error) {
    console.error("GET Analytics Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
