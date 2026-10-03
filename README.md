# CreatorAI — AI-Powered Creator Operating Platform

A complete, production-ready full-stack web application bringing the entire content-production workflow into one centralized, intelligent workspace:

**IDEA → SCRIPT → ASSETS → FOOTAGE → CLIPS → EDITING → REPURPOSING → PUBLISHING → ANALYTICS**

Built with Next.js App Router, React 19, TypeScript, Tailwind CSS, MongoDB Atlas, and Google Gemini 2.5 Flash.

---

## 🚀 Features

1. **Central Creator Dashboard**
   - Live greeting, production metrics, and content pipeline counters (Ideas → Planned → Recording → Editing → Ready → Published).
   - High-impact AI suggestions with 1-click execution.
   - Recent projects overview with real-time progress meters.

2. **Content Idea Manager (Full CRUD)**
   - Capture, prioritize, and filter content concepts by platform and status.
   - 1-click "Convert to Project" to transition ideas into production.
   - "Generate Ideas with Gemini AI": generate viral angles by topic, target audience, and content style.

3. **AI Script & Hook Studio**
   - Generate production-ready video scripts complete with opening scene, hooks, main body cues, transitions, and calls to action.
   - 6 distinct psychological hook angles (curiosity, contrarian, statistical, story).
   - High-CTR titles, platform-tailored captions, and hashtags.
   - Fully editable script canvas with word count and estimated speaking duration.

4. **Dedicated Script Workspace**
   - 3-column layout: Project context & speaking metrics on the left, large editable canvas in the center, and AI Script Doctor on the right.
   - Instant inline actions: "Improve hook", "Make shorter", "More engaging", "Simplify", "Add CTA", "Generate transition".
   - Continuous autosave to MongoDB Atlas.

5. **Centralized Asset Management**
   - Store and organize videos, images, thumbnails, audio tracks, and documents.
   - Interactive preview modal with embedded video, audio, and high-res image viewers.
   - Filter by category, sort by date or size, and search by tag.
   - Serverless-compatible: stores asset metadata in MongoDB with external persistent URL references.

6. **Video Intelligence & Short-Form Discovery**
   - Non-destructive transcript and script keyword correlation.
   - Automatic identification of high-retention 30–60 second clip candidate boundaries.
   - Suggested hooks and platform-tailored captions for YouTube Shorts, Instagram Reels, and TikTok.

7. **Multi-Platform Repurpose Studio**
   - Transform 1 master asset (script, transcript, or post) into:
     - **Instagram**: Reel hook, carousel outline, caption & hashtags.
     - **YouTube**: SEO title, description, timestamped chapters, pinned comment.
     - **LinkedIn**: Professional founder thought-leadership post.
     - **X (Twitter)**: Multi-tweet punchy thread.
     - **Short-Form**: 45s vertical video script with visual cues.
   - Separate editable cards with 1-click copy and save to database.

8. **Kanban Workflow Board**
   - Visual drag/click progression across: Ideas → Planned → Recording → Editing → Ready → Published.
   - Real-time updates persisted directly to MongoDB.

9. **Content Publishing Calendar**
   - Interactive monthly calendar with platform badges and scheduled release deadlines.
   - Quick scheduling modal.

10. **Creator Analytics & Creator Intelligence**
    - Track total views, likes, comments, shares, and engagement rates.
    - Views velocity trajectory charts and platform distribution bars.
    - **Creator Intelligence Report**: Gemini AI analyzes performance patterns to reveal high-performing topics, winning hook formulas, and the next best growth action.

11. **Persistent AI Creator Copilot**
    - Floating / bottom-sheet assistant available across the entire workspace.
    - Context-aware chat with prompt shortcuts: "Turn this video into 5 Shorts", "Draft alternative hooks", "Repurpose for LinkedIn".

12. **Realistic 1-Click Demo Mode**
    - Instantly seed realistic creator projects ("How I Built My First AI App in 48 Hours"), master scripts, ideas, clips, assets, and analytics for zero-setup exploration.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Database**: MongoDB Atlas via Mongoose (with cached connection pooling for serverless runtimes + fallback persistence)
- **AI Engine**: Google Gemini API (`@google/generative-ai`)
- **Authentication**: JWT session via `jose` and `bcryptjs` with secure HTTP-only cookies
- **Deployment**: Vercel ready (zero local filesystem dependencies)

---

## 📦 Local Setup Instructions

### 1. Clone the repository
```bash
git clone <repository-url>
cd creator-ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file in the project root:
```bash
cp .env.example .env.local
```

Fill in your configuration:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/creatorai?retryWrites=true&w=majority
GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
JWT_SECRET=your_super_secret_jwt_key
```

> **Note**: Both `MONGODB_URI` and `GEMINI_API_KEY` are optional for initial local exploration — CreatorAI includes an active unified data store and fallback AI engine so you can run and test all workflows immediately out of the box!

### 4. Start the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Vercel Deployment

1. Push your repository to GitHub.
2. Import the project into your [Vercel Dashboard](https://vercel.com).
3. In **Project Settings → Environment Variables**, add:
   - `MONGODB_URI` — Your MongoDB Atlas connection string
   - `GEMINI_API_KEY` — Your Google Gemini API key from [Google AI Studio](https://aistudio.google.com)
   - `JWT_SECRET` — A random 32+ character string
4. Deploy! CreatorAI is built to work natively with Vercel's Edge/Serverless functions.

---

## 🔒 Security Best Practices

- All Gemini API calls are strictly handled on server-side Next.js route handlers. The `GEMINI_API_KEY` is **never** sent to the client browser.
- Passwords are salted and hashed using `bcryptjs`.
- Session tokens are stored in secure, `httpOnly`, `sameSite: "lax"` cookies.
- All database queries and mutations enforce user ownership scoping (`userId`).
