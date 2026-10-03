import { IUser, IProject, IIdea, IScript, IAsset, IClip, IRepurposedContent, IAnalytics, IAIHistory } from "@/models";

// Global persistent in-memory store for environments without MongoDB or for immediate demo
interface StoreData {
  users: IUser[];
  projects: IProject[];
  ideas: IIdea[];
  scripts: IScript[];
  assets: IAsset[];
  clips: IClip[];
  repurposed: IRepurposedContent[];
  analytics: IAnalytics[];
  aiHistory: IAIHistory[];
}

declare global {
  // eslint-disable-next-line no-var
  var memoryStore: StoreData | undefined;
}

const initialStore: StoreData = {
  users: [],
  projects: [],
  ideas: [],
  scripts: [],
  assets: [],
  clips: [],
  repurposed: [],
  analytics: [],
  aiHistory: [],
};

export const memoryStore: StoreData = global.memoryStore || initialStore;
if (!global.memoryStore) {
  global.memoryStore = memoryStore;
}

export function generateId(): string {
  return "id_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// Helper to seed realistic demo data for a user
export function seedRealisticDemoData(userId: string): { projectId: string; scriptId: string } {
  const projectId = generateId();
  const scriptId = generateId();

  // Remove existing demo data for this user to avoid duplicates
  memoryStore.projects = memoryStore.projects.filter((p) => p.userId !== userId);
  memoryStore.ideas = memoryStore.ideas.filter((i) => i.userId !== userId);
  memoryStore.scripts = memoryStore.scripts.filter((s) => s.userId !== userId);
  memoryStore.assets = memoryStore.assets.filter((a) => a.userId !== userId);
  memoryStore.clips = memoryStore.clips.filter((c) => c.userId !== userId);
  memoryStore.repurposed = memoryStore.repurposed.filter((r) => r.userId !== userId);
  memoryStore.analytics = memoryStore.analytics.filter((an) => an.userId !== userId);

  // 1. Projects
  const mainProject: IProject = {
    _id: projectId,
    userId,
    title: "How I Built My First AI App in 48 Hours",
    description: "Step-by-step breakdown of ideating, coding, and launching an AI SaaS product with modern developer tools.",
    platform: "YouTube",
    status: "RECORDING",
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    progress: 65,
    targetAudience: "Tech enthusiasts, Indie hackers, Software developers",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  };

  const secondProject: IProject = {
    _id: generateId(),
    userId,
    title: "5 Gemini 2.5 Features You Didn't Know Existed",
    description: "Fast-paced short-form breakdown of multimodality, structured outputs, and real-time audio.",
    platform: "Instagram",
    status: "EDITING",
    thumbnail: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80",
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    progress: 80,
    targetAudience: "AI creators & content founders",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  };

  const thirdProject: IProject = {
    _id: generateId(),
    userId,
    title: "Why Most Creators Fail at Repurposing",
    description: "Deep dive podcast & newsletter on context retention and platform native tone adaptation.",
    platform: "LinkedIn",
    status: "PLANNED",
    thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    progress: 25,
    targetAudience: "B2B creators & agency founders",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  };

  const fourthProject: IProject = {
    _id: generateId(),
    userId,
    title: "10x Productivity Setup for 2026",
    description: "Hardware, software, and AI automation stack that saved 15 hours every week.",
    platform: "YouTube",
    status: "PUBLISHED",
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
    deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    progress: 100,
    targetAudience: "Solopreneurs & knowledge workers",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
  };

  memoryStore.projects.push(mainProject, secondProject, thirdProject, fourthProject);

  // 2. Script
  const scriptContent = `[SCENE START]
(High-energy cold open. Fast cuts of terminal code, app UI running, and the final deploy screen)

HOOK:
"90% of developers spend 6 months building an MVP nobody wants. I built and launched a functional AI SaaS in exactly 48 hours — and here is the exact raw roadmap you can steal today."

INTRODUCTION:
What if you didn't need a team of 5 engineers to validate your app idea?
In this video, I'm peeling back the curtain on my 48-hour sprint. We're covering:
1. Identifying high-intent micro-problems
2. Using Next.js + Gemini API for instant inference
3. Rapid UI prototyping with zero bloated libraries
4. The launch checklist that drove the first 500 active signups.

SECTION 1: THE CORE ARCHITECTURE
Most people get stuck choosing between 20 different cloud frameworks. 
Here was my strict constraint rule:
- Full-stack TypeScript
- Serverless API routes (no managing container clusters)
- Fast streaming AI responses to prevent user drop-off

SECTION 2: PROMPTING FOR PRODUCTION
Writing prompts in playground is easy. Making them resilient to user chaos in production is the real test.
Here's how I structured structured JSON outputs to prevent hallucinated schemas...

SECTION 3: THE ZERO-DOLLAR LAUNCH PLAYBOOK
Never launch on Product Hunt alone. 
Instead, document the building journey in public on X and LinkedIn with real-time analytics screenshots.

CALL TO ACTION:
"If you want my exact boilerplate and prompts, drop a comment below and check the GitHub link in the description. Hit subscribe for next week's teardown!"
[SCENE END]`;

  const mainScript: IScript = {
    _id: scriptId,
    userId,
    projectId,
    title: "How I Built My First AI App in 48 Hours — Master Script",
    content: scriptContent,
    hooks: [
      "90% of developers spend 6 months building an MVP nobody wants. I launched one in 48 hours.",
      "Stop overthinking your SaaS stack. Here's how to ship an AI tool before Sunday night.",
      "I challenged myself to code an entire AI product from scratch in one weekend. Here's what happened.",
      "Most AI apps are just wrappers. Here is how you build one that people actually pay for.",
      "The exact prompt engineering framework that made my app 10x faster.",
    ],
    titles: [
      "I Built an AI SaaS in 48 Hours (Step-by-Step Breakdown)",
      "How to Ship AI Apps Fast: My 48-Hour Weekend Sprint",
      "Stop Overengineering: Launch Your AI MVP in 2 Days",
      "From Blank Code to Live Product: The 48h AI Roadmap",
    ],
    captions: [
      "Building in public: From 0 to live in 48 hours using Next.js & Google Gemini. Full walkthrough in video! 🚀 #buildinpublic #indiehackers #ai #developers",
      "Most devs get stuck in tutorial hell. Here's how to break out and ship real software fast. 💡 #coding #saas #nextjs",
    ],
    tone: "Energetic, educational, actionable",
    platform: "YouTube",
    wordCount: 310,
    estimatedDuration: "2m 23s",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryStore.scripts.push(mainScript);

  // 3. Ideas
  const ideas: IIdea[] = [
    {
      _id: generateId(),
      userId,
      projectId,
      title: "Why Cursor & Claude Are Changing Junior Dev Hiring",
      description: "Analyze the shifting requirements for junior software engineers in the AI era.",
      topic: "Tech Careers & AI",
      platform: "YouTube",
      status: "PLANNED",
      priority: "HIGH",
      targetAudience: "CS students & junior developers",
      contentType: "Deep-Dive Essay",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      _id: generateId(),
      userId,
      title: "3 Micro-SaaS Ideas You Can Build With Gemini Flash",
      description: "Specific niche problems in legal, fitness, and eCommerce that need quick AI agents.",
      topic: "Entrepreneurship",
      platform: "Instagram",
      status: "IDEA",
      priority: "MEDIUM",
      targetAudience: "Solopreneurs",
      contentType: "Reel / Carousel",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      _id: generateId(),
      userId,
      title: "The Death of Generic Cold Email (and What Replaces It)",
      description: "Case study showing why personalized AI-assisted research outconverts blast spam 8:1.",
      topic: "B2B Marketing",
      platform: "LinkedIn",
      status: "IN PRODUCTION",
      priority: "HIGH",
      targetAudience: "Founders & sales reps",
      contentType: "Text + Infographic",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      _id: generateId(),
      userId,
      title: "My Desk Setup For 4K Video Editing and Coding",
      description: "Tour of monitor arm, microphone, lighting, and cable management under $1,000.",
      topic: "Productivity Gear",
      platform: "TikTok",
      status: "PUBLISHED",
      priority: "LOW",
      targetAudience: "Remote workers & creators",
      contentType: "Short-form video",
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    },
  ];

  memoryStore.ideas.push(...ideas);

  // 4. Assets
  const assets: IAsset[] = [
    {
      _id: generateId(),
      userId,
      projectId,
      name: "Hero_B-Roll_Terminal_Screen.mp4",
      type: "video",
      url: "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-1728-large.mp4",
      size: 14200000, // 14.2 MB
      tags: ["b-roll", "terminal", "darkmode", "coding"],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      _id: generateId(),
      userId,
      projectId,
      name: "SaaS_Architecture_Diagram_V2.png",
      type: "image",
      url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
      size: 2400000,
      tags: ["diagram", "architecture", "infographic"],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      _id: generateId(),
      userId,
      projectId,
      name: "YouTube_Thumbnail_A_Testing.png",
      type: "thumbnail",
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
      size: 3800000,
      tags: ["thumbnail", "variant-a", "48h-badge"],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      _id: generateId(),
      userId,
      projectId,
      name: "LoFi_Upbeat_Background_Audio.mp3",
      type: "audio",
      url: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
      size: 5100000,
      tags: ["audio", "bgm", "copyright-free", "lofi"],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      _id: generateId(),
      userId,
      projectId,
      name: "Product_Launch_Checklist.pdf",
      type: "document",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      size: 420000,
      tags: ["notes", "checklist", "launch"],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ];

  memoryStore.assets.push(...assets);

  // 5. Clips
  const clips: IClip[] = [
    {
      _id: generateId(),
      userId,
      projectId,
      title: "The 48-Hour MVP Sprint Rule",
      startTime: 12,
      endTime: 58,
      hook: "90% of developers spend 6 months building an MVP nobody wants. Stop doing that.",
      caption: "Why spending more than 48 hours on your initial MVP is killing your momentum.",
      platform: "YouTube Shorts",
      reason: "High viewer retention spike, punchy opening hook, clear actionable takeaway.",
      matchedScriptSection: "HOOK & INTRODUCTION",
      status: "READY",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      _id: generateId(),
      userId,
      projectId,
      title: "Why You Don't Need Kubernetes for Your First 1,000 Users",
      startTime: 62,
      endTime: 114,
      hook: "If you are setting up Docker and K8s before getting your first customer, you are procrastinating.",
      caption: "Serverless beats DevOps complexity every single time when validating.",
      platform: "Instagram Reels",
      reason: "Contrarian opinion sparks high comments and debate in tech communities.",
      matchedScriptSection: "SECTION 1: THE CORE ARCHITECTURE",
      status: "SUGGESTED",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      _id: generateId(),
      userId,
      projectId,
      title: "How to Stop AI Hallucinations in Production",
      startTime: 120,
      endTime: 175,
      hook: "The exact structured output trick that eliminated 99% of our schema breakages.",
      caption: "Don't let prompt drift break your frontend. Enforce rigid JSON types.",
      platform: "TikTok",
      reason: "Deep educational value, highly bookmarkable for developers.",
      matchedScriptSection: "SECTION 2: PROMPTING FOR PRODUCTION",
      status: "EXPORTED",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      _id: generateId(),
      userId,
      projectId,
      title: "The Zero-Dollar Launch Playbook",
      startTime: 180,
      endTime: 235,
      hook: "I spent $0 on ads and got 500 active users in 48 hours.",
      caption: "Building in public will always outperform traditional cold outreach.",
      platform: "LinkedIn",
      reason: "Appeals to B2B founders and operators looking for organic acquisition channels.",
      matchedScriptSection: "SECTION 3: ZERO-DOLLAR LAUNCH PLAYBOOK",
      status: "READY",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  memoryStore.clips.push(...clips);

  // 6. Repurposed Content
  const repurposed: IRepurposedContent[] = [
    {
      _id: generateId(),
      userId,
      projectId,
      sourceType: "Script",
      platform: "Instagram",
      title: "48-Hour AI App Carousel",
      hook: "How to ship an AI MVP before Monday morning ⚡",
      content: `Slide 1: How I Built My First AI App in 48 Hours
Slide 2: Rule #1 - Solve One Narrow Friction Point
Slide 3: Rule #2 - Zero DevOps (Next.js + Serverless API)
Slide 4: Rule #3 - Force Structured JSON Output from Gemini
Slide 5: Rule #4 - Launch in Public With Live Telemetry
Save this post for your next hackathon! 📌`,
      caption: "Stop over-engineering your ideas. The market only validates shipped software. Link in bio for the complete build guide.",
      cta: "Drop 'BUILD' in the comments for the template repo!",
      hashtags: ["#techfounder", "#softwareengineering", "#ai", "#indiehackers", "#nextjs"],
      createdAt: new Date(),
    },
    {
      _id: generateId(),
      userId,
      projectId,
      sourceType: "Script",
      platform: "LinkedIn",
      title: "The 48h Engineering Framework",
      hook: "Most founders spend 6 months building an MVP. Here is why you should limit it to 48 hours:",
      content: `Last weekend, I gave myself a strict 48-hour deadline:
From a blank VS Code window to a live AI SaaS with active users.

Here were the 3 non-negotiable rules:

1. Single Stack Constraint: Next.js + Serverless + Gemini API. Zero custom microservices.
2. Structured Generation: Strict schema validation to prevent hallucinations before they touch the UI.
3. Build in Public: Sharing the commit log publicly generated our first 500 users organically.

Speed is not just an execution speed metric — it is a risk mitigation strategy. When you ship in 48 hours, failure costs a weekend, not your life savings.`,
      cta: "Have you ever set a strict deadline on an MVP? What did you cut to make it ship?",
      hashtags: ["#startups", "#softwaredevelopment", "#artificialintelligence", "#productmanagement"],
      createdAt: new Date(),
    },
    {
      _id: generateId(),
      userId,
      projectId,
      sourceType: "Script",
      platform: "YouTube",
      title: "YouTube Video Description & Chapters",
      hook: "Learn how to build and launch a production AI SaaS in 48 hours.",
      content: `In this complete walkthrough, we build an intelligent AI app from scratch using Next.js and Google Gemini.

CHAPTERS:
00:00 - The 48-Hour Constraint
01:15 - Architecture & Stack Selection
04:30 - Gemini API Integration & Structured Outputs
08:20 - Polished Dark SaaS UI in Tailwind
12:45 - Live Vercel Deployment
15:10 - First 500 Users Breakdown

RESOURCES & CODE:
GitHub: https://github.com/example/ai-creator-os
Documentation: https://creatorai.dev`,
      chapters: [
        { time: "00:00", title: "The 48-Hour Constraint" },
        { time: "01:15", title: "Architecture & Stack Selection" },
        { time: "04:30", title: "Gemini API Integration" },
        { time: "08:20", title: "Polished SaaS UI" },
        { time: "12:45", title: "Live Vercel Deployment" },
        { time: "15:10", title: "First 500 Users Breakdown" },
      ],
      createdAt: new Date(),
    },
    {
      _id: generateId(),
      userId,
      projectId,
      sourceType: "Script",
      platform: "X",
      title: "10-Tweet Launch Thread",
      hook: "I spent 48 hours coding an AI SaaS from scratch. It just hit 500 active users. Here's the entire raw playbook (steal this): 🧵👇",
      content: `1/ Most builders spend weeks writing boilerplate authentication and configuring databases.
Use battle-tested templates so day 1 is 100% focused on core value.

2/ The biggest trap in AI apps is unstructured outputs. 
Always enforce JSON schema mode on your Gemini calls. It prevents frontend UI crashes.

3/ Do not hide in stealth. 
Tweet your bugs, your latency graphs, and your milestone screenshots. People root for honest builders.

4/ Full code and setup instructions are open-source. Retweet to help another indie hacker ship this weekend!`,
      cta: "Follow @creatorai for more build in public breakdowns.",
      hashtags: ["#buildinpublic", "#ai", "#indiehackers"],
      createdAt: new Date(),
    },
  ];

  memoryStore.repurposed.push(...repurposed);

  // 7. Analytics
  const analytics: IAnalytics[] = [
    {
      _id: generateId(),
      userId,
      projectId,
      platform: "YouTube",
      views: 48200,
      likes: 3840,
      comments: 412,
      shares: 680,
      engagement: 10.2,
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      _id: generateId(),
      userId,
      projectId,
      platform: "Instagram",
      views: 31500,
      likes: 2450,
      comments: 189,
      shares: 920,
      engagement: 11.3,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      _id: generateId(),
      userId,
      projectId,
      platform: "LinkedIn",
      views: 18900,
      likes: 1420,
      comments: 310,
      shares: 240,
      engagement: 10.4,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      _id: generateId(),
      userId,
      projectId,
      platform: "TikTok",
      views: 64000,
      likes: 5800,
      comments: 320,
      shares: 1400,
      engagement: 11.7,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  memoryStore.analytics.push(...analytics);

  return { projectId, scriptId };
}
