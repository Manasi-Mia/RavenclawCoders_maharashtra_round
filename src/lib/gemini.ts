import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateWithFallback } from "@/lib/gemini-model";

function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  try {
    return new GoogleGenerativeAI(apiKey);
  } catch (err) {
    console.error("Failed to initialize GoogleGenerativeAI:", err);
    return null;
  }
}

export function isGeminiConfigured(): boolean {
  const apiKey = getGeminiApiKey();
  return Boolean(apiKey && apiKey.length > 5);
}

// 1. GENERATE IDEAS
export interface GenerateIdeasParams {
  topic: string;
  targetAudience?: string;
  platform?: string;
  contentStyle?: string;
  creatorType?: string;
  specializations?: string[];
}

export interface GeneratedIdea {
  title: string;
  description: string;
  topic: string;
  platform: "YouTube" | "Instagram" | "TikTok" | "LinkedIn" | "Multi-Platform";
  priority: "LOW" | "MEDIUM" | "HIGH";
  contentType: string;
  targetAudience: string;
}

export async function generateIdeas(params: GenerateIdeasParams): Promise<GeneratedIdea[]> {
  const client = getGeminiClient();
  const prompt = `You are an elite YouTube & social media growth strategist.
Generate 5 high-converting, viral-potential content ideas for a creator.

Creator Profile:
- Creator Persona: ${params.creatorType || "Digital Video Creator"}
${params.specializations?.length ? `- Niches/Specializations: ${params.specializations.join(", ")}` : ""}

Parameters:
- Topic: ${params.topic}
- Target Audience: ${params.targetAudience || "General tech and productivity enthusiasts"}
- Preferred Platform: ${params.platform || "YouTube"}
- Content Style: ${params.contentStyle || "Engaging, high-value, actionable"}

Return ONLY a JSON array with objects in this exact shape:
[
  {
    "title": "Clear punchy title",
    "description": "2-sentence premise explaining why this works",
    "topic": "${params.topic}",
    "platform": "${params.platform || "YouTube"}",
    "priority": "HIGH" | "MEDIUM" | "LOW",
    "contentType": "Video" | "Reel" | "Shorts" | "Post",
    "targetAudience": "${params.targetAudience || "General"}"
  }
]
`;

  if (client) {
    const result = await generateWithFallback(client, prompt);
    const text = result.response.text();
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    throw new Error("Invalid ideas response format from Gemini model");
  }

  // Intelligent fallback ideas based on input topic
  const topic = params.topic || "AI Content Creation";
  const plat = (params.platform || "YouTube") as GeneratedIdea["platform"];
  return [
    {
      title: `The 10-Minute Playbook: Mastering ${topic} in 2026`,
      description: `A no-fluff masterclass breaking down the essential workflows of ${topic} with live screen shares and case studies.`,
      topic,
      platform: plat,
      priority: "HIGH",
      contentType: "Deep-Dive Video",
      targetAudience: params.targetAudience || "Modern creators & builders",
    },
    {
      title: `Why 90% of Creators Fail at ${topic} (And How to Fix It)`,
      description: `Expose common misconceptions and reveal the 3 counter-intuitive habits that top 1% creators use to stand out.`,
      topic,
      platform: plat,
      priority: "HIGH",
      contentType: "Case Study Breakdown",
      targetAudience: params.targetAudience || "Intermediate practitioners",
    },
    {
      title: `3 Free Tools for ${topic} That Feel Illegal to Know`,
      description: `Rapid-fire showcase of cutting-edge utilities that 5x your production speed without expensive subscriptions.`,
      topic,
      platform: plat === "LinkedIn" ? "LinkedIn" : "Instagram",
      priority: "MEDIUM",
      contentType: "Short-form Reel",
      targetAudience: params.targetAudience || "Budget-conscious solopreneurs",
    },
    {
      title: `I Tested Every ${topic} Strategy for 30 Days (Real Results)`,
      description: `Data-driven experiment comparing different approaches, showing retention charts, conversion metrics, and key lessons.`,
      topic,
      platform: plat,
      priority: "HIGH",
      contentType: "Experiment Video",
      targetAudience: params.targetAudience || "Data-focused creators",
    },
    {
      title: `The Future of ${topic}: What Nobody is Talking About`,
      description: `Forward-looking trend analysis discussing technological shifts, algorithm changes, and monetization opportunities.`,
      topic,
      platform: "LinkedIn",
      priority: "MEDIUM",
      contentType: "Thought Leadership Post",
      targetAudience: params.targetAudience || "Founders and industry leaders",
    },
  ];
}

// 2. GENERATE SCRIPT VARIANTS & 4 ANGLES
export type ScriptAngle =
  | "Story-driven"
  | "Educational / how-to"
  | "Bold / contrarian take"
  | "Fast-paced listicle";

export interface ScriptVariant {
  angle: ScriptAngle;
  title: string;
  script: string;
  hooks: string[];
  titles: string[];
  captions: string[];
  hashtags: string[];
  wordCount: number;
  estimatedDuration: string;
}

