"use client";

import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Layers,
  Wand2,
  Video,
  Share2,
  BarChart3,
  CheckCircle2,
  Play,
  FileText,
  Lightbulb,
  Check,
  LockKeyhole,
  CalendarDays,
  CircleUserRound,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const workflow = [
  { label: "IDEA", icon: Lightbulb },
  { label: "SCRIPT", icon: FileText },
  { label: "ASSETS", icon: Layers },
  { label: "FOOTAGE", icon: Video },
  { label: "CLIPS", icon: Play },
  { label: "EDIT", icon: Wand2 },
  { label: "REPURPOSE", icon: Share2 },
  { label: "PUBLISH", icon: CheckCircle2 },
  { label: "ANALYTICS", icon: BarChart3 },
];

const features = [
  {
    title: "Idea → Action",
    text: "Capture ideas, turn them into projects and keep every creative decision in context.",
    icon: Lightbulb,
    dark: true,
    className: "md:col-span-2 md:row-span-2",
  },
  {
    title: "Script Studio",
    text: "Hooks, scripts, titles and captions generated around your content goal.",
    icon: Wand2,
    className: "md:col-span-1",
  },
  {
    title: "Video Intelligence",
    text: "Find useful moments and clip boundaries without manually scanning every minute.",
    icon: Video,
    className: "md:col-span-1",
  },
  {
    title: "Repurpose",
    text: "Turn one source into platform-native formats for YouTube, Instagram, LinkedIn and X.",
    icon: Share2,
    className: "md:col-span-2",
  },
  {
    title: "Workflow + Calendar",
    text: "Move from idea to published with a visual production pipeline and schedule.",
    icon: CalendarDays,
    className: "md:col-span-1",
  },
  {
    title: "Creator Intelligence",
    text: "Understand what worked and what to create next from your content data.",
    icon: BarChart3,
    className: "md:col-span-1",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#e8e6e1] text-[#101114] selection:bg-black selection:text-white">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative isolate min-h-[760px] overflow-hidden bg-[#e9e7e2] pt-24 sm:pt-32">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-24 top-10 h-[520px] w-[520px] rounded-full bg-white/80 blur-[100px]" />
            <div className="absolute -right-24 top-24 h-[620px] w-[620px] rounded-full bg-[#c9c6c0]/70 blur-[120px]" />
            <div className="absolute left-1/3 top-1/2 h-[360px] w-[760px] -rotate-12 rounded-full bg-white/50 blur-[90px]" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#e9e7e2] to-transparent" />
          </div>

          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-black/15 bg-white/45 px-4 py-2 text-xs font-semibold text-[#34363a] shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5" />
              AI-POWERED CREATOR OPERATING PLATFORM
            </div>

            <h1 className="mx-auto mt-8 max-w-6xl text-5xl font-black leading-[0.96] tracking-[-0.055em] text-[#0b0c0f] sm:text-7xl lg:text-[96px]">
              Ten tabs closed.
              <br />
              <span className="bg-gradient-to-r from-[#17181b] via-[#66676a] to-[#b1b1b0] bg-clip-text text-transparent">
                One workspace open.
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-base leading-7 text-[#56585d] sm:text-lg">
              Plan, create, repurpose and understand your content with AI — without jumping between 10 different tools.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#090a0c] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:bg-[#1c1d20] sm:w-auto"
              >
                Start Creating Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#workflow"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/15 bg-white/45 px-7 py-3.5 text-sm font-semibold text-[#24262a] backdrop-blur-xl transition hover:bg-white/70 sm:w-auto"
              >
                Explore the workspace
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-[#686a6e]">
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> No credit card</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Demo data included</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Gemini-powered</span>
            </div>

            {/* Floating glass workspace mockup */}
            <div className="relative mx-auto mt-16 flex max-w-5xl items-end justify-center gap-3 pb-16 sm:mt-20 sm:gap-6">
              <div className="absolute bottom-2 left-1/2 h-16 w-3/4 -translate-x-1/2 rounded-full bg-black/20 blur-3xl" />

              <div className="relative hidden w-[290px] -rotate-3 overflow-hidden rounded-[34px] border border-white/70 bg-white/45 p-2 text-left shadow-[0_35px_80px_rgba(20,20,20,0.20)] backdrop-blur-2xl sm:block">
                <div className="overflow-hidden rounded-[27px] bg-[#d9d7d2] p-5">
                  <div className="flex items-center justify-between text-[10px] text-[#5c5d60]">
                    <span>CreatorAI</span><span>09:41</span>
                  </div>
                  <div className="mt-6 rounded-[22px] bg-white/75 p-5 shadow-sm">
                    <div className="mb-5 inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2.5 py-1 text-[9px] font-semibold">
                      <Sparkles className="h-3 w-3" /> AI Creator
                    </div>
                    <h3 className="text-2xl font-bold leading-tight tracking-tight">Your next<br />great hook.</h3>
                    <p className="mt-3 text-[10px] leading-4 text-[#686a6e]">Generate angles, tighten the opening and keep your voice consistent.</p>
                    <div className="mt-6 rounded-2xl bg-[#111214] p-4 text-white">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/45">Suggested hook</p>
                      <p className="mt-2 text-xs font-semibold leading-5">“The fastest way to lose an audience? Starting without a reason to stay.”</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 w-full max-w-[620px] overflow-hidden rounded-[32px] border border-white/75 bg-white/45 p-2 text-left shadow-[0_45px_100px_rgba(20,20,20,0.24)] backdrop-blur-2xl sm:rotate-1">
                <div className="rounded-[25px] bg-[#121315] p-4 text-white sm:p-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2 text-xs font-semibold"><Sparkles className="h-4 w-4" /> Creator Workspace</div>
                    <div className="rounded-full border border-white/15 px-2.5 py-1 text-[9px] text-white/55">LIVE WORKFLOW</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-4">
                    {[['12','Ideas'],['04','In production'],['07','Published'],['+18%','Views']].map(([value,label]) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                        <div className="text-lg font-bold">{value}</div>
                        <div className="mt-1 text-[9px] text-white/45">{label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1.4fr_0.8fr]">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex items-center justify-between">
                        <div><p className="text-[9px] uppercase tracking-[0.16em] text-white/40">Active project</p><p className="mt-1 text-sm font-semibold">How I Built My First AI App</p></div>
                        <span className="rounded-full bg-white px-2 py-1 text-[8px] font-bold text-black">EDITING</span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[72%] rounded-full bg-white" /></div>
                      <div className="mt-2 flex justify-between text-[9px] text-white/40"><span>72% complete</span><span>4 clips ready</span></div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-[9px] uppercase tracking-[0.16em] text-white/40">AI next step</p>
                      <p className="mt-2 text-xs leading-5 text-white/80">Turn the strongest moment into 3 platform versions.</p>
                      <Link href="/register" className="mt-3 inline-flex rounded-full bg-white px-3 py-1.5 text-[9px] font-bold text-black">Generate →</Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative hidden w-[220px] translate-y-7 rotate-3 overflow-hidden rounded-[30px] border border-white/70 bg-white/45 p-2 text-left shadow-[0_35px_80px_rgba(20,20,20,0.18)] backdrop-blur-2xl lg:block">
                <div className="rounded-[24px] bg-[#e1dfda] p-4">
                  <div className="flex items-center justify-between text-[9px] text-[#66676a]"><span>Creator intelligence</span><BarChart3 className="h-3.5 w-3.5" /></div>
                  <div className="mt-5 rounded-2xl bg-white/75 p-4"><div className="text-3xl font-black">87</div><div className="text-[9px] text-[#686a6e]">content score</div><div className="mt-4 space-y-2"><div className="h-1.5 rounded-full bg-black/10"><div className="h-full w-[92%] rounded-full bg-black" /></div><div className="h-1.5 rounded-full bg-black/10"><div className="h-full w-[81%] rounded-full bg-black/70" /></div><div className="h-1.5 rounded-full bg-black/10"><div className="h-full w-[74%] rounded-full bg-black/45" /></div></div></div>
                  <div className="mt-3 rounded-2xl bg-[#111214] p-4 text-white"><p className="text-[9px] text-white/45">NEXT BEST ACTION</p><p className="mt-2 text-xs leading-4">Publish your strongest short today.</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow dock */}
        <section id="workflow" className="border-y border-black/10 bg-[#dedcd7] py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#77797c]">One continuous workflow</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">From first thought to final insight.</h2>
              <p className="mt-4 text-sm leading-6 text-[#66686c]">Every stage stays connected, so your context travels with the content.</p>
            </div>

            <div className="mt-12 rounded-[32px] border border-white/70 bg-white/45 p-3 shadow-[0_25px_70px_rgba(0,0,0,0.10)] backdrop-blur-2xl">
              <div className="flex flex-wrap items-center justify-center gap-2 rounded-[25px] bg-[#17181a] p-3 sm:gap-3">
                {workflow.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.label} className={`group flex min-w-[86px] flex-col items-center gap-2 rounded-[20px] px-3 py-3 transition ${i === 0 ? 'bg-white text-black shadow-lg' : 'text-white/55 hover:bg-white/10 hover:text-white'}`}>
                      <Icon className="h-4 w-4" />
                      <span className="text-[9px] font-bold tracking-[0.12em]">{step.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="grid gap-3 p-3 sm:grid-cols-[1.4fr_0.6fr]">
                <div className="rounded-[24px] bg-[#111214] p-5 text-white">
                  <div className="flex items-center justify-between"><div><p className="text-[9px] uppercase tracking-[0.2em] text-white/35">Active project</p><h3 className="mt-1 text-base font-semibold">How I Built My First AI App in 48 Hours</h3></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] text-white/50">RECORDING</span></div>
                  <p className="mt-4 rounded-2xl bg-white/[0.05] p-4 text-xs leading-6 text-white/70">“90% of developers spend months building an MVP nobody wants. I launched one in 48 hours.”</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-[9px] text-white/35"><span>2m 23s</span><span>310 words</span><span>4 clip boundaries</span></div>
                </div>
                <div className="rounded-[24px] border border-black/10 bg-white/60 p-5">
                  <div className="flex items-center gap-2 text-xs font-bold"><Sparkles className="h-4 w-4" /> AI next step</div>
                  <p className="mt-3 text-sm leading-6 text-[#55575b]">Turn Section 2 into platform-native short-form versions.</p>
                  <Link href="/register" className="mt-5 inline-flex rounded-full bg-black px-4 py-2 text-[10px] font-bold text-white">Generate versions</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bento features */}
        <section id="features" className="bg-[#efede8] py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#77797c]">Everything in one place</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl">Less switching.<br />More creating.</h2>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-[#66686c]">The tools you already need, connected around one creative workflow.</p>
            </div>

            <div className="mt-12 grid auto-rows-[180px] grid-cols-1 gap-4 md:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className={`group relative overflow-hidden rounded-[30px] border border-black/10 p-6 shadow-[0_20px_55px_rgba(0,0,0,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(0,0,0,0.12)] ${feature.dark ? 'bg-[#121315] text-white' : 'bg-white/55 text-[#101114]'} ${feature.className}`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${feature.dark ? 'border-white/15 bg-white/10' : 'border-black/10 bg-white/70'}`}><Icon className="h-5 w-5" /></div>
                    <h3 className="mt-5 text-xl font-bold tracking-tight">{feature.title}</h3>
                    <p className={`mt-2 max-w-md text-xs leading-5 ${feature.dark ? 'text-white/55' : 'text-[#66686c]'}`}>{feature.text}</p>
                    <span className={`absolute bottom-5 right-6 text-[9px] font-bold uppercase tracking-[0.18em] ${feature.dark ? 'text-white/30' : 'text-black/25'}`}>CreatorAI</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-[30px] border border-black/10 bg-white/55 p-7 shadow-[0_20px_55px_rgba(0,0,0,0.07)]">
                <div className="flex items-center gap-3"><LockKeyhole className="h-5 w-5" /><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#77797c]">Pro-ready</span></div>
                <h3 className="mt-4 text-2xl font-bold">Your best ideas stay yours.</h3>
                <p className="mt-2 text-sm leading-6 text-[#66686c]">Keep private drafts, assets and analytics inside one secure workspace with user-scoped data.</p>
              </div>
              <div className="rounded-[30px] bg-[#121315] p-7 text-white shadow-[0_20px_55px_rgba(0,0,0,0.16)]">
                <div className="flex items-center gap-3"><Sparkles className="h-5 w-5" /><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Creator intelligence</span></div>
                <h3 className="mt-4 text-2xl font-bold">Know what to do next.</h3>
                <p className="mt-2 text-sm leading-6 text-white/50">AI turns your content history into practical next actions instead of another page of numbers.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Video intelligence */}
        <section id="intelligence" className="bg-[#dcdad5] py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/45 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-xl"><Video className="h-3.5 w-3.5" /> Script-to-video intelligence</div>
              <h2 className="mt-5 text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-6xl">One long video.<br />Multiple useful moments.</h2>
              <p className="mt-5 max-w-xl text-sm leading-6 text-[#626469]">CreatorAI connects your script and transcript to surface clip candidates, timestamps and platform-ready hooks without changing your original footage.</p>
              <div className="mt-7 space-y-3 text-sm text-[#3f4145]">
                {['Exact clip boundaries', 'Platform-specific captions', 'Non-destructive recommendations'].map((item) => <div key={item} className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white"><Check className="h-3.5 w-3.5" /></span>{item}</div>)}
              </div>
              <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">Try Video Intelligence <ArrowRight className="h-4 w-4" /></Link>
            </div>

            <div className="rounded-[34px] border border-white/70 bg-white/45 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.12)] backdrop-blur-2xl">
              <div className="rounded-[27px] bg-[#151618] p-5 text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-4"><span className="flex items-center gap-2 text-xs font-semibold"><Play className="h-4 w-4" /> Suggested clip #01</span><span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-bold text-black">00:12 → 00:58</span></div>
                <div className="mt-5 rounded-[24px] bg-gradient-to-br from-[#3d3e40] via-[#777875] to-[#1c1d1f] p-6"><div className="flex h-48 items-center justify-center rounded-[18px] border border-white/10 bg-black/10"><Play className="h-10 w-10 rounded-full bg-white p-3 text-black" /></div></div>
                <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.05] p-4"><p className="text-[9px] uppercase tracking-[0.18em] text-white/35">Hook</p><p className="mt-2 text-sm font-semibold leading-6">“Stop spending six months building an MVP nobody wants.”</p></div>
                <div className="mt-4 flex items-center justify-between text-[10px] text-white/45"><span>YouTube Shorts</span><span className="rounded-full bg-white px-3 py-1.5 font-bold text-black">Ready to Clip</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="bg-[#efede8] py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center"><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#77797c]">Simple access</p><h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Everything you need to create.</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#66686c]">Explore the full CreatorAI workflow while the platform is in beta.</p></div>

            <div className="mx-auto mt-12 max-w-xl rounded-[34px] border border-black/10 bg-white/60 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.10)] backdrop-blur-2xl">
              <div className="rounded-[27px] bg-[#f0eee9] p-7 sm:p-9">
                <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#77797c]">Creator workspace</p><h3 className="mt-2 text-2xl font-black">Free Beta</h3></div><span className="rounded-full bg-black px-3 py-1.5 text-[9px] font-bold text-white">FULL ACCESS</span></div>
                <div className="mt-7 space-y-2">
                  <div className="flex items-center justify-between rounded-2xl border-2 border-black bg-white/70 p-4"><span className="flex items-center gap-3 text-sm font-semibold"><span className="h-4 w-4 rounded-full border-4 border-black bg-white" /> Yearly-style access</span><span className="text-xs text-[#66686c]">$0 beta</span></div>
                  <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white/45 p-4"><span className="flex items-center gap-3 text-sm text-[#55575b]"><span className="h-4 w-4 rounded-full border border-black/25" /> No commitment</span><span className="text-xs text-[#77797c]">Cancel anytime</span></div>
                </div>
                <div className="mt-7 grid grid-cols-1 gap-2 text-xs text-[#55575b] sm:grid-cols-2">
                  {['Ideas + projects', 'AI scripts + hooks', 'Video intelligence', 'Repurpose studio', 'Kanban + calendar', 'Creator analytics'].map((item) => <div key={item} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-black" />{item}</div>)}
                </div>
                <Link href="/register" className="mt-8 block w-full rounded-full bg-black py-3.5 text-center text-sm font-bold text-white transition hover:-translate-y-0.5">Start creating free</Link>
                <p className="mt-3 text-center text-[10px] text-[#77797c]">No credit card required · Beta access</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden bg-[#0e0f11] py-24 text-center text-white">
          <div className="absolute left-1/2 top-0 h-72 w-[700px] -translate-x-1/2 rounded-full bg-white/5 blur-[100px]" />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10"><Sparkles className="h-5 w-5" /></div>
            <h2 className="mt-6 text-4xl font-black tracking-[-0.04em] sm:text-6xl">Close the tabs.<br />Open the workspace.</h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/45">One connected system for ideas, creation, publishing and learning.</p>
            <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-black transition hover:-translate-y-0.5">Get started free <ArrowRight className="h-4 w-4" /></Link>
            <div className="mt-10 flex items-center justify-center gap-5 text-[10px] text-white/30"><span className="flex items-center gap-1.5"><CircleUserRound className="h-3.5 w-3.5" /> Built for creators</span><span>•</span><span>Powered by AI</span></div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
