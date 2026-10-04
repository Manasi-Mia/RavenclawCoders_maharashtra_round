import Link from "next/link";
import { ArrowLeft, ArrowRight, BarChart3, CalendarDays, CheckCircle2, Lightbulb, LockKeyhole, Share2, Sparkles, Video, Wand2 } from "lucide-react";

type Guide = { title: string; icon: typeof Lightbulb; intro: string; steps: { title: string; text: string }[]; tip: string };

const guides: Record<string, Guide> = {
  "idea-to-action": { title: "Idea → Action", icon: Lightbulb, intro: "Use this tool when you have an idea and want to turn it into a clear project.", steps: [
    { title: "1. Start with an idea", text: "Open the Idea area and write your topic in simple words. Do not worry about making it perfect." },
    { title: "2. Add the goal", text: "Describe what you want the content to achieve: educate, entertain, explain, promote or build awareness." },
    { title: "3. Add context", text: "Enter useful details such as your audience, platform, tone and any important points you want included." },
    { title: "4. Turn it into a project", text: "Create the project so the idea becomes part of your connected workflow and can move through the next stages." },
    { title: "5. Continue to Script Studio", text: "Once the idea is ready, move to Script Studio to develop the hook, script and supporting copy." },
  ], tip: "Begin with one clear idea. You can improve the details later." },
  "script-studio": { title: "Script Studio", icon: Wand2, intro: "Create a usable hook, script, title and caption without starting from a blank page.", steps: [
    { title: "1. Select your project", text: "Open the project you want to write for. Keeping the script connected to the project preserves the original context." },
    { title: "2. Choose your content goal", text: "Tell the tool whether the content should educate, entertain, explain, persuade or promote." },
    { title: "3. Describe your audience", text: "Add who the content is for and how familiar they are with the topic." },
    { title: "4. Generate a hook", text: "Ask for several opening options. Pick the one that gives viewers a clear reason to keep watching." },
    { title: "5. Generate and edit the script", text: "Create the script, read it once, remove anything unnecessary and adjust wording so it sounds like you." },
    { title: "6. Create title and caption", text: "Generate platform-appropriate title and caption options, then select and edit the strongest version." },
  ], tip: "AI gives you a starting point. Always review the final script before publishing." },
  "video-intelligence": { title: "Video Intelligence", icon: Video, intro: "Find useful moments in a long video and turn them into potential clips.", steps: [
    { title: "1. Add your video", text: "Open Video Intelligence and select the source video you want to analyse." },
    { title: "2. Wait for the analysis", text: "The system reviews the available transcript or video information to identify meaningful moments." },
    { title: "3. Review suggested moments", text: "Look through the suggested timestamps and read the accompanying hook or reason for each suggestion." },
    { title: "4. Check the boundaries", text: "Play the beginning and end of each suggested clip. Make sure the clip starts naturally and finishes with a complete thought." },
    { title: "5. Select your best clips", text: "Keep the moments that work independently and make sense to someone who has not watched the full video." },
    { title: "6. Move to Repurpose", text: "Send your strongest clip into Repurpose to prepare versions for different platforms." },
  ], tip: "Do not choose a clip only because it is interesting. Choose moments that make sense without the full video." },
  "repurpose": { title: "Repurpose", icon: Share2, intro: "Turn one source into versions designed for different platforms.", steps: [
    { title: "1. Choose the source", text: "Select a finished script, clip or content item that you want to reuse." },
    { title: "2. Choose the target platforms", text: "Select where you want to publish, such as YouTube, Instagram, LinkedIn or X." },
    { title: "3. Generate platform versions", text: "Ask the tool to adapt the content for each platform instead of copying the same text everywhere." },
    { title: "4. Review each version", text: "Check the length, tone, opening and call to action for the selected platform." },
    { title: "5. Edit and approve", text: "Make your own changes and keep only the versions that match your voice and goal." },
    { title: "6. Send to publishing", text: "Move approved versions into your workflow and calendar so they are ready to schedule." },
  ], tip: "Repurposing means adapting, not simply duplicating. Each platform should feel native." },
  "workflow-calendar": { title: "Workflow + Calendar", icon: CalendarDays, intro: "Use the production pipeline and calendar to know what needs to happen next.", steps: [
    { title: "1. Create or open a project", text: "Start with an idea or existing project so all production stages stay connected." },
    { title: "2. Move through the stages", text: "Progress from idea to script, assets, footage, clips, edit, repurpose and publish." },
    { title: "3. Set the next action", text: "For every project, identify the one task that should happen next instead of trying to finish everything at once." },
    { title: "4. Add a publishing date", text: "Open the calendar and choose a realistic date and time for the approved content." },
    { title: "5. Check your schedule", text: "Review upcoming items so you can avoid missed deadlines and overloaded publishing days." },
  ], tip: "Keep one clear next action for every project. A simple pipeline is easier to maintain than a crowded one." },
  "creator-intelligence": { title: "Creator Intelligence", icon: BarChart3, intro: "Use performance data to understand what worked and decide what to create next.", steps: [
    { title: "1. Open analytics", text: "Go to Creator Intelligence after you have published content and enough data is available." },
    { title: "2. Review the main metrics", text: "Look at useful signals such as views, engagement, retention or other metrics available for your content." },
    { title: "3. Compare content", text: "Find patterns between stronger and weaker pieces rather than judging one post in isolation." },
    { title: "4. Identify a pattern", text: "Ask what topic, hook, format, length or platform appears to be working better." },
    { title: "5. Choose the next experiment", text: "Turn the insight into one practical action, such as testing a different hook or making another version of a strong topic." },
  ], tip: "Analytics are useful when they change your next decision. Do not collect numbers without acting on them." },
  "secure-workspace": { title: "Secure Workspace", icon: LockKeyhole, intro: "Keep your creative work organised inside a user-scoped workspace.", steps: [
    { title: "1. Sign in to your account", text: "Use your account to access your own workspace rather than treating the app as a shared anonymous space." },
    { title: "2. Keep drafts inside projects", text: "Store ideas, scripts and work-in-progress items in the appropriate project." },
    { title: "3. Keep assets connected", text: "Associate uploaded or generated assets with the correct project so they are easy to find later." },
    { title: "4. Review before sharing", text: "Check that private drafts and unfinished content are not being exposed through public links or shared screens." },
    { title: "5. Protect credentials", text: "Never put API keys or passwords into public text, screenshots or source code committed to the repository." },
  ], tip: "Security is part of the workflow: protect credentials and keep private work inside the correct account." },
  "ai-next-step": { title: "Know What To Do Next", icon: Sparkles, intro: "Turn your content history into a small number of practical actions.", steps: [
    { title: "1. Build your content history", text: "Create projects and publish content through the connected workflow so useful context accumulates." },
    { title: "2. Open Creator Intelligence", text: "Review what has performed well and what patterns appear in your content data." },
    { title: "3. Read the suggested action", text: "Use the AI recommendation as a proposed next move, not as an unquestionable answer." },
    { title: "4. Check the reasoning", text: "Make sure the recommendation fits your actual goal, audience and current production capacity." },
    { title: "5. Execute one action", text: "Choose one recommendation and turn it into a project, script, clip, repurpose task or publishing task." },
    { title: "6. Measure the result", text: "After publishing, return to analytics and see whether the action improved the outcome." },
  ], tip: "The best AI workflow is a loop: insight → action → result → new insight." },
};