export interface GenerateScriptParams {
  topic: string;
  targetAudience?: string;
  platform?: string;
  tone?: string;
  duration?: string;
  contentType?: string;
  creatorType?: string;
  specializations?: string[];
  singleVariantAngle?: ScriptAngle;
}

export interface GeneratedScriptResponse {
  title: string;
  script: string;
  hooks: string[];
  titles: string[];
  captions: string[];
  hashtags: string[];
}

export class BadAiResponseError extends Error {
  readonly code = "AI_BAD_RESPONSE";
  constructor(message = "The AI returned an unreadable response. Please try again.") {
    super(message);
    this.name = "BadAiResponseError";
  }
}

export async function generateScriptVariants(
  params: GenerateScriptParams
): Promise<ScriptVariant[]> {
  const client = getGeminiClient();
  const creatorContext = `
- Creator Persona: ${params.creatorType || "Digital Video Creator"}
${params.specializations?.length ? `- Niches/Specializations: ${params.specializations.join(", ")}` : ""}
`;

  const singleAngle = params.singleVariantAngle;
  const prompt = singleAngle
    ? `You are an elite video screenwriter and content creator strategist.
Creator Profile:
${creatorContext}

Generate ONE high-retention video script for:
- Topic: "${params.topic}"
- Target Audience: ${params.targetAudience || "Broad creator audience"}
- Platform: ${params.platform || "YouTube"}
- Tone: ${params.tone || "Engaging, authoritative, energetic"}
- Target Duration: ${params.duration || "2-4 minutes"}
- Required Story Angle: "${singleAngle}"

Requirements:
1. Script must include: [SCENE START], scene directions in parentheses, spoken dialogue, pattern interrupts, and [CALL TO ACTION].
2. Provide 4 hooks, 4 titles, 2 captions, 5 hashtags.
3. Calculate wordCount and estimatedDuration (e.g. "2m 15s").

Return ONLY a valid JSON array containing exactly ONE object matching:
[
  {
    "angle": "${singleAngle}",
    "title": "Title here",
    "script": "Full script here...",
    "hooks": ["Hook 1", "Hook 2", "Hook 3", "Hook 4"],
    "titles": ["Title 1", "Title 2", "Title 3", "Title 4"],
    "captions": ["Caption 1", "Caption 2"],
    "hashtags": ["#tag1", "#tag2", "#tag3"],
    "wordCount": 290,
    "estimatedDuration": "2m 15s"
  }
]`
    : `You are an elite video screenwriter and viral content strategist.
Creator Profile:
${creatorContext}

Generate 4 high-retention video script variants for:
- Topic: "${params.topic}"
- Target Audience: ${params.targetAudience || "Broad creator audience"}
- Platform: ${params.platform || "YouTube"}
- Tone: ${params.tone || "Engaging, authoritative, energetic"}
- Target Duration: ${params.duration || "2-4 minutes"}

You MUST generate exactly 4 distinct variants in ONE JSON array, each approaching the topic from a completely different storytelling angle:
1. "Story-driven": Personal narrative, tension, conflict, climax, resolution, emotional vulnerability.
2. "Educational / how-to": Step-by-step framework, actionable tactics, zero fluff, clear demonstrations.
3. "Bold / contrarian take": Challenges common consensus, exposes misconceptions, strong thesis, pattern interrupt.
4. "Fast-paced listicle": Rapid-fire 3-5 punchy points, high-energy pacing, visual cuts, high retention.

For EACH of the 4 variants provide:
- angle: exactly one of "Story-driven" | "Educational / how-to" | "Bold / contrarian take" | "Fast-paced listicle"
- title: punchy high-CTR title
- script: complete script with [SCENE START], visual directions, dialogue, and [CALL TO ACTION]
- hooks: 4 distinct opening hooks
- titles: 4 title options
- captions: 2 social captions
- hashtags: 4-5 relevant hashtags
- wordCount: number of words
- estimatedDuration: formatted string like "2m 15s"

Return ONLY a valid JSON array of 4 objects.`;

  if (client) {
    const result = await generateWithFallback(client, prompt, {
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      },
    });
    const text = result.response.text().trim();
    if (!text) {
      throw new BadAiResponseError("Empty AI response received.");
    }

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // 1. Strip ```json code fences
      const cleaned = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // 2. Extract first [...] block
        const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (arrayMatch) {
          try {
            parsed = JSON.parse(arrayMatch[0]);
          } catch {
            // continue
          }
        }
        // 3. Or extract single {...} block wrapped in an array
        if (!parsed) {
          const objectMatch = text.match(/\{[\s\S]*\}/);
          if (objectMatch) {
            try {
              const singleObj = JSON.parse(objectMatch[0]);
              parsed = [singleObj];
            } catch {
              // continue
            }
          }
        }
      }
    }

    if (!parsed) {
      throw new BadAiResponseError();
    }

    const rawList: unknown[] = Array.isArray(parsed)
      ? parsed
      : typeof parsed === "object"
      ? [parsed]
      : [];

    const validVariants: ScriptVariant[] = [];
    for (const v of rawList) {
      if (!v || typeof v !== "object") continue;
      const item = v as Record<string, unknown>;
      const scriptStr = typeof item.script === "string" ? item.script.trim() : "";
      if (!scriptStr) continue; // drop variants with an empty script

      const titleStr =
        typeof item.title === "string" && item.title.trim()
          ? item.title.trim()
          : `Mastering ${params.topic}`;

      const hooks = Array.isArray(item.hooks)
        ? item.hooks.filter((h): h is string => typeof h === "string" && h.trim().length > 0)
        : [];

      const titles = Array.isArray(item.titles)
        ? item.titles.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
        : [];

      const captions = Array.isArray(item.captions)
        ? item.captions.filter((c): c is string => typeof c === "string" && c.trim().length > 0)
        : [];

      const hashtags = Array.isArray(item.hashtags)
        ? item.hashtags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
        : ["#creator", "#growth"];

      const wordCount =
        typeof item.wordCount === "number" && item.wordCount > 0
          ? item.wordCount
          : scriptStr.split(/\s+/).filter(Boolean).length;

      const estimatedDuration =
        typeof item.estimatedDuration === "string" && item.estimatedDuration.trim()
          ? item.estimatedDuration.trim()
          : "2m 30s";

      const angle = (typeof item.angle === "string" && item.angle
        ? item.angle
        : singleAngle || "Story-driven") as ScriptAngle;

      validVariants.push({
        angle,
        title: titleStr,
        script: scriptStr,
        hooks,
        titles,
        captions,
        hashtags: hashtags.length > 0 ? hashtags : ["#creator", "#growth"],
        wordCount,
        estimatedDuration,
      });
    }

    if (validVariants.length === 0) {
      throw new BadAiResponseError();
    }

    // For single-variant regeneration keep the existing behavior (one object)
    if (singleAngle) {
      return [validVariants[0]];
    }

    // If the full request returns fewer than 4 valid variants, return what is valid (at least 1) instead of failing
    return validVariants;
  }

  return getFallbackScriptVariants(params);
}

