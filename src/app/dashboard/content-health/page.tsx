"use client";

import { useMemo, useState } from "react";
import { Activity, Eye, Gauge, Lightbulb, MessageCircle, Search, Share2, Sparkles, Target, TrendingUp } from "lucide-react";

type Platform = "YouTube" | "Instagram" | "TikTok" | "LinkedIn";

const benchmarks: Record<Platform, number> = {
  YouTube: 20000,
  Instagram: 10000,
  TikTok: 15000,
  LinkedIn: 5000,
};

const demoPosts = [
  {
    title: "I stopped posting every day. My reach improved.",
    platform: "Instagram" as Platform,
    views: 28400,
    content: "Posting more is not the same as creating more value. I tested fewer posts with stronger hooks, one clear lesson, and a direct CTA. The result: higher reach with less content fatigue."
  },
  {
    title: "3 mistakes creators make with AI",
    platform: "YouTube" as Platform,
    views: 41200,
    content: "Most creators use AI to generate more content. The smarter move is to use it to improve the content you already know your audience wants. Here are three practical mistakes to avoid."
  },
];

function scoreContent(content: string, views: number, platform: Platform) {
  const text = content.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const sentences = text ? (text.match(/[.!?]+/g) || []).length : 0;
  const hasHook = /^(most|why|how|stop|i |you |the |3 |5 |7 |what if|here's|this )/i.test(text);
  const hasNumber = /\b\d+\b/.test(text);
  const hasAction = /\b(try|start|use|avoid|learn|comment|follow|save|share|click|build|stop|test)\b/i.test(text);
  const hasSpecificity = words >= 35 && sentences >= 2;
  const readability = words >= 25 && words <= 180 && sentences >= 2;

  const hook = hasHook ? 14 : 8;
  const value = Math.min(16, 8 + (hasSpecificity ? 5 : 2) + (hasNumber ? 3 : 0));
  const clarity = readability ? 14 : 9;
  const action = hasAction ? 10 : 5;
  const originality = hasNumber || /tested|result|mistake|lesson|example|before|after/i.test(text) ? 6 : 3;
  const contentScore = Math.min(60, hook + value + clarity + action + originality);

  const benchmark = benchmarks[platform];
  const ratio = benchmark > 0 ? views / benchmark : 0;
  const performanceScore = Math.round(Math.min(40, Math.max(0, 40 * (Math.log10(Math.max(1, ratio)) + 0.7)) / 1.7));
  const total = Math.min(100, contentScore + performanceScore);

  return {
    total,
    contentScore,
    performanceScore,
    benchmark,
    ratio,
    breakdown: { hook, value, clarity, action, originality },
    words,
    insights: [
      hasHook ? "The opening creates a clear reason to keep reading." : "Strengthen the first sentence with a sharper hook or tension point.",
      hasSpecificity ? "The content contains enough detail to feel useful rather than generic." : "Add a concrete example, number, result, or specific takeaway.",
      hasAction ? "There is a natural next action for the audience." : "Add one focused CTA instead of ending without direction.",
      ratio >= 1.5 ? `Views are ${ratio.toFixed(1)}× the ${platform} benchmark — strong distribution signal.` : ratio >= 0.8 ? "Views are around the current benchmark; content quality is the main optimization lever." : "Views are below the benchmark; improve the hook and packaging before scaling distribution."
    ]
  };
}

export default function ContentHealthPage() {
  const [content, setContent] = useState(demoPosts[0].content);
  const [views, setViews] = useState(String(demoPosts[0].views));
  const [platform, setPlatform] = useState<Platform>(demoPosts[0].platform);
  const [analyzed, setAnalyzed] = useState(true);

  const result = useMemo(() => scoreContent(content, Number(views) || 0, platform), [content, views, platform]);
  const status = result.total >= 80 ? "Excellent" : result.total >= 65 ? "Healthy" : result.total >= 50 ? "Needs work" : "At risk";

  const loadDemo = (post: typeof demoPosts[number]) => {
    setContent(post.content);
    setViews(String(post.views));
    setPlatform(post.platform);
    setAnalyzed(true);
  };

  return (
    <div className="space-y-7">
      <div className="border-b border-black/10 pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#77797c]"><Activity className="h-3.5 w-3.5" /> Creator Intelligence</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#111214] sm:text-3xl">Content Health Score</h1>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#66686c]">A practical 0–100 diagnostic that judges the content itself and its view performance. It is a transparent benchmark model — not a fabricated platform metric.</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-[10px] text-[#66686c] shadow-sm"><span className="font-bold text-[#111214]">Model:</span> Content 60% + Views 40%</div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <section className="glass-card rounded-3xl border border-black/10 bg-white/65 p-5 shadow-sm backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex items-center gap-2"><Search className="h-4 w-4 text-[#111214]" /><h2 className="text-sm font-bold text-[#111214]">Analyze a piece of content</h2></div>
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#77797c]">Content / caption / script excerpt</label>
          <textarea value={content} onChange={(e) => { setContent(e.target.value); setAnalyzed(false); }} className="min-h-[190px] w-full resize-y rounded-2xl border border-black/10 bg-white/70 p-4 text-sm leading-6 text-[#111214] outline-none focus:border-black/30" placeholder="Paste the content you want to judge..." />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#77797c]">Platform</label><select value={platform} onChange={(e) => { setPlatform(e.target.value as Platform); setAnalyzed(false); }} className="w-full rounded-2xl border border-black/10 bg-white/70 px-3 py-3 text-xs font-semibold text-[#111214] outline-none"><option>YouTube</option><option>Instagram</option><option>TikTok</option><option>LinkedIn</option></select></div>
            <div><label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#77797c]">Views</label><input type="number" min="0" value={views} onChange={(e) => { setViews(e.target.value); setAnalyzed(false); }} className="w-full rounded-2xl border border-black/10 bg-white/70 px-3 py-3 text-xs font-semibold text-[#111214] outline-none" /></div>
          </div>
          <button onClick={() => setAnalyzed(true)} className="creator-btn-primary mt-4 inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-xs sm:w-auto"><Sparkles className="h-4 w-4" /> {analyzed ? "Recalculate Score" : "Judge Content"}</button>
          <p className="mt-3 text-[10px] leading-4 text-[#888a8d]">Views are compared with a conservative platform benchmark and use logarithmic scaling so a viral outlier does not automatically get a perfect score.</p>
        </section>

        <section className="glass-card relative overflow-hidden rounded-3xl border border-black/10 bg-white/65 p-5 shadow-sm backdrop-blur-xl sm:p-6">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-black/[0.035] blur-3xl" />
          <div className="relative flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#77797c]">Overall health</p><p className="mt-1 text-xs text-[#66686c]">{status} performance signal</p></div><Gauge className="h-5 w-5 text-[#111214]" /></div>
          <div className="relative mt-7 flex items-center gap-5">
            <div className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full border-[10px] border-black/[0.06]" style={{ background: `conic-gradient(#111214 ${result.total * 3.6}deg, transparent 0)` }}><div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-[#f5f5f2]"><span className="text-4xl font-black tracking-tight text-[#111214]">{result.total}</span><span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#77797c]">/ 100</span></div></div>
            <div className="space-y-3 text-xs"><div><span className="text-[#77797c]">Content quality</span><strong className="ml-2 text-[#111214]">{result.contentScore}/60</strong></div><div><span className="text-[#77797c]">View performance</span><strong className="ml-2 text-[#111214]">{result.performanceScore}/40</strong></div><div><span className="text-[#77797c]">Benchmark</span><strong className="ml-2 text-[#111214]">{result.benchmark.toLocaleString()} views</strong></div></div>
          </div>
          <div className="relative mt-7 grid grid-cols-2 gap-2 text-[10px]"><div className="rounded-xl border border-black/10 bg-white/60 p-3"><span className="text-[#77797c]">Your views</span><p className="mt-1 text-sm font-black text-[#111214]">{(Number(views) || 0).toLocaleString()}</p></div><div className="rounded-xl border border-black/10 bg-white/60 p-3"><span className="text-[#77797c]">vs benchmark</span><p className="mt-1 text-sm font-black text-[#111214]">{result.ratio.toFixed(1)}×</p></div></div>
        </section>
      </div>

      <section className="glass-card rounded-3xl border border-black/10 bg-white/60 p-5 shadow-sm backdrop-blur-xl sm:p-6">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="text-sm font-bold text-[#111214]">Score breakdown</h2><p className="text-xs text-[#66686c]">What is helping or hurting the health score</p></div><TrendingUp className="h-4 w-4 text-[#111214]" /></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{Object.entries(result.breakdown).map(([key, value]) => { const max = key === "value" || key === "clarity" ? 16 : key === "hook" ? 14 : key === "action" ? 10 : 6; return <div key={key} className="rounded-2xl border border-black/10 bg-white/70 p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold capitalize text-[#111214]">{key}</span><span className="text-[10px] font-bold text-[#77797c]">{value}/{max}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/5"><div className="h-full rounded-full bg-[#111214]" style={{ width: `${(value / max) * 100}%` }} /></div></div> })}</div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
        <div className="glass-card rounded-3xl border border-black/10 bg-white/60 p-5 shadow-sm backdrop-blur-xl sm:p-6"><div className="mb-4 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-[#111214]" /><h2 className="text-sm font-bold text-[#111214]">Actionable diagnosis</h2></div><div className="space-y-2">{result.insights.map((insight, i) => <div key={insight} className="flex gap-3 rounded-2xl border border-black/10 bg-white/65 p-3 text-xs leading-5 text-[#44464a]"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#111214] text-[9px] font-bold text-white">{i + 1}</span><span>{insight}</span></div>)}</div></div>
        <div className="glass-card rounded-3xl border border-black/10 bg-white/60 p-5 shadow-sm backdrop-blur-xl sm:p-6"><h2 className="text-sm font-bold text-[#111214]">Try realistic examples</h2><p className="mt-1 text-xs text-[#66686c]">Load sample content and see how the model reacts to different view levels.</p><div className="mt-4 space-y-2">{demoPosts.map((post) => <button key={post.title} onClick={() => loadDemo(post)} className="w-full rounded-2xl border border-black/10 bg-white/65 p-3 text-left transition hover:border-black/25 hover:bg-white"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-[#111214]">{post.title}</span><span className="shrink-0 rounded-full bg-black/5 px-2 py-1 text-[9px] font-bold text-[#66686c]">{post.views.toLocaleString()} views</span></div><div className="mt-2 flex items-center gap-3 text-[9px] text-[#77797c]"><span>{post.platform}</span><span>•</span><span>{post.content.split(/\s+/).length} words</span></div></button>)}</div></div>
      </section>

      <div className="rounded-3xl border border-black/10 bg-[#111214] p-5 text-white shadow-sm sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-xs font-bold"><Target className="h-4 w-4" /> Why this is useful</div><p className="mt-1 max-w-2xl text-[11px] leading-5 text-white/60">Instead of calling every post “viral”, Content Health separates creative quality from distribution. A strong piece with weak views needs packaging or distribution; high views with weak content signals a format worth studying, not blindly repeating.</p></div><div className="flex shrink-0 gap-3 text-[10px] text-white/65"><span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> Views</span><span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> Quality</span><span className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5" /> Action</span></div></div></div>
    </div>
  );
}
