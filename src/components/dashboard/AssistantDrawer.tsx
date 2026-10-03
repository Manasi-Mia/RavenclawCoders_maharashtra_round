"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  ChevronDown,
  Wand2,
  Copy,
  Check,
  Share2,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AssistantDrawer({
  projectId,
}: {
  projectId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 Hey creator! I'm your AI Creative Copilot. I can help you draft viral hooks, refine your scripts, discover short-form clips from transcripts, or repurpose your work across Instagram, YouTube, and LinkedIn. What are we building next?",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: textToSend }];
    setMessages(newMessages);
    if (!customText) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          projectId,
          history: newMessages.slice(-6),
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "I encountered a hiccup processing that. Please try asking again!" },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error connecting to AI Assistant. Please check connection." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(index);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-16 lg:bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 p-3.5 sm:px-5 sm:py-3 font-semibold text-white shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition duration-200"
          title="Open AI Creator Copilot"
        >
          <Sparkles className="h-5 w-5 text-cyan-200 animate-pulse" />
          <span className="hidden sm:inline text-sm">Ask Creator Copilot</span>
        </button>
      )}

      {/* Slide-out / Bottom-sheet Drawer */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[420px] max-w-full h-[85vh] sm:h-[600px] flex flex-col rounded-t-2xl sm:rounded-2xl border border-white/10 bg-[#0d121f]/95 shadow-2xl backdrop-blur-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#090d16]/90 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5">
                <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-[#0d121f]">
                  <Wand2 className="h-4 w-4 text-cyan-300" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  Creator Copilot
                  <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[9px] text-cyan-300 font-mono">
                    Gemini
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">Context aware assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white transition"
              >
                <ChevronDown className="h-4 w-4 sm:hidden" />
                <X className="h-4 w-4 hidden sm:block" />
              </button>
            </div>
          </div>

          {/* Quick Action Chips */}
          <div className="flex gap-2 overflow-x-auto p-2.5 border-b border-white/[0.06] bg-black/20 text-xs text-slate-300 no-scrollbar">
            <button
              onClick={() => handleSend("Turn my latest video into 5 Shorts clips with hooks")}
              className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] hover:border-indigo-400/40 hover:bg-indigo-500/10 transition flex items-center gap-1"
            >
              <Share2 className="h-3 w-3 text-cyan-400" /> Turn into 5 Shorts
            </button>
            <button
              onClick={() => handleSend("Generate 5 high-converting alternative hooks")}
              className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] hover:border-purple-400/40 hover:bg-purple-500/10 transition"
            >
              5 Strong Hooks
            </button>
            <button
              onClick={() => handleSend("How can I repurpose this script for LinkedIn?")}
              className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] hover:border-indigo-400/40 hover:bg-indigo-500/10 transition"
            >
              Repurpose LinkedIn
            </button>
          </div>

          {/* Message History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`relative max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                      : "border border-white/10 bg-white/[0.04] text-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {m.role === "assistant" && (
                    <button
                      onClick={() => copyMessage(m.content, idx)}
                      className="absolute bottom-1.5 right-1.5 rounded p-1 text-slate-400 hover:text-white transition"
                      title="Copy response"
                    >
                      {copiedIdx === idx ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3 opacity-60 hover:opacity-100" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-purple-300 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 w-fit">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                Thinking with Gemini...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="border-t border-white/[0.08] p-3 bg-[#090d16]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Copilot (e.g. 'Improve this hook', 'Suggest 3 ideas')..."
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white disabled:opacity-40 transition hover:opacity-90"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