function getFallbackScriptVariants(params: GenerateScriptParams): ScriptVariant[] {
  const topic = params.topic || "AI Video Production";
  const duration = params.duration || "2m 30s";

  const allVariants: ScriptVariant[] = [
    {
      angle: "Story-driven",
      title: `How I Changed My Entire Approach to ${topic}`,
      script: `[SCENE START]
(Camera: Close-up, reflective lighting, quiet room ambience)

HOOK:
"Two years ago, I almost burned out completely trying to keep up with ${topic}. Here is the single realization that saved my creative business."

(Visual: Cut to archive montage of sleepless nights, messy timelines, and endless revisions)

THE CONFLICT:
I was doing what every creator is told to do: work 80 hours a week, post every single day, and manually polish every second.
The result? My views plateaued, and I hated the process.

THE TURNING POINT:
Then, last October, I decided to test a radical rule: What if every single workflow for ${topic} had to be automated or eliminated?

[SCENE 2: THE NEW SYSTEM]
(Visual: Fast screen recording showing streamlined workspace)
I stripped away 90% of the manual busywork and focused solely on high-leverage storytelling.
Within 30 days, retention jumped by 45%, and production time dropped by half.

[CALL TO ACTION]
"If you feel trapped on the content treadmill, drop a comment with your biggest roadblock in ${topic}. Let's build a smarter system together."
[SCENE END]`,
      hooks: [
        `Two years ago, I almost quit ${topic} forever. Here is what changed.`,
        `The biggest mistake I made in my first 1,000 hours of ${topic}.`,
        `I spent $5,000 learning this lesson about ${topic} so you don't have to.`,
        `Why hitting rock bottom with ${topic} was the best thing that ever happened to me.`,
      ],
      titles: [
        `How I Changed My Entire Approach to ${topic}`,
        `The Hard Truth About ${topic} Nobody Talks About`,
        `My ${topic} Journey: From Burnout to 10x Output`,
        `I Tested Everything in ${topic} — Here's the Real Story`,
      ],
      captions: [
        `The real secret to sustainable output isn't working harder. Here's my honest story with ${topic}. #creator #authenticity #growth`,
        `Burnout taught me more about ${topic} than 100 tutorials ever could. Full story in video! 💡 #solopreneur`,
      ],
      hashtags: ["#storytelling", "#creatorlife", "#growth", "#productivity"],
      wordCount: 245,
      estimatedDuration: duration,
    },
    {
      angle: "Educational / how-to",
      title: `The 3-Step Blueprint for ${topic} in 2026`,
      script: `[SCENE START]
(Camera: High energy, well-lit studio, dynamic screen-in-screen)

HOOK:
"If you are still doing ${topic} manually, you are wasting 80% of your time. Here is the step-by-step masterclass to execute it like a top 1% creator."

(Visual: 3-step numbered roadmap graphic on screen)

STEP 1: THE FOUNDATION
Never start from scratch. Define your target audience and core hypothesis before opening your editor.

STEP 2: THE EXECUTION FRAMEWORK
(Visual: Live screen capture demonstrating the exact workflow)
Batch your inputs. Write your hook first, structure three actionable points, and use visual pattern interrupts every 8 seconds.

STEP 3: MULTI-PLATFORM DISTRIBUTION
Turn this primary video into 4 short-form clips, 1 carousel, and 1 newsletter.

[CALL TO ACTION]
"Save this video for your next production day, and hit subscribe for weekly creator playbooks!"
[SCENE END]`,
      hooks: [
        `The exact 3-step framework top creators use for ${topic}.`,
        `Master ${topic} in under 3 minutes with this exact framework.`,
        `Stop guessing with ${topic}. Here is the complete step-by-step blueprint.`,
        `The step-by-step tutorial I wish I had when I started ${topic}.`,
      ],
      titles: [
        `The 3-Step Blueprint for ${topic} in 2026`,
        `How to Master ${topic} (Complete Step-by-Step Guide)`,
        `${topic} Explained in 3 Minutes: Beginner to Pro`,
        `The Only ${topic} Tutorial You Will Ever Need`,
      ],
      captions: [
        `A zero-fluff breakdown on how to master ${topic} this week. Tap to watch the full tutorial! 🚀 #education #tutorial`,
        `Bookmark this 3-step playbook for ${topic}. Link in bio for the complete template! 📌 #creator`,
      ],
      hashtags: ["#tutorial", "#howto", "#productivity", "#education"],
      wordCount: 220,
      estimatedDuration: duration,
    },
    {
      angle: "Bold / contrarian take",
      title: `Why Everything You've Been Told About ${topic} Is Wrong`,
      script: `[SCENE START]
(Camera: Slow zoom-in, direct to lens, intense focus)

HOOK:
"95% of people teaching ${topic} are repeating advice from 2020 that simply does not work anymore. Here is the uncomfortable truth."

(Visual: Red 'X' graphics crossing out common outdated tactics)

THE CONTROVERSIAL REALITY:
Most gurus tell you to spend hours obsessing over vanity metrics and camera gear.
In reality? Modern audiences swipe away if your first 3 seconds don't challenge their worldview.

THE PROOF:
Look at the retention curve of traditional videos versus pattern-interrupt narratives.
When you challenge consensus early, retention spikes by over 60%.

[CALL TO ACTION]
"Do you agree with this take or do you think I'm completely wrong? Drop your hottest take in the comments below!"
[SCENE END]`,
      hooks: [
        `Why everything you have been told about ${topic} is completely backwards.`,
        `Stop listening to outdated advice on ${topic}. Here is why.`,
        `The uncomfortable truth about ${topic} that most gurus hide.`,
        `Why 95% of creators fail at ${topic} before they even start.`,
      ],
      titles: [
        `Why Everything You've Been Told About ${topic} Is Wrong`,
        `The Death of Traditional ${topic} (And What Replaces It)`,
        `Stop Doing ${topic} Like This in 2026`,
        `The Uncomfortable Truth About ${topic}`,
      ],
      captions: [
        `Most creators are still following advice from 2020. Here is why it is hurting your reach on ${topic}. 🔥 #contrarian #creator`,
        `Hot take: You are over-engineering ${topic}. Tell me if you agree in the comments! 👇 #debate`,
      ],
      hashtags: ["#hottake", "#debate", "#contrarian", "#insights"],
      wordCount: 195,
      estimatedDuration: duration,
    },
    {
      angle: "Fast-paced listicle",
      title: `4 Game-Changing Hacks for ${topic} You Need Today`,
      script: `[SCENE START]
(Camera: Quick cuts, upbeat Lo-Fi audio, energetic delivery)

HOOK:
"4 rapid-fire secrets for ${topic} that will save you 10 hours this week. Number 3 feels almost illegal to know."

#1: THE 3-SECOND RULE
Cut the introductory fluff. Start right in the middle of the action.

#2: THE REPURPOSING STACK
One script should equal 5 platform assets. Never write once for just one destination.

#3: STRUCTURED HOOK FORMULAS
Use curiosity gaps with concrete numbers to double your click-through rate.

#4: THE 48-HOUR SPRINT
If your production takes more than 48 hours, trim your scope. Momentum beats perfection.

[CALL TO ACTION]
"Which of these 4 will you try first? Like and follow for daily creator systems!"
[SCENE END]`,
      hooks: [
        `4 game-changing hacks for ${topic} you need to know today.`,
        `3 secrets about ${topic} that top 1% creators keep to themselves.`,
        `Steal these 4 hacks to 5x your output on ${topic}.`,
        `Quick fire: The 4 best tools and strategies for ${topic} right now.`,
      ],
      titles: [
        `4 Game-Changing Hacks for ${topic} You Need Today`,
        `The 4 Best Kept Secrets in ${topic}`,
        `4 Quick Ways to 10x Your Output on ${topic}`,
        `Stop Scrolling: 4 ${topic} Hacks You Can Use Right Now`,
      ],
      captions: [
        `4 rapid-fire hacks for ${topic} to supercharge your workflow today! ⚡ Save this post for later. #tips #productivity`,
        `Which of these 4 ${topic} tips are you using in your next project? Drop a number below! 🚀 #creator`,
      ],
      hashtags: ["#tips", "#shortcuts", "#hacks", "#creatorsecrets"],
      wordCount: 185,
      estimatedDuration: duration,
    },
  ];

  if (params.singleVariantAngle) {
    const matched = allVariants.filter((v) => v.angle === params.singleVariantAngle);
    return matched.length > 0 ? matched : [allVariants[0]];
  }

  return allVariants;
}

