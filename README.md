# CreatorAI — AI-Powered Creator Operating Platform

**Ten tabs closed. One workspace open.**

CreatorAI brings the complete content-production lifecycle into one connected workspace:

**IDEA → SCRIPT → ASSETS → FOOTAGE → CLIPS → EDITING → REPURPOSING → PUBLISHING → ANALYTICS**

The product is designed around a premium, monochrome glassmorphism experience: frosted surfaces, soft silver/graphite backgrounds, rounded bento cards, clear black-pill actions, and a focused creator workflow.

Built with **Next.js App Router, React 19, TypeScript, Tailwind CSS, MongoDB Atlas, and Google Gemini**.

---

## ✨ Product Experience

### Landing page
- Premium monochrome silver, graphite and near-black visual system.
- Frosted-glass cards with large rounded corners and subtle depth.
- Floating workspace mockups that communicate the product before sign-in.
- Bento-style feature grid with a strong dark/light contrast rhythm.
- Workflow dock showing the complete Idea → Analytics lifecycle.
- Script-to-video intelligence showcase with clip candidate UI.
- Simple beta access/pricing sheet with clear primary CTA.
- Responsive, mobile-first layout with reduced-motion support.

### Creator workspace
- Central creator dashboard with production metrics and workflow counters.
- Content idea manager with platform/status filtering and AI idea generation.
- AI Script & Hook Studio with editable scripts, hooks, titles, captions and CTAs.
- Dedicated script workspace with AI-assisted editing actions.
- Central asset management for video, image, audio and document metadata.
- Video Intelligence for transcript/script correlation and clip discovery.
- Multi-platform Repurpose Studio for Instagram, YouTube, LinkedIn, X and short-form content.
- Kanban production workflow and publishing calendar.
- Creator analytics and Gemini-powered Creator Intelligence reports.
- Persistent AI Creator Copilot with context-aware shortcuts.
- One-click realistic demo mode for fast product exploration.

---

## 🧠 AI Workflow

CreatorAI is structured as one continuous system rather than a collection of disconnected generators:

1. **Capture** — save an idea.
2. **Plan** — define the project and platform.
3. **Create** — generate and refine scripts, hooks and captions.
4. **Produce** — manage assets and footage.
5. **Discover** — identify useful short-form moments.
6. **Repurpose** — adapt the source for multiple platforms.
7. **Publish** — schedule and track releases.
8. **Understand** — review analytics and content intelligence.
9. **Improve** — use AI insights to decide what to do next.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 App Router
- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Database:** MongoDB Atlas via Mongoose
- **AI:** Google Gemini API (`@google/generative-ai`)
- **Authentication:** JWT via `jose` + password hashing with `bcryptjs`
- **Deployment:** Vercel-ready serverless architecture

---

## 📦 Local Setup

### 1. Clone

```bash
git clone <repository-url>
cd RavenclawCoders_maharashtra_round
```

### 2. Install

```bash
npm install
```

### 3. Configure environment variables

Create `.env.local`:

```bash
cp .env.example .env.local
```

Configure:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/creatorai?retryWrites=true&w=majority
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_secure_jwt_secret
```

### 4. Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## ☁️ Vercel Deployment

The project is designed for Vercel.

1. Import the GitHub repository into Vercel.
2. Set the framework to **Next.js** if it is not detected automatically.
3. Add these Environment Variables for Production, Preview and Development as required:
   - `MONGODB_URI`
   - `GEMINI_API_KEY`
   - `JWT_SECRET`
4. Deploy from the `main` branch.
5. Every subsequent push to `main` can trigger a new deployment when automatic Git deployments are enabled.

The public project deployment used during development is:

**https://creatorsmagic.vercel.app/**

> If the Vercel project is connected to this GitHub repository with automatic deployments enabled, the latest commits to `main` will be picked up by Vercel automatically.

---

## 🔒 Security

- Gemini API requests are handled server-side; the API key is not exposed to browser code.
- Passwords are salted and hashed using `bcryptjs`.
- Sessions use secure HTTP-only cookies.
- Database queries enforce user ownership scoping.
- No sensitive credentials should be committed to GitHub; configure them through Vercel Environment Variables.

---

## 📌 Project Positioning

CreatorAI is not intended to be another single-purpose AI text generator. Its core product idea is a connected **creator operating workspace** where planning, production, repurposing, publishing and learning happen around the same content context.
