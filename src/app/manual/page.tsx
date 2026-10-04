import Link from "next/link";
import { ArrowRight, BarChart3, CalendarDays, Lightbulb, LockKeyhole, Share2, Sparkles, Video, Wand2 } from "lucide-react";

const guides = [
  { slug: "idea-to-action", title: "Idea → Action", description: "Turn a rough idea into an organised project.", icon: Lightbulb },
  { slug: "script-studio", title: "Script Studio", description: "Create hooks, scripts, titles and captions.", icon: Wand2 },
  { slug: "video-intelligence", title: "Video Intelligence", description: "Find the strongest moments in a video.", icon: Video },
  { slug: "repurpose", title: "Repurpose", description: "Turn one piece of content into platform-ready versions.", icon: Share2 },
  { slug: "workflow-calendar", title: "Workflow + Calendar", description: "Plan your production and publishing schedule.", icon: CalendarDays },
  { slug: "creator-intelligence", title: "Creator Intelligence", description: "Use your content data to decide what to do next.", icon: BarChart3 },
  { slug: "secure-workspace", title: "Secure Workspace", description: "Understand drafts, assets and user-scoped workspace data.", icon: LockKeyhole },
  { slug: "ai-next-step", title: "AI Next Step", description: "Turn content history into practical next actions.", icon: Sparkles },
];

export default function ManualPage() {
  return (
    <main className="min-h-screen bg-[#e8e6e1] px-4 py-12 text-[#101114] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-xs font-bold uppercase tracking-[0.18em] text-[#66686c] hover:text-black">← Back to home</Link>
        <div className="mt-12 max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#77797c]">Beginner friendly</p>
          <h1 className="mt-3 text-5xl font-black tracking-[-0.05em] sm:text-7xl">Manual for Beginners</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#66686c]">Choose a feature and follow the guide one step at a time. No prior CreatorAI experience is required.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {guides.map(({ slug, title, description, icon: Icon }) => (
            <Link key={slug} href={`/manual/${slug}`} className="group rounded-[28px] border border-black/10 bg-white/60 p-6 shadow-[0_20px_55px_rgba(0,0,0,0.07)] transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_28px_70px_rgba(0,0,0,0.12)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white"><Icon className="h-5 w-5" /></div>
              <h2 className="mt-5 text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#66686c]">{description}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]">Open guide <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