export async function generateScript(
  params: GenerateScriptParams
): Promise<GeneratedScriptResponse> {
  const variants = await generateScriptVariants(params);
  const primary = variants[0];
  return {
    title: primary.title,
    script: primary.script,
    hooks: primary.hooks,
    titles: primary.titles,
    captions: primary.captions,
    hashtags: primary.hashtags,
  };
}

// 3. GENERATE ALTERNATIVE HOOKS
export async function generateHooks(
  topic: string,
  platform = "YouTube",
  count = 6,
  creatorType?: string,
  specializations?: string[]
): Promise<string[]> {
  const client = getGeminiClient();
  const creatorContext = `
${creatorType ? `- Creator Persona: ${creatorType}` : ""}
${specializations?.length ? `- Niches/Specializations: ${specializations.join(", ")}` : ""}
`;
  const prompt = `Generate ${count} compelling, psychology-backed video hooks for ${platform} about: "${topic}".
${creatorContext.trim() ? `Creator Context:${creatorContext}` : ""}
Include diverse angles: curiosity gap, bold statement, contrarian take, numbers/metrics, relatability, urgency.
Return ONLY a JSON array of strings: ["Hook 1", "Hook 2", ...]`;

  if (client) {
    const result = await generateWithFallback(client, prompt);
    const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    throw new Error("Invalid hooks response format from Gemini model");
  }

  return [
    `The one mistake 95% of people make when approaching ${topic}.`,
    `I spent 100 hours researching ${topic} so you can understand it in 3 minutes.`,
    `Stop scrolling if you want to actually master ${topic} this year.`,
    `Why everything you've been told about ${topic} is completely backwards.`,
    `Here is the exact step-by-step secret behind high-performing ${topic}.`,
    `If you can only do one thing to improve your ${topic}, make it this.`,
  ];
}

