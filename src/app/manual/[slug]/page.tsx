import { redirect } from "next/navigation";

const destinations: Record<string, string> = {
  "idea-to-action": "/dashboard/ideas",
  "script-studio": "/dashboard/scripts",
  "assets": "/dashboard/assets",
  "video-intelligence": "/dashboard/video-intelligence",
  "clips": "/dashboard/video-intelligence",
  "edit": "/dashboard/studio",
  "repurpose": "/dashboard/repurpose",
  "publish": "/dashboard/calendar",
  "analytics": "/dashboard/analytics",
  "creator-intelligence": "/dashboard/analytics",
  "workflow-calendar": "/dashboard/workflow",
  "secure-workspace": "/dashboard/settings",
  "ai-next-step": "/dashboard/analytics",
};

export default async function ManualDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(destinations[slug] ?? "/dashboard/workflow");
}
