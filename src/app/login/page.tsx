"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sparkles, ArrowRight, Loader2, Lock, Mail, ShieldAlert, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function LoginContent() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email, password, redirectTo);
    setLoading(false);
    if (!res.success) setError(res.error || "Invalid email or password");
  };

  const handleQuickDemo = async () => {
    setError("");
    setLoading(true);
    const demoEmail = "demo.creator@creatorai.dev";
    const demoPass = "creator123456";
    const loginRes = await login(demoEmail, demoPass, redirectTo);
    if (!loginRes.success) {
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Alex Rivera", email: demoEmail, password: demoPass, creatorType: "YouTuber" }),
      });
      if (regRes.ok) await login(demoEmail, demoPass, redirectTo);
      else setError("Could not initialize quick demo. Please sign up with your details.");
    }
    setLoading(false);
  };

  return (
    <div className="creator-auth relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="creator-ambient" aria-hidden="true" />
      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[36px] border border-white/80 bg-white/45 shadow-[0_35px_100px_rgba(20,20,20,.13)] backdrop-blur-2xl lg:grid-cols-[1fr_1.05fr]">
        <div className="hidden bg-[#111214] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div><div className="flex items-center gap-2.5"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black"><Sparkles className="h-5 w-5" /></div><span className="text-xl font-black">CreatorAI</span></div><p className="mt-16 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Your creator workspace</p><h1 className="mt-4 text-5xl font-black leading-[.98] tracking-[-.045em]">Ten tabs closed.<br /><span className="text-white/45">One workspace open.</span></h1><p className="mt-6 max-w-sm text-sm leading-6 text-white/45">Ideas, scripts, projects, video intelligence and analytics — connected in one calm workspace.</p></div>
          <div className="space-y-3 text-xs text-white/50">{['One connected workflow', 'AI-powered creation', 'Private creator workspace'].map((x) => <div key={x} className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-black"><Check className="h-3 w-3" /></span>{x}</div>)}</div>
        </div>
        <div className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8 lg:hidden"><Link href="/" className="inline-flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#111214] text-white"><Sparkles className="h-4 w-4" /></div><span className="text-xl font-black">CreatorAI</span></Link></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#77797c]">Welcome back</p><h2 className="mt-2 text-3xl font-black tracking-tight text-[#111214]">Open your workspace.</h2><p className="mt-2 text-sm text-[#77797c]">Sign in and continue where you left off.</p></div>
          {redirectTo !== "/dashboard" && <div className="mt-5 rounded-2xl border border-black/10 bg-white/70 p-3 text-xs text-[#55575b]">Sign in to continue creating your project. You’ll be taken back automatically.</div>}
          {error && <div className="mt-6 flex items-center gap-2 rounded-2xl border border-red-900/10 bg-red-50 p-3 text-xs text-red-700"><ShieldAlert className="h-4 w-4 shrink-0" />{error}</div>}
          <button type="button" onClick={handleQuickDemo} disabled={loading} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#111214] py-3.5 text-xs font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-50"><Sparkles className="h-4 w-4" />Try the instant demo</button>
          <div className="my-6 flex items-center gap-3 text-[9px] font-bold uppercase tracking-[.18em] text-[#999a9d]"><span className="h-px flex-1 bg-black/10" />or sign in<span className="h-px flex-1 bg-black/10" /></div>
          <form onSubmit={handleSubmit} className="space-y-4"><div><label className="mb-2 block text-xs font-bold text-[#45474b]">Email address</label><div className="relative"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8c90]" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="creator@example.com" className="w-full py-3.5 pl-11 pr-4 text-sm" /></div></div><div><label className="mb-2 block text-xs font-bold text-[#45474b]">Password</label><div className="relative"><Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8c90]" /><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full py-3.5 pl-11 pr-4 text-sm" /></div></div><button type="submit" disabled={loading} className="creator-button mt-2 w-full py-3.5 text-sm">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Sign in</span><ArrowRight className="h-4 w-4" /></>}</button></form>
          <p className="mt-7 text-center text-xs text-[#77797c]">Don&apos;t have an account? <Link href="/register" className="font-bold text-[#111214] underline underline-offset-4">Create one</Link></p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#111214]" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
