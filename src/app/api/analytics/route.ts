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

    const [data, pipeline] = await Promise.all([
      DataService.getAnalytics(user._id, projectId),
      DataService.getContentPipelineStats(user._id),
    ]);

    // Compute honest aggregate metrics strictly from stored data
    const totalViews = data.reduce((acc, curr) => acc + (Number(curr.views) || 0), 0);
    const totalLikes = data.reduce((acc, curr) => acc + (Number(curr.likes) || 0), 0);
    const totalComments = data.reduce((acc, curr) => acc + (Number(curr.comments) || 0), 0);
    const totalShares = data.reduce((acc, curr) => acc + (Number(curr.shares) || 0), 0);
    const avgEngagement =
      totalViews > 0
        ? Number((((totalLikes + totalComments + totalShares) / totalViews) * 100).toFixed(1))
        : 0;

    // Compute real platform breakdown from stored records
    const platformMap: Record<
      string,
      { platform: string; views: number; likes: number; comments: number; shares: number; count: number }
    > = {};

    data.forEach((r) => {
      const plat = r.platform || "Other";
      if (!platformMap[plat]) {
        platformMap[plat] = { platform: plat, views: 0, likes: 0, comments: 0, shares: 0, count: 0 };
      }
      platformMap[plat].views += Number(r.views) || 0;
      platformMap[plat].likes += Number(r.likes) || 0;
      platformMap[plat].comments += Number(r.comments) || 0;
      platformMap[plat].shares += Number(r.shares) || 0;
      platformMap[plat].count += 1;
    });

    const platformBreakdown = Object.values(platformMap).map((p) => ({
      ...p,
      percentage: totalViews > 0 ? Math.round((p.views / totalViews) * 100) : 0,
      engagement:
        p.views > 0 ? Number((((p.likes + p.comments + p.shares) / p.views) * 100).toFixed(1)) : 0,
    }));

    return NextResponse.json({
      records: data,
      summary: {
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        avgEngagement,
        postsPublished: data.length,
      },
      pipeline,
      platformBreakdown,
    });
  } catch (error) {
    console.error("GET Analytics Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Mode 1: Bulk CSV Import
    if (body.action === "import" && Array.isArray(body.records)) {
      const created = [];
      for (const rec of body.records) {
        if (!rec.platform) continue;
        const item = await DataService.createAnalytics(user._id, {
          platform: rec.platform,
          projectId: rec.projectId || "",
          views: Number(rec.views) || 0,
          likes: Number(rec.likes) || 0,
          comments: Number(rec.comments) || 0,
          shares: Number(rec.shares) || 0,
          date: rec.date ? new Date(rec.date) : new Date(),
        });
        created.push(item);
      }
      return NextResponse.json({ success: true, count: created.length }, { status: 201 });
    }

    // Mode 2: Single post log
    const { platform, projectId, views, likes, comments, shares, date } = body;
    if (!platform) {
      return NextResponse.json({ error: "Platform is required" }, { status: 400 });
    }

    const item = await DataService.createAnalytics(user._id, {
      platform,
      projectId: projectId || "",
      views: Number(views) || 0,
      likes: Number(likes) || 0,
      comments: Number(comments) || 0,
      shares: Number(shares) || 0,
      date: date ? new Date(date) : new Date(),
    });

    return NextResponse.json({ success: true, record: item }, { status: 201 });
  } catch (error) {
    console.error("POST Analytics Error:", error);
    return NextResponse.json({ error: "Failed to save analytics record" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
    }

    const success = await DataService.deleteAnalytics(user._id, id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("DELETE Analytics Error:", error);
    return NextResponse.json({ error: "Failed to delete analytics record" }, { status: 500 });
  }
}