// 4. SCRIPT ASSISTANT (INLINE IMPROVEMENTS)
export interface ScriptAssistParams {
  action:
    | "improve_hook"
    | "make_shorter"
    | "more_engaging"
    | "simplify"
    | "add_cta"
    | "generate_transition"
    | "change_tone";
  selectedText?: string;
  fullScript: string;
  instruction?: string;
}

export async function assistScriptEditing(params: ScriptAssistParams): Promise<string> {
  const client = getGeminiClient();
  const targetText = params.selectedText || params.fullScript;

  const prompt = `You are an expert video script doctor.
Action requested: "${params.action}"
${params.instruction ? `Specific custom instruction: "${params.instruction}"` : ""}

Target script segment:
"""
${targetText}
"""

Full context script:
"""
${params.fullScript.slice(0, 1500)}
"""

Please rewrite or improve the target segment according to the action requested.
Maintain natural spoken dialogue, high audience retention, and clear visual/audio pacing.
Return ONLY the revised script text without meta commentary.`;

  if (client) {
    const result = await generateWithFallback(client, prompt);
    const text = result.response.text().trim();
    if (text) return text;
    throw new Error("Empty response received from Gemini script assistant");
  }

  // Fallback modifications
  switch (params.action) {
    case "improve_hook":
      return `HOOK (High-Retention Revised):
"Before you waste another hour on this, listen closely: 90% of people get this completely wrong. Here is the single shift that changes everything."\n\n${targetText}`;
    case "make_shorter":
      return targetText
        .split("\n")
        .filter((line) => line.trim().length > 0 && !line.includes("filler"))
        .slice(0, Math.ceil(targetText.split("\n").length * 0.7))
        .join("\n");
    case "more_engaging":
      return `(Quick Zoom In — Direct to Camera)\n"Here's the raw truth: Most creators overthink this."\n${targetText}\n(Fast B-Roll cut demonstrating key result)`;
    case "add_cta":
      return `${targetText}\n\n[CALL TO ACTION]\n"If you found this valuable, hit subscribe and grab the free cheat sheet linked below. Let me know your thoughts in the comments!"`;
    case "simplify":
      return targetText.replace(/complicated|exhaustive|infrastructure/gi, "simple");
    default:
      return targetText;
  }
}

// 5. CONTENT REPURPOSING
export interface RepurposeParams {
  sourceText: string;
  sourceType: "Script" | "Video Transcript" | "Existing Post" | "Podcast";
  creatorType?: string;
  specializations?: string[];
}

export interface RepurposeResult {
  instagram: {
    hook: string;
    caption: string;
    carouselSlides: string[];
    cta: string;
  };
  youtube: {
    title: string;
    description: string;
    chapters: { time: string; title: string }[];
    pinnedComment: string;
  };
  linkedin: {
    hook: string;
    post: string;
    cta: string;
    hashtags: string[];
  };
  x: {
    thread: string[];
    hookTweet: string;
  };
  shortForm: {
    hook: string;
    script: string;
    caption: string;
    cta: string;
  };
}

