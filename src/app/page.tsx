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
  TrendingUp,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#07090e]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-cyan-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-cyan-300 backdrop-blur-md mb-8">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            <span>AI-Powered Creator Operating Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.15]">
            Your entire content workflow.{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              One intelligent workspace.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg lg:text-xl leading-relaxed">
            Plan, create, repurpose and understand your content with AI — without jumping between 10 different tools.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-500/25 transition duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Creating Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-base font-medium text-slate-200 backdrop-blur-md transition hover:bg-white/[0.08] hover:text-white"
            >
              <Wand2 className="h-4 w-4 text-purple-400" />
              Explore AI Studio
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-400" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-400" /> 1-Click Realistic Demo Data
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-400" /> Powered by Gemini 2.5
            </span>
          </div>

          {/* Workflow Pipeline Graphic */}
          <div id="workflow" className="mt-16 mx-auto max-w-5xl rounded-2xl border border-white/10 bg-[#0d121f]/90 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-400">CreatorAI Operating System 2.5</span>
              </div>
              <span className="text-xs font-medium text-cyan-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" /> Live Connected Pipeline
              </span>
            </div>

            {/* Pipeline Steps Flow */}
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 text-center text-xs">
              {[
                { label: "IDEA", icon: Lightbulb, color: "text-amber-400" },
                { label: "SCRIPT", icon: FileText, color: "text-indigo-400" },
                { label: "ASSETS", icon: Layers, color: "text-blue-400" },
                { label: "FOOTAGE", icon: Video, color: "text-cyan-400" },
                { label: "CLIPS", icon: Play, color: "text-purple-400" },
                { label: "EDITING", icon: Wand2, color: "text-pink-400" },
                { label: "REPURPOSE", icon: Share2, color: "text-emerald-400" },
                { label: "PUBLISH", icon: CheckCircle2, color: "text-violet-400" },
                { label: "ANALYTICS", icon: BarChart3, color: "text-teal-400" },
              ].map((step, i) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.label}
                    className="relative flex flex-col items-center p-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:border-indigo-500/30 hover:bg-white/[0.05] transition"
                  >
                    <Icon className={`h-4 w-4 ${step.color} mb-1.5`} />
                    <span className="font-bold tracking-wider text-[10px] text-slate-200">{step.label}</span>
                    {i < 8 && (
                      <span className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-600 text-xs">
                        →
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Interactive Workspace Preview Mock */}
            <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#07090e] p-5 text-left grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 rounded-lg border border-white/5 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-semibold text-white">Active Project: How I Built My First AI App in 48 Hours</span>
                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">RECORDING</span>
                </div>
                <p className="text-xs text-slate-300 font-mono bg-black/40 p-3 rounded border border-white/5 leading-relaxed">
                  HOOK: &ldquo;90% of developers spend 6 months building an MVP nobody wants. I launched one in 48 hours. Here is the exact roadmap...&rdquo;
                </p>
                <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400">
                  <span>⏱️ 2m 23s duration</span>
                  <span>📝 310 words</span>
                  <span className="text-cyan-400">⚡ 4 Clip boundaries identified</span>
                </div>
              </div>

              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" /> Gemini Intelligence
                  </span>
                  <p className="text-xs text-slate-400 leading-normal">
                    &ldquo;Turn Section 2 into a contrarian YouTube Short. The phrase &lsquo;Zero DevOps&rsquo; predicts high comment velocity.&rdquo;
                  </p>
                </div>
                <Link
                  href="/register"
                  className="mt-3 block text-center rounded-lg bg-indigo-600/30 border border-indigo-500/30 py-1.5 text-xs font-medium text-cyan-300 hover:bg-indigo-600/40 transition"
                >
                  Generate 5 Platform Versions →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Matrix */}
      <section id="features" className="py-20 border-t border-white/[0.08] bg-[#090d16]/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Everything in One Place</h2>
            <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-white">
              End the 10-Tab Chaos. Own Your Production Engine.
            </p>
            <p className="mt-4 text-slate-400 text-sm sm:text-base">
              CreatorAI connects the dots across your entire creative lifecycle so you never lose context or repeat tedious manual work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
                <Lightbulb className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition">
                Content Idea Manager
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Full CRUD idea organization with platform tagging, priority status, and instant Gemini AI topic generation based on target audience.
              </p>
            </div>

            {/* Card 2 */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
                <Wand2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition">
                AI Script & 10x Hook Studio
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Generate production-ready video scripts complete with scene directions, 6 psychological hooks, high-CTR titles, and platform captions.
              </p>
            </div>

            {/* Card 3 */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400">
                <Video className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition">
                Video Intelligence & Clips
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Match transcripts to scripts to automatically identify viral moment candidates with precise start/end timestamps and targeted captions.
              </p>
            </div>

            {/* Card 4 */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
                <Share2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition">
                Repurpose Studio
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                One source script adapts automatically into Instagram Reels, YouTube chapters, LinkedIn thought leadership, X threads, and TikTok hooks.
              </p>
            </div>

            {/* Card 5 */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition">
                Kanban Workflow & Calendar
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Move projects through visual stages: Ideas → Planned → Recording → Editing → Ready → Published with integrated scheduling.
              </p>
            </div>

            {/* Card 6 */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4 text-teal-400">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-teal-300 transition">
                Creator Intelligence
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Gemini analyzes your historical content metrics to expose high-performing topics, strong hook formulas, and recommend next high-impact actions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Intelligence Showcase */}
      <section id="intelligence" className="py-20 border-t border-white/[0.08]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300">
                Script-To-Video Intelligence
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Turn 1 Long Video Into 5 Platform-Native Hits.
              </h2>
              <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                Instead of manually re-watching hours of footage, CreatorAI correlates your script keywords and transcript timeline to pinpoint retention spikes, punchy hooks, and emotional shifts.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    ✓
                  </div>
                  <p className="text-sm text-slate-300">
                    <strong className="text-white">AI Boundary Detection:</strong> Exact start and end timestamps so you know where to cut.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    ✓
                  </div>
                  <p className="text-sm text-slate-300">
                    <strong className="text-white">Tailored Captions:</strong> Custom hashtags and viral hooks tailored for Reels, Shorts, and TikTok.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    ✓
                  </div>
                  <p className="text-sm text-slate-300">
                    <strong className="text-white">Preserves Original Footage:</strong> AI recommends timestamps without destructive changes.
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 transition"
                >
                  Try Video Intelligence
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Visual clip candidate card */}
            <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Play className="h-4 w-4 text-purple-400" /> Suggested Clip Candidate #1
                </span>
                <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                  00:12 → 00:58 (46s)
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Hook:</p>
                <p className="text-xs text-indigo-300 font-mono mt-1 bg-black/40 p-2.5 rounded border border-white/5">
                  &ldquo;90% of developers spend 6 months building an MVP nobody wants. Stop doing that.&rdquo;
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Why It Works (AI Analysis):</p>
                <p className="text-xs text-slate-400 mt-1">
                  High viewer retention spike, punchy opening hook, clear actionable takeaway for indie builders.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                <span className="text-slate-400">Platform: <strong className="text-white">YouTube Shorts</strong></span>
                <span className="text-emerald-400 font-medium">Ready to Clip</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Demo Section */}
      <section id="pricing" className="py-20 border-t border-white/[0.08] bg-[#090d16]/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to Supercharge Your Content Workflow?
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-slate-400 text-sm sm:text-base">
            CreatorAI is built for ambitious solo creators, educators, podcasters, and media teams.
          </p>

          <div className="mt-12 max-w-md mx-auto rounded-3xl border border-indigo-500/40 bg-gradient-to-b from-indigo-950/40 to-[#0d121f] p-8 shadow-2xl relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 px-3 py-1 text-[11px] font-bold text-white uppercase tracking-wider">
              Complete Pro Access
            </div>
            <h3 className="text-2xl font-bold text-white mt-2">Creator Operating System</h3>
            <div className="mt-4 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-extrabold text-white">$0</span>
              <span className="text-slate-400 text-sm">/ Free Beta</span>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Includes full access to AI Script Generator, Video Intelligence, Repurposing Studio, and MongoDB Sync.
            </p>

            <ul className="mt-6 space-y-3 text-left text-xs text-slate-300 border-t border-white/10 pt-6">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-cyan-400" /> Unlimited Content Ideas & Project Management
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-cyan-400" /> Google Gemini 2.5 AI Script & Hook Generation
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-cyan-400" /> Video Transcript Intelligence & Clip Candidates
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-cyan-400" /> 1-Click Multi-Platform Repurposing (IG, YT, LI, X)
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-cyan-400" /> Visual Kanban Board & Content Calendar
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-cyan-400" /> Vercel Serverless Ready + MongoDB Atlas
              </li>
            </ul>

            <Link
              href="/register"
              className="mt-8 block w-full rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 transition"
            >
              Start Creating Now
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 border-t border-white/[0.08] relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-cyan-400 mb-4">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs uppercase font-bold tracking-widest">Transform Your Creative System</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Build Your Audience Faster with AI.
          </h2>
          <div className="mt-8 flex justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-slate-950 shadow-xl transition hover:bg-slate-200"
            >
              Get Started for Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
