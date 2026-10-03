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
          className="fixed bottom-16 lg:bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-[#111214] px-4 py-3 font-semibold text-white shadow-xl shadow-black/25 hover:bg-[#232529] hover:scale-105 active:scale-95 transition duration-200 border border-white/15"
          title="Open AI Creator Copilot"
        >
          <Sparkles className="h-5 w-5 text-white animate-pulse" />
          <span className="hidden sm:inline text-sm font-semibold text-white">Ask Creator Copilot</span>
        </button>
      )}

      {/* Slide-out / Bottom-sheet Drawer */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[420px] max-w-full h-[85vh] sm:h-[600px] flex flex-col rounded-t-2xl sm:rounded-2xl border border-black/10 bg-[#f4f2ee]/95 shadow-2xl backdrop-blur-2xl overflow-hidden text-[#111214]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/10 bg-white/80 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#111214] text-white shadow-sm">
                <Wand2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111214] flex items-center gap-1.5">
                  Creator Copilot
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] text-[#111214] font-mono border border-black/10">
                    Gemini
                  </span>
                </h3>
                <p className="text-[10px] text-[#66686c]">Context-aware creative partner</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-[#66686c] hover:bg-black/5 hover:text-[#111214] transition"
              >
                <ChevronDown className="h-4 w-4 sm:hidden" />
                <X className="h-4 w-4 hidden sm:block" />
              </button>
            </div>
          </div>

          {/* Quick Action Chips */}
          <div className="flex gap-2 overflow-x-auto p-2.5 border-b border-black/10 bg-white/40 text-xs no-scrollbar">
            <button
              onClick={() => handleSend("Turn my latest video into 5 Shorts clips with hooks")}
              className="shrink-0 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-[11px] font-medium text-[#111214] hover:bg-white transition flex items-center gap-1.5 shadow-xs"
            >
              <Share2 className="h-3 w-3 text-[#111214]" /> Turn into 5 Shorts
            </button>
            <button
              onClick={() => handleSend("Generate 5 high-converting alternative hooks")}
              className="shrink-0 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-[11px] font-medium text-[#111214] hover:bg-white transition shadow-xs"
            >
              5 Strong Hooks
            </button>
            <button
              onClick={() => handleSend("How can I repurpose this script for LinkedIn?")}
              className="shrink-0 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-[11px] font-medium text-[#111214] hover:bg-white transition shadow-xs"
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
                      ? "bg-[#111214] text-white shadow-sm"
                      : "border border-black/10 bg-white/80 text-[#111214] shadow-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {m.role === "assistant" && (
                    <button
                      onClick={() => copyMessage(m.content, idx)}
                      className="absolute bottom-1.5 right-1.5 rounded p-1 text-[#77797c] hover:text-[#111214] transition"
                      title="Copy response"
                    >
                      {copiedIdx === idx ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3 opacity-60 hover:opacity-100" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#111214] bg-white/80 border border-black/10 rounded-xl px-3 py-2 w-fit shadow-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#111214]" />
                Thinking with Gemini...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="border-t border-black/10 p-3 bg-white/80 backdrop-blur-md">
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
                className="flex-1 rounded-xl border border-black/15 bg-white px-3.5 py-2 text-xs sm:text-sm text-[#111214] placeholder-[#8a8b8e] focus:border-black focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111214] text-white disabled:opacity-40 transition hover:bg-[#232529]"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 text-white" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