export default async function ManualDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = guides[slug];
  if (!guide) return <main className="min-h-screen bg-[#e8e6e1] p-8"><h1 className="text-3xl font-black">Guide not found</h1><Link href="/manual" className="mt-4 inline-block underline">Back to manual</Link></main>;
  const Icon = guide.icon;
  return (
    <main className="min-h-screen bg-[#e8e6e1] px-4 py-10 text-[#101114] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/manual" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#66686c] hover:text-black"><ArrowLeft className="h-4 w-4" />Manual</Link>
          <Link href="/" className="text-xs font-bold uppercase tracking-[0.16em] text-[#66686c] hover:text-black">Home</Link>
        </div>
        <header className="mt-14 rounded-[34px] bg-[#121315] p-7 text-white shadow-[0_30px_80px_rgba(0,0,0,0.16)] sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10"><Icon className="h-6 w-6" /></div>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">Manual for Beginners</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl">{guide.title}</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">{guide.intro}</p>
        </header>
        <section className="mt-6 space-y-4">
          {guide.steps.map((step) => (
            <article key={step.title} className="rounded-[28px] border border-black/10 bg-white/65 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:p-8">
              <div className="flex items-start gap-4"><div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white"><CheckCircle2 className="h-4 w-4" /></div><div><h2 className="text-xl font-bold tracking-tight">{step.title}</h2><p className="mt-2 text-sm leading-7 text-[#66686c]">{step.text}</p></div></div>
            </article>
          ))}
        </section>
        <aside className="mt-6 rounded-[28px] border border-black/10 bg-white/60 p-6 sm:p-8"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#77797c]">Beginner tip</p><p className="mt-3 text-base font-semibold leading-7">{guide.tip}</p></aside>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between"><Link href="/manual" className="inline-flex items-center justify-center gap-2 rounded-full border border-black/15 bg-white/60 px-5 py-3 text-sm font-semibold">← All guides</Link><Link href="/" className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">Back to CreatorAI <ArrowRight className="h-4 w-4" /></Link></div>
      </div>
    </main>
  );
}