export async function repurposeContent(params: RepurposeParams): Promise<RepurposeResult> {
  const client = getGeminiClient();
  const creatorContext = `
${params.creatorType ? `- Creator Persona: ${params.creatorType}` : ""}
${params.specializations?.length ? `- Niches/Specializations: ${params.specializations.join(", ")}` : ""}
`;
  const prompt = `You are a world-class multi-platform content strategist.
Transform this source ${params.sourceType} into native, platform-optimized formats for Instagram, YouTube, LinkedIn, X (Twitter), and Short-form video (TikTok/Reels/Shorts).
${creatorContext.trim() ? `Creator Profile Context:\n${creatorContext}` : ""}

Source text:
"""
${params.sourceText.slice(0, 3000)}
"""

Format guidelines:
- Instagram: Punchy Reel hook, carousel outline (4-6 slides), engaging caption with CTA.
- YouTube: High-CTR title, rich SEO description, timestamped chapters, suggested pinned comment.
- LinkedIn: Clean line breaks, high-retention opening line, business/founder angle, professional CTA.
- X: 4-5 tweet punchy thread with strong hook tweet.
- Short-form: 45-second vertical script with audio cues and hook.

Return ONLY a valid JSON object matching this exact structure:
{
  "instagram": {
    "hook": "...",
    "caption": "...",
    "carouselSlides": ["Slide 1...", "Slide 2..."],
    "cta": "..."
  },
  "youtube": {
    "title": "...",
    "description": "...",
    "chapters": [{"time": "00:00", "title": "..."}, {"time": "01:30", "title": "..."}],
    "pinnedComment": "..."
  },
  "linkedin": {
    "hook": "...",
    "post": "...",
    "cta": "...",
    "hashtags": ["#tag1", "#tag2"]
  },
  "x": {
    "hookTweet": "...",
    "thread": ["Tweet 1", "Tweet 2", "Tweet 3", "Tweet 4"]
  },
  "shortForm": {
    "hook": "...",
    "script": "...",
    "caption": "...",
    "cta": "..."
  }
}`;

  if (client) {
    const result = await generateWithFallback(client, prompt);
    const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);
    if (parsed.instagram && parsed.linkedin && parsed.youtube) {
      return parsed;
    }
    throw new Error("Invalid repurposed content format from Gemini model");
  }

  // High quality fallback
  const firstLine = params.sourceText.split("\n")[0] || "Content Mastery";
  return {
    instagram: {
      hook: "Save this before your next content batch 📌",
      caption: `We took our top workflow breakdown and packaged it into a clean blueprint you can execute in under 15 minutes.\n\nSwipe through for the exact step-by-step breakdown 👉\n\nDrop a comment with 'WORKFLOW' and we'll DM you the Notion template!`,
      carouselSlides: [
        `Slide 1: ${firstLine}`,
        "Slide 2: Step 1 — Define your primary outcome before opening the editor.",
        "Slide 3: Step 2 — Remove 30% of unnecessary filler words to protect retention.",
        "Slide 4: Step 3 — Build a repeatable distribution loop across all channels.",
        "Slide 5: Summary — Consistency compounds when systems remove friction.",
      ],
      cta: "Double tap if you want more behind-the-scenes breakdowns!",
    },
    youtube: {
      title: `${firstLine.replace(/["']/g, "")} (Complete Walkthrough)`,
      description: `In this video, we dive deep into how to build a scalable content engine without burning out.\n\nTimestamps:\n00:00 - The Core Dilemma\n01:20 - Framework Breakdown\n03:45 - Live Execution & Examples\n06:10 - Common Mistakes to Avoid\n08:30 - Final Action Plan`,
      chapters: [
        { time: "00:00", title: "The Core Dilemma" },
        { time: "01:20", title: "Framework Breakdown" },
        { time: "03:45", title: "Live Execution & Examples" },
        { time: "06:10", title: "Common Mistakes to Avoid" },
        { time: "08:30", title: "Final Action Plan" },
      ],
      pinnedComment: "What was your biggest takeaway from today's video? Let me know below and I'll jump in to reply!",
    },
    linkedin: {
      hook: "Most creators make the mistake of creating 10 different ideas for 10 different platforms.\n\nHere is what the top 1% do instead:",
      post: `Instead of reinventing the wheel every morning:

1. Create one high-intent master asset.
2. Extract the core insight for professional discussions.
3. Share the numbers, failures, and actual execution data.

When you communicate with clarity and transparency, your audience doesn't just read — they convert.

Speed is the ultimate competitive advantage for modern digital operators.`,
      cta: "How do you handle your weekly content repurposing? Let's discuss in the comments.",
      hashtags: ["#contentstrategy", "#creatoreconomy", "#productivity", "#leadership"],
    },
    x: {
      hookTweet: `I spent months testing how to repurpose content without sounding like an AI bot.\n\nHere's the exact framework that generates 50k+ monthly impressions (steal this) 🧵👇`,
      thread: [
        "1/ Never cross-post the exact same caption. Every platform has its own native language and pacing.",
        "2/ LinkedIn wants founder context and business impact. X wants punchy, opinionated soundbites. YouTube Shorts wants immediate visual payoffs.",
        "3/ Extract 3-5 distinct hooks from every 5-minute video you record. One of them will always outperform the rest by 10x.",
        "4/ Turn your best performing comments into your next video topics. Your audience is literally telling you what they want next.",
      ],
    },
    shortForm: {
      hook: "Here's what nobody tells you about content scaling:",
      script: `(High energy)
"Stop starting from scratch every Monday!
Take your best piece of writing, find the most controversial sentence, and put it on camera in the first 2 seconds.
That single tweak increased our retention by 42%. Try it today!"`,
      caption: "The secret to 10x content output isn't working 10x more hours. It's repurposing with intent. ⚡ #creator #shorts #tips",
      cta: "Follow for daily creator operating systems!",
    },
  };
}

