<div align="center">

# 📘 StudyHub DIU — CSE Learning Platform

**A production-grade Learning Management System built exclusively for the Computer Science & Engineering department of Daffodil International University, Bangladesh.**

[![Live](https://img.shields.io/badge/Live-studyhub.diu.systems-brightgreen?style=for-the-badge&logo=vercel)](https://studyhub.diu.systems/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

</div>

---

## 📌 About the Project

StudyHub DIU centralises all academic content — lecture slides, YouTube video lectures, study tools, previous exam questions, syllabi, and lab manuals — into a single, high-performance web application accessible to students, faculty, and administrators.

Before this platform, content was scattered across Google Drive folders, WhatsApp groups, and email threads. StudyHub solves this by providing a semester-organised, role-managed, mobile-responsive hub with deep-linking, analytics, and offline PWA support.

### ✨ Key Metrics

| Metric | Value |
|---|---|
| 🚀 Navigation Speed Improvement | **80–85% faster** |
| ⚡ Cache Hit Rate | **88–92%** |
| 🧩 Custom React Components | **50+** |
| 🔌 API Endpoints | **30+** |
| 🗃️ Database Tables | **12 core + admin** |
| 📄 Documentation Files | **78+** |
| 👥 Supported User Roles | **5** |
| 📦 Content Types | **7** |
| 🌏 Deployment Region | **Vercel Singapore (sin1)** |
| ✅ Production Status | **Live** |

---

## 🚀 Live Demo

🔗 **[https://studyhub.diu.systems/](https://studyhub.diu.systems/)**

---

## 🗂️ Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Database Design](#-database-design)
- [API Reference](#-api-reference)
- [Performance](#-performance)
- [Security](#-security)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Analytics & Monitoring](#-analytics--monitoring)
- [SEO](#-seo--discoverability)
- [Roadmap](#-roadmap)
- [Stats Summary](#-project-statistics)

---

## ✅ Features

### 🎓 Student-Facing

| Feature | Description |
|---|---|
| 📅 Semester Browser | Navigate all active semesters and their courses |
| 📊 Slide Viewer | Embedded Google Drive presentation viewer |
| 🎬 Video Player | Sandboxed YouTube embed (prevents navigation away from platform) |
| 📚 Study Tools | Download previous questions, syllabi, lab manuals, and more |
| 📝 Video Notes | Timestamped notes linked to specific video moments |
| 🔗 Shareable URLs | Deep-link to any slide, video, or study tool |
| 🌙 Dark / Light Mode | System-aware theme switching |
| 📱 Mobile Responsive | YouTube-style mobile layout with sidebar below content |
| 📲 PWA Support | Installable as a web app via `manifest.json` |

### 🛠️ Admin-Facing

| Feature | Description |
|---|---|
| 🧙 All-in-One Creator | 5-step guided semester creation wizard |
| 📤 Bulk Creator | Mass content upload with CSV/template support |
| 🖱️ Drag-and-Drop Reorder | Reorder topics, slides, and videos visually |
| ⭐ Course Highlighting | Feature/pin specific courses on the homepage |
| ✏️ Content Editor | Edit existing semesters, courses, topics, and content |
| 👤 User Management | Create and manage admin accounts with roles |
| 📈 Analytics Dashboard | Content access, download counts, view statistics |
| 🔍 Audit Logging | Complete change history with IP tracking |
| 🏢 Section Admin Portal | Department-scoped management dashboard |

---

## 🧰 Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.0.10 | Full-stack React framework (App Router) |
| React | 19.2.3 | UI component library |
| TypeScript | 5.x | Type-safe development |
| Tailwind CSS | 3.4.17 | Utility-first styling |
| Radix UI | latest | Accessible headless UI primitives |
| Framer Motion | 12.23.0 | Animations and transitions |
| Lucide React | 0.454.0 | Icon library |
| React Hook Form | latest | Form state management |
| Zod | 3.24.1 | Schema validation |
| @dnd-kit/core | 6.3.1 | Drag-and-drop functionality |
| next-themes | latest | Dark/light mode support |
| Recharts | latest | Analytics charts |
| Sonner | latest | Toast notifications |

### Backend & Database

| Technology | Version | Purpose |
|---|---|---|
| Supabase | latest | PostgreSQL cloud database + Auth |
| @supabase/supabase-js | latest | Supabase JS client |
| jsonwebtoken | 9.0.2 | JWT session tokens |
| bcryptjs | 3.0.2 | Password hashing (12 rounds) |

### DevOps & Deployment

| Technology | Purpose |
|---|---|
| Vercel | Hosting, CDN, serverless functions |
| Vercel Analytics | User behaviour tracking |
| Vercel Speed Insights | Core Web Vitals monitoring |
| next-sitemap | SEO sitemap generation |
| GitHub | Source control |

---

## 🏗️ Architecture

The application follows a **hybrid rendering** model:

- **Client Components** (`"use client"`) handle interactive UI, sidebar navigation, content selection, and real-time state
- **Server-side API Routes** (`app/api/`) handle all database operations, authentication, and business logic
- **Static assets** are served via Vercel's global CDN with 1-year immutable cache headers

### System Overview

```
Student / Faculty Browser
        │ HTTPS
        ▼
Vercel Edge Network (Singapore)
        │
        ├──▶ Next.js 16 App Router
        │         ├──▶ React 19 Client Components
        │         │         ├──▶ Multi-Level LRU Cache (lib/cache.ts)
        │         │         ├──▶ Google Drive Embed
        │         │         └──▶ YouTube Embed
        │         └──▶ Next.js API Routes
        │                   ├──▶ Supabase PostgreSQL (RLS enforced)
        │                   └──▶ JWT Auth Service → admin_sessions table
        │
        └──▶ Vercel Analytics + Speed Insights
```

### Data Flow (Caching)

```
User Request
     │
     ▼
[Cache Layer] ──HIT──▶ Return instantly (<150ms)
     │
    MISS
     │
     ▼
[API Route] ──▶ Supabase Query (RLS filtered)
     │
     ▼
Store in Cache with TTL ──▶ Return to User
```

### All-in-One Creator Workflow

```
Step 1: Semester Setup
      ▼
Step 2: Course Management
      ▼
Step 3: Content Creation (Slides & Videos)
      ▼
Step 4: Study Resources
      ▼
Step 5: Review & Publish ──▶ Auto-save every 30s ──▶ Live on Platform
```

### Deployment Pipeline

```
Developer pushes to GitHub main
      ▼
Vercel detects push → npm install → npm run build
      ▼
Static pages generated → Deployed to Vercel Edge (Singapore)
      ▼
Health check: /api/health → Sitemap verified → ✅ Production Live
```

---

## 🗃️ Database Design

### Entity Relationships

```
semesters (1) ──▶ (many) courses
courses    (1) ──▶ (many) topics
topics     (1) ──▶ (many) slides
topics     (1) ──▶ (many) videos
courses    (1) ──▶ (many) study_tools
admin_users(1) ──▶ (many) admin_sessions
```

### Core Tables

| Table | Key Columns |
|---|---|
| `semesters` | `id`, `title`, `section`, `has_midterm`, `has_final`, `start_date`, `end_date`, `is_active` |
| `courses` | `id`, `title`, `course_code`, `teacher_name`, `teacher_email`, `credits`, `semester_id` |
| `topics` | `id`, `title`, `course_id`, `order_index`, `difficulty_level`, `is_published` |
| `slides` | `id`, `title`, `google_drive_url`, `topic_id`, `order_index`, `is_downloadable` |
| `videos` | `id`, `title`, `youtube_url`, `topic_id`, `order_index`, `view_count` |
| `study_tools` | `id`, `title`, `type`, `content_url`, `course_id`, `download_count` |
| `admin_users` | `id`, `email`, `password_hash`, `role`, `is_active` |
| `admin_sessions` | `id`, `user_id`, `session_token`, `ip_address`, `expires_at` |
| `content_analytics` | `id`, `content_type`, `content_id`, `action_type`, `user_ip` |

### Study Tool Types

| Type | Description |
|---|---|
| `previous_questions` | Past exam question papers |
| `exam_note` | Exam preparation notes |
| `syllabus` | Course syllabus documents |
| `mark_distribution` | Marks breakdown sheets |
| `assignment` | Assignment files |
| `lab_manual` | Laboratory manuals |
| `reference_book` | Reference book links |

### Admin Roles

| Role | Access Level |
|---|---|
| `super_admin` | Full system access, user management |
| `admin` | Content management, moderation |
| `section_admin` | Department/section-specific management |
| `content_creator` | Upload and manage own content |
| `moderator` | Review and approve content |

---

## 🔌 API Reference

### Public Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/semesters` | List all active semesters |
| `GET` | `/api/semesters/[id]` | Get semester by ID |
| `GET` | `/api/semesters/[id]/courses` | Get courses for a semester |
| `GET` | `/api/courses` | List all courses |
| `GET` | `/api/courses/highlighted` | Get featured/highlighted courses |
| `GET` | `/api/topics/[id]` | Get topic details |
| `GET` | `/api/topics/[id]/slides` | Get slides for a topic |
| `GET` | `/api/topics/[id]/videos` | Get videos for a topic |
| `GET` | `/api/slides/[id]` | Get slide by ID |
| `GET` | `/api/videos/[id]` | Get video by ID |
| `GET` | `/api/study-tools/[id]` | Get study tool by ID |
| `GET` | `/api/resources` | List all resources |
| `GET` | `/api/notes` | Get user notes for a video |
| `POST` | `/api/notes` | Create a video note |
| `GET` | `/api/health` | System health check |

### Admin Endpoints (🔐 Protected)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/courses` | Create a course |
| `POST` | `/api/admin/topics` | Create a topic |
| `POST` | `/api/admin/content/slides` | Create a slide |
| `POST` | `/api/admin/content/videos` | Create a video |
| `POST` | `/api/admin/resources` | Create a study tool |
| `PUT` | `/api/admin/courses/[id]` | Update a course |
| `DELETE` | `/api/admin/resources/[id]` | Delete a resource |
| `POST` | `/api/admin/courses/[id]/toggle-highlight` | Feature/unfeature a course |
| `GET` | `/api/admin/enhanced-creator/list` | List all-in-one creations |
| `POST` | `/api/admin/all-in-one` | Create full semester package |
| `GET` | `/api/section-admin/stats` | Section-level statistics |

### Authentication Flow

```
Admin Browser
     │ POST {email, password}
     ▼
/api/auth/login
     │ Fetch user by email
     ▼
Supabase admin_users
     │ bcrypt.compare(password, hash)
     ▼
Create session → JWT token → admin_sessions table
     │ Set HTTP-only cookie
     ▼
Subsequent requests validated via session token + expiry check
```

---

## ⚡ Performance

### Multi-Level Caching (`lib/cache.ts`)

The `EnhancedCache` class implements a custom **LRU (Least Recently Used)** in-memory cache engine:

- **50 MB** maximum cache size
- **1,000 item** maximum count
- Automatic TTL-based expiration
- Access-count tracking per item
- Automatic cleanup every **2 minutes**

| Cache Level | Content | TTL |
|---|---|---|
| Level 1 | Course card data | 5 minutes |
| Level 2 | Topic content | 3 minutes |
| Level 3 | Video/slide metadata | 10 minutes |
| Level 3 | YouTube thumbnails | Infinite |

### Measured Results

| Operation | Before | After | Improvement |
|---|---|---|---|
| Course navigation | 3.5–5 seconds | 0.5–1 second | ✅ **80–85% faster** |
| Course card load | 800–1200ms | 50–150ms | ✅ **67–87% faster** |
| Topic expansion | 600–1000ms | 100–200ms | ✅ **75–90% faster** |
| Full page interaction | 2–3 seconds | <500ms | ✅ **83% faster** |
| Cache-enabled operations | N/A | <150ms | — |

### Additional Optimisations

- **Smart Prefetching** — Hover-based prefetching with 300ms debounce via `hooks/use-optimized-fetch.ts`
- **Virtual Scrolling** — Automatic for lists >20 items (`components/virtual-topic-list.tsx`)
- **Tree-Shaking** — Package import optimisation for `lucide-react` and Radix UI via `next.config.mjs`
- **Static Asset Caching** — 1-year immutable cache for `/_next/static/` assets
- **DNS Prefetch** — Pre-connects to Google Drive, YouTube, and Google Fonts in `app/layout.tsx`
- **Gzip Compression** — Enabled via `compress: true` in Next.js config

---

## 🔐 Security

### Authentication & Authorisation

| Layer | Implementation |
|---|---|
| Password Hashing | bcryptjs with **12 salt rounds** |
| Session Tokens | JWT signed with `JWT_SECRET` |
| Session Storage | `admin_sessions` table with IP + User-Agent |
| Session Expiry | Configurable TTL with auto-cleanup |
| Cookie Security | HTTP-only cookies, no client-side access |
| RBAC | Role-based middleware checks on all admin routes |

### Database Security

- **Row Level Security (RLS)** enabled on all Supabase tables
- **Public read** access only to published/active content
- **Service role** key used exclusively server-side (never exposed to the browser)
- **Anon key** used for browser-side read-only operations only

### HTTP Security Headers

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `origin-when-cross-origin` |
| Auth routes `Cache-Control` | `no-store, no-cache, must-revalidate` |
| Admin routes `Cache-Control` | `no-store, no-cache, must-revalidate` |

### Video Iframe Sandboxing

YouTube iframes use a `sandbox` attribute (`allow-scripts allow-same-origin allow-presentation allow-forms`) to **block navigation away** from the platform while preserving full video playback — implemented in `components/content-viewer.tsx`.

---

## 📁 Project Structure

```
DIU-Learning-Platform/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main homepage (content viewer + sidebar)
│   ├── layout.tsx                # Root layout with SEO metadata
│   ├── admin/                    # Admin dashboard pages
│   │   ├── page.tsx              # Admin home
│   │   ├── courses/              # Course management
│   │   ├── semesters/            # Semester management
│   │   ├── topics/               # Topic management
│   │   ├── content/              # Content (slides/videos) management
│   │   ├── resources/            # Study tools management
│   │   ├── bulk-creator/         # Bulk content creation
│   │   └── login/                # Admin authentication
│   ├── section-admin/            # Section-level admin pages
│   ├── api/                      # Next.js API Routes (30+ endpoints)
│   │   ├── auth/                 # Login, logout, session
│   │   ├── admin/                # Protected admin CRUD APIs
│   │   ├── semesters/            # Public semester APIs
│   │   ├── courses/              # Public course APIs
│   │   ├── topics/               # Public topic APIs
│   │   ├── slides/               # Slide content APIs
│   │   ├── videos/               # Video content APIs
│   │   ├── study-tools/          # Study tool APIs
│   │   ├── notes/                # User notes APIs
│   │   ├── analytics/            # Analytics tracking APIs
│   │   └── health/               # Health check endpoint
│   └── Resources/                # Public resources browser
├── components/                   # React components
│   ├── functional-sidebar.tsx    # Main navigation sidebar
│   ├── header.tsx                # Application header
│   ├── content-viewer.tsx        # Slide/video viewer
│   ├── lazy-content-viewer.tsx   # Lazy-loaded content viewer
│   ├── admin/                    # Admin-specific components (30+)
│   ├── section-admin/            # Section admin components
│   └── ui/                       # Radix UI-based design system (50+)
├── lib/                          # Shared utilities
│   ├── supabase.ts               # Supabase client (browser + server)
│   ├── cache.ts                  # Multi-level LRU cache engine
│   ├── analytics.ts              # Vercel + internal analytics
│   ├── performance.ts            # Performance monitoring
│   └── share-utils.ts            # Shareable URL generation
├── hooks/                        # Custom React hooks
│   ├── use-optimized-content.ts  # Content loading with caching
│   ├── use-optimized-fetch.ts    # Debounced fetch with cache
│   ├── use-course-data-cache.ts  # Course data caching hook
│   ├── use-performance.ts        # Render time measurement
│   └── use-mobile-touch.ts       # Touch gesture detection
├── contexts/
│   └── auth-context.tsx          # Authentication context
├── database/migrations/          # SQL migration files
├── docs/                         # 78+ documentation files
└── public/                       # Static assets + PWA manifest
```

### Key Components

| Component | File | Purpose |
|---|---|---|
| `FunctionalSidebar` | `components/functional-sidebar.tsx` | Main navigation: semesters → courses → topics → content |
| `LazyContentViewer` | `components/lazy-content-viewer.tsx` | Lazy-loaded slide/video viewer |
| `ContentViewer` | `components/content-viewer.tsx` | Core iframe viewer for slides and videos |
| `Header` | `components/header.tsx` | Top navigation bar with theme toggle |
| `EnhancedAllInOneCreator` | `components/admin/enhanced-all-in-one-creator.tsx` | 5-step semester creation wizard |
| `BulkUploadDialog` | `components/admin/bulk-upload-dialog.tsx` | Mass content upload interface |
| `DashboardStats` | `components/admin/dashboard-stats.tsx` | Admin analytics overview |
| `VirtualTopicList` | `components/virtual-topic-list.tsx` | Virtualised list for large topic sets |
| `OptimizedSidebar` | `components/optimized-sidebar.tsx` | Performance-optimised sidebar variant |

### Custom Hooks

| Hook | File | Purpose |
|---|---|---|
| `useOptimizedContent` | `hooks/use-optimized-content.ts` | Content loading with multi-level cache |
| `useOptimizedFetch` | `hooks/use-optimized-fetch.ts` | Debounced fetch with cache integration |
| `useCourseDataCache` | `hooks/use-course-data-cache.ts` | Course-specific data caching |
| `usePerformance` | `hooks/use-performance.ts` | Render time measurement |
| `useMobileTouch` | `hooks/use-mobile-touch.ts` | Touch gesture detection |

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn**
- A **Supabase** project (free tier works)
- A **Vercel** account (for deployment)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/your-username/DIU-Learning-Platform.git
cd DIU-Learning-Platform

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in the required values (see Environment Variables below)

# 4. Run database migrations
# Apply the SQL files in /database/migrations/ to your Supabase project

# 5. Start the development server
npm run dev

# App will be running at http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

---

## 🔑 Environment Variables

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Read-only DB access (anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** | Full DB access for API routes |
| `NEXT_PUBLIC_APP_URL` | Public | Canonical application URL |
| `JWT_SECRET` | **Server-only** | JWT signing secret |
| `ADMIN_SECRET_KEY` | **Server-only** | Admin bootstrap key |

> ⚠️ Never expose `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, or `ADMIN_SECRET_KEY` to the client. These are server-only secrets.

---

## 🚢 Deployment

This project is deployed on **Vercel** (Singapore region — `sin1`).

### Vercel Configuration

| Setting | Value |
|---|---|
| Framework | `nextjs` |
| Region | `sin1` (Singapore) |
| API Function Timeout | 30 seconds |
| Build Command | `npm run build` |
| Output Directory | `.next` |

### Deploy with Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments on every push to `main`.

---

## 📊 Analytics & Monitoring

### Dual Analytics System (`lib/analytics.ts`)

All events are tracked in **two parallel systems simultaneously**:

1. **Internal Analytics** — stored in the `content_analytics` Supabase table
2. **Vercel Analytics** — via `@vercel/analytics` `track()` function

| Event Type | Tracked Data |
|---|---|
| `content_interaction` | Content ID, type, action, metadata |
| `content_download` | Content ID, type, title |
| `slow_render` | Component name, render time |
| `page_view` | Page path, metadata |
| `search` | Query, result count |
| `user_engagement` | Action type, metadata |
| `error` | Error message, context |

### Health Check

```bash
GET /api/health
```

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": "connected",
    "analytics": "enabled",
    "vercel": "deployed"
  }
}
```

---

## 🔍 SEO & Discoverability

| Feature | Implementation |
|---|---|
| Structured Data (JSON-LD) | `EducationalOrganization` and `WebSite` schema types |
| Open Graph | Full OG tags for social sharing |
| Twitter Cards | `summary_large_image` card type |
| Dynamic Sitemap | Generated at `/api/sitemap/route.ts`, served at `/sitemap.xml` |
| Robots.txt | Served dynamically at `/api/robots/route.ts` |
| Canonical URLs | Set to `https://studyhub.diu.systems` |
| PWA Manifest | `public/manifest.json` for installability |
| Keywords | 30+ targeted CSE/DIU-specific keywords |

---

## 🗺️ Roadmap

| Priority | Feature | Description |
|---|---|---|
| 🔴 High | Advanced Analytics Dashboard | Student learning metrics, course completion rates |
| 🔴 High | Mobile Applications | React Native apps with offline content access |
| 🟡 Medium | AI Content Recommendations | Smart suggestions based on learning history |
| 🟡 Medium | Interactive Quizzes | In-platform quiz and flashcard system |
| 🟡 Medium | Collaboration Features | Multi-user editing, version history |
| 🟢 Low | Gamification | Achievement badges, leaderboards, learning streaks |
| 🟢 Low | Push Notifications | Assignment reminders, new content alerts |

---

## 📈 Project Statistics

| Category | Count / Value |
|---|---|
| Total source files | 200+ |
| Custom React components | 50+ |
| API route handlers | 30+ |
| Database tables | 12 core + admin |
| Documentation files | 78+ |
| SQL migration files | 4 |
| Custom React hooks | 8 |
| Radix UI primitives used | 25+ |
| Performance improvement | **80–85%** |
| Cache hit rate | **88–92%** |
| Supported user roles | 5 |
| Content types supported | 7 |
| Deployment region | Singapore (sin1) |

---

## 📜 License

**Private — Daffodil International University. All Rights Reserved.**

---

<div align="center">

**Built with ❤️ by the DIU CSE Department Development Team**

[![Live](https://img.shields.io/badge/Visit-studyhub.diu.systems-brightgreen?style=for-the-badge)](https://studyhub.diu.systems/)

</div>