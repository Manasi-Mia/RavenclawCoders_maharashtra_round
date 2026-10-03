import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreatorAI — AI-Powered Creator Operating Platform",
  description:
    "Your entire content workflow in one intelligent workspace. Plan, create, repurpose, and understand your content with Google Gemini AI.",
  keywords: [
    "content creator",
    "AI script generator",
    "video intelligence",
    "content repurposing",
    "creator operating system",
    "social media workflow",
  ],
  authors: [{ name: "CreatorAI" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#07090e] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <Providers>
          <div className="ambient-glow" />
          <div className="relative z-10 flex min-h-screen flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