// 6. VIDEO TRANSCRIPT INTELLIGENCE & CLIP CANDIDATES
export interface TranscriptAnalysisParams {
  transcript: string;
  script?: string;
}

export interface ClipCandidate {
  title: string;
  startTime: number;
  endTime: number;
  hook: string;
  caption: string;
  platform: "Instagram Reels" | "YouTube Shorts" | "TikTok" | "LinkedIn";
  reason: string;
  matchedScriptSection: string;
}

export async function analyzeTranscriptForClips(params: TranscriptAnalysisParams): Promise<ClipCandidate[]> {
  const client = getGeminiClient();
  const prompt = `You are an elite short-form video editor and retention scientist.
Analyze the following transcript and identify high-performing 30-60 second short-form clip candidates.

Transcript text:
"""
${params.transcript.slice(0, 3000)}
"""

${params.script ? `Associated Script for keyword matching:\n"""\n${params.script.slice(0, 1500)}\n"""` : ""}

Find 3 to 4 viral moment candidates based on:
- High energy hooks
- Contrarian opinions or bold statements
- Clear actionable tips or aha moments
- High retention emotional spikes

Return ONLY a JSON array of objects:
[
  {
    "title": "Short descriptive clip title",
    "startTime": 15,
    "endTime": 55,
    "hook": "Exact spoken or visual hook",
    "caption": "Platform-ready caption with hashtags",
    "platform": "YouTube Shorts" | "Instagram Reels" | "TikTok" | "LinkedIn",
    "reason": "Why this section will retain viewers",
    "matchedScriptSection": "Script section reference"
  }
]`;

  if (client) {
    const result = await generateWithFallback(client, prompt);
    const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    throw new Error("Invalid clip analysis response format from Gemini model");
  }

  // Intelligent fallback candidates
  return [
    {
      title: "The #1 Bottleneck in Content Creation",
      startTime: 14,
      endTime: 52,
      hook: "If your production takes more than 2 hours per video, you are doing this one thing wrong.",
      caption: "Why context-switching is secretly destroying your creative output. 🕒 #creators #productivity #editing",
      platform: "YouTube Shorts",
      reason: "Direct problem-statement hook with immediate curiosity and high emotional resonance.",
      matchedScriptSection: "SECTION 1: THE CORE ARCHITECTURE",
    },
    {
      title: "How to Keep Viewers Past the 5-Second Mark",
      startTime: 58,
      endTime: 104,
      hook: "Most creators lose 60% of their audience before they even finish their introduction.",
      caption: "How pattern interrupts and visual zooms keep retention above 70%. 📈 #retention #growth #videoediting",
      platform: "Instagram Reels",
      reason: "High viewer retention spike, contrarian viewpoint on traditional YouTube intros.",
      matchedScriptSection: "HOOK & INTRODUCTION",
    },
    {
      title: "The Solo Creator Tech Stack for 2026",
      startTime: 110,
      endTime: 165,
      hook: "You don't need a team of 10 to produce top-tier content. Here's my 3-tool setup.",
      caption: "Everything I use to plan, script, and repurpose content seamlessly. 🛠️ #techstack #buildinpublic #solopreneur",
      platform: "TikTok",
      reason: "Listicle format with high bookmark and share rate for aspiring creators.",
      matchedScriptSection: "SECTION 2: PROMPTING FOR PRODUCTION",
    },
  ];
}

// 7. CREATOR INTELLIGENCE & ANALYTICS ANALYSIS
export interface AnalyticsInsightsParams {
  analyticsData: Array<{ platform: string; views: number; engagement: number; shares: number }>;
  creatorType?: string;
}

export interface CreatorIntelligenceReport {
  overview: string;
  highPerformingTopics: string[];
  strongHooksPattern: string;
  weakPerformingFormats: string;
  recommendedExperiments: string[];
  nextBestAction: string;
}

export async function analyzeContentPerformance(params: AnalyticsInsightsParams): Promise<CreatorIntelligenceReport> {
  const client = getGeminiClient();
  const prompt = `You are a chief content officer and YouTube algorithm analyst.
Analyze the following creator metrics and generate deep strategic observations:

Creator Type: ${params.creatorType || "General Creator"}
Metrics snapshot:
${JSON.stringify(params.analyticsData, null, 2)}

Provide actionable insights distinguishing data facts from AI-generated strategic bets.
Return ONLY a valid JSON object matching:
{
  "overview": "2-3 sentence strategic executive summary",
  "highPerformingTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "strongHooksPattern": "Detailed analysis of which hook formulas worked best",
  "weakPerformingFormats": "Which content styles or platforms dragged down average engagement",
  "recommendedExperiments": ["Experiment 1", "Experiment 2", "Experiment 3"],
  "nextBestAction": "The single most impactful thing the creator should do today"
}`;

  if (client) {
    const result = await generateWithFallback(client, prompt);
    const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);
    if (parsed.overview && Array.isArray(parsed.recommendedExperiments)) {
      return parsed;
    }
    throw new Error("Invalid analytics intelligence response from Gemini model");
  }

  return {
    overview:
      "Your audience engagement is strongest on technical breakdowns and contrarian building-in-public posts (avg 11.4% engagement), with short-form platforms driving 72% of new discovery.",
    highPerformingTopics: [
      "48-hour build challenges with verifiable metrics",
      "Actionable developer blueprints and prompt frameworks",
      "Behind-the-scenes toolchain comparisons",
    ],
    strongHooksPattern:
      "Curiosity gap + specific quantified timeframes ('in 48 hours', 'cut by 80%') generated 3.2x higher 30-second retention than open-ended questions.",
    weakPerformingFormats:
      "Generic opinion threads without visual proof or code snippets underperformed the channel average by 38%.",
    recommendedExperiments: [
      "Test a 2-part YouTube Shorts series showing before/after code refactoring",
      "Repurpose your top YouTube video into a 6-slide LinkedIn PDF carousel",
      "Add interactive timestamps with teaser hooks in pinned comments",
    ],
    nextBestAction:
      "Clip the '48-Hour MVP Sprint Rule' segment from your latest project and publish it to YouTube Shorts and Instagram Reels today.",
  };
}

// 8. PERSISTENT CREATOR ASSISTANT CHAT
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithCreatorAssistant(
  message: string,
  projectContext?: Record<string, unknown>,
  history: ChatMessage[] = [],
  creatorProfile?: { creatorType?: string; specializations?: string[] }
): Promise<string> {
  const client = getGeminiClient();
  const contextString = projectContext ? `Current Project Context: ${JSON.stringify(projectContext)}` : "";
  const profileString = creatorProfile
    ? `Creator Profile: ${creatorProfile.creatorType || "Creator"}${
        creatorProfile.specializations?.length ? ` (Niches: ${creatorProfile.specializations.join(", ")})` : ""
      }`
    : "";

  const prompt = `You are CreatorAI's resident Creative Director & Workflow Copilot.
You assist creators with ideas, script refinement, hook optimization, clip discovery, and multi-platform distribution.
${profileString}
${contextString}

Previous chat context:
${history.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}

User says: "${message}"

Give a direct, energetic, actionable response tailored to high-performing digital creators. Avoid corporate fluff. Format key takeaways with bullet points if helpful.`;

  if (client) {
    const result = await generateWithFallback(client, prompt);
    const text = result.response.text().trim();
    if (text) return text;
    throw new Error("Empty chat response received from Gemini model");
  }

  // Smart conversational assistant fallback
  const lower = message.toLowerCase();
  if (lower.includes("hook") || lower.includes("open")) {
    return `Here are 3 high-impact hook variations you can test right now:\n\n1. **The Contrarian:** "90% of creators do this completely wrong — here's why."\n2. **The Metric:** "I cut my production time by 60% with one simple tweak."\n3. **The Urgent Warning:** "Stop recording your next video until you fix this."\n\nWhich angle fits your audience best?`;
  }
  if (lower.includes("repurpose") || lower.includes("turn") || lower.includes("shorts")) {
    return `To turn this into 5 distinct assets:\n\n• **1 YouTube Short:** Extract your 45-second core takeaway with animated captions.\n• **1 Instagram Carousel:** Breakdown the 3 main steps across 5 visual slides.\n• **1 LinkedIn Post:** Share the founder/engineering lesson and business outcome.\n• **1 X Thread:** Post the bullet-point checklist with code snippets.\n• **1 Newsletter:** Send the raw unfiltered story to your email subscribers.\n\nWant me to generate the full drafts for any of these?`;
  }
  if (lower.includes("idea") || lower.includes("topic")) {
    return `Based on your current momentum, here are 2 viral angles:\n\n1. **"The 10-Minute AI Workflow That Replaced 3 Paid Subscriptions"** (High curiosity + utility)\n2. **"Why I Stopped Using Traditional Editors in 2026"** (Contrarian + tech shift)\n\nShould we draft a hook and outline for one of these?`;
  }

  return `I'm analyzing your content workflow! I can help you generate high-retention hooks, structure your scripts, find the best clip candidate timestamps, or adapt your content for Instagram, YouTube, and LinkedIn. What's our next priority?`;
}
