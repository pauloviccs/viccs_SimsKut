<div align="center">

<br/>

# SimsKut

### The Social Network for Sims Communities

<br/>

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-2.45-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

<br/>

An invite-only social platform for The Sims 4 players.  
Built with Liquid Glass aesthetics and crafted for communities that care.

<br/>

</div>

---

<br/>

## Overview

**SimsKut** is a private, invite-only social network inspired by the classic Orkut — reimagined with a modern **Liquid Glass** design system, personalized **Zen Theme** backgrounds, and deep integration with The Sims 4 universe.

Every player manages their **Sims families**, shares screenshots through **galleries**, publishes on a **social feed** with mentions and reactions, earns **badges** through community **challenges**, and customizes their entire visual experience — all within a curated, safe community.

<br/>

## Features

<br/>

<table>
<tr>
<td width="50%" valign="top">

### Authentication & Access

- OAuth login — Google & Discord
- Invite-only registration (`SIMS-XXXX-XXXX`)
- Admin approval workflow
- Auto-profile creation on signup
- Cookie consent banner (LGPD)
- Protected & admin-only routes

</td>
<td width="50%" valign="top">

### Social Feed

- Chronological timeline
- Rich posts — text + up to 4 images
- Spoiler flag for sensitive content
- Discord-style emoji reactions
- Likes & threaded comments
- @mentions with autocomplete
- #hashtag pages with trending sidebar
- Pin posts to your profile

</td>
</tr>
<tr>
<td width="50%" valign="top">

### User Profiles

- Customizable avatar & banner (with cropper)
- Username with Discord-style tag (`#0000`)
- Bio, website, display title
- Tabbed view: Posts · Media · Family
- Profile stats via RPC (friends, posts, photos)
- Friendship system — request, accept, block
- Friends list modal

</td>
<td width="50%" valign="top">

### Photo Gallery

- Private gallery with folder system
- Drag-and-drop photo upload
- Public/Private visibility toggle per photo
- Full-screen lightbox with zoom & navigation
- Likes & comments on photos
- Gallery picker in post composer

</td>
</tr>
<tr>
<td width="50%" valign="top">

### Sims Families

- Create, edit & manage families
- Add Sims with profession, bio, photo
- Life Stage — Baby through Elder
- Occult Types — Vampire, Mermaid, Alien…
- Aspirations & personality traits
- Skills with level progression (1–10)
- Individual photo albums per Sim
- Themed Sims 4 emoji set

</td>
<td width="50%" valign="top">

### Community Challenges

- Challenge hub with visual cards
- Admin-managed: create, edit, archive
- Milestone-based progression
- Media proof uploads per milestone
- Automatic badge on completion
- Progress tracker with percentage
- Optional participant cap
- Linked hashtags

</td>
</tr>
<tr>
<td width="50%" valign="top">

### Badges & Titles

- Earn badges by completing challenges
- Standalone admin-created badges
- Assign badges to specific users
- Featured badges on profile
- Custom titles (admin-managed)
- Display title on user profile

</td>
<td width="50%" valign="top">

### Notifications

- In-app notification panel
- Mentions, likes, friend requests
- Mark as read & clear all
- Web Push Notifications (VAPID)
- Service Worker integration
- Subscribe/unsubscribe management

</td>
</tr>
<tr>
<td width="50%" valign="top">

### News System

- Admin-published news articles
- Categories: Patch Note, Event, Update, Alert, Challenge
- Rich text editor with toolbar
- Inline images with resize, zoom & pan
- Likes & comments on articles
- Featured on landing page

</td>
<td width="50%" valign="top">

### Admin Dashboard

- Platform metrics overview
- User management (admin toggle)
- Invite approval/rejection
- Feed moderation
- News CRUD
- Challenge management
- Badge & title assignment
- Dedicated admin sidebar

</td>
</tr>
</table>

<br/>

---

<br/>

## Design System

### Liquid Glass

The entire interface is built on a custom **Liquid Glass** design system — translucency, layered blur, and a refined dark palette that feels both premium and familiar.

<br/>

| Token | Value |
|:------|:------|
| Glass Background | `rgba(255, 255, 255, 0.08)` |
| Glass Border | `rgba(255, 255, 255, 0.18)` |
| Glass Blur | `blur(20px)` / `blur(40px)` heavy |
| Text Primary | `rgba(255, 255, 255, 0.95)` |
| Text Secondary | `rgba(255, 255, 255, 0.65)` |
| Accent | `#007AFF` |
| Success | `#34C759` |
| Warning | `#FF9500` |
| Danger | `#FF3B30` |
| Font | SF Pro Display → Inter (fallback) |
| Radius | `10px` · `16px` · `24px` · `32px` |
| Animation | `cubic-bezier(0.34, 1.56, 0.64, 1)` |

<br/>

### Zen Theme

Every user personalizes their background through the **Zen Theme** engine — a generative gradient system powered by color harmony algorithms.

- **5 harmony modes** — Complement · Triadic · Analogous · Split · Tetradic
- **Draggable color dots** with real-time preview
- **Lightness** and **noise** sliders (SVG turbulence)
- **Persisted per-user** in Supabase (JSONB)
- **Temporary override** when viewing another profile
- **One-click reset** to solid dark mode

<br/>

### Component Library

57 UI components built on **Radix UI** primitives + **shadcn/ui**, extended with custom Liquid Glass components:

| Component | Purpose |
|:----------|:--------|
| `GlassCard` | Translucent container with backdrop blur |
| `GlassButton` | Button with hover glow + spring animation |
| `GlassInput` | Input with floating label + glass focus |
| `ZenBackground` | Generative gradient background engine |
| `NotificationsPanel` | Full notification center with actions |
| `EmojiPicker` | Themed emoji selector |
| `MentionInput` | Input with @mention autocomplete |
| `MediaLightbox` | Full-screen media viewer with navigation |
| `PhotoLightbox` | Gallery lightbox with likes & comments |
| `AvatarCropper` | 300×300 avatar crop tool |
| `BannerCropper` | 3:1 aspect ratio banner crop tool |
| `CookieBanner` | LGPD-compliant cookie consent |

<br/>

---

<br/>

## Architecture

<br/>

```
src/
├── App.tsx                         Routes — public + protected + admin
├── main.tsx                        Bootstrap — QueryClient, Auth, Cookies
│
├── components/
│   ├── admin/          (10)        Dashboard, news, challenges, badges, users
│   ├── auth/           (6)         Login, register, OAuth, callback, guard
│   ├── community/      (9)         Challenge hub, cards, milestones, hashtags
│   ├── family/         (1)         Complete family & Sims editor
│   ├── feed/           (6)         Timeline, composer, reactions, comments
│   ├── gallery/        (4)         Private/public gallery, lightbox, upload
│   ├── landing-v2/     (13)        Hero, features, news, showcase sections
│   ├── layout/         (3)         AppShell, sidebar, navbar
│   ├── profile/        (7)         Profile page, badges, friends, edit modal
│   ├── settings/       (4)         Settings, Zen picker, avatar/banner crop
│   └── ui/             (57)        Radix + shadcn + custom glass components
│
├── hooks/              (4)         useMobile, useToast, useChallenges, useShowcase
├── lib/                (18)        Service layer — all Supabase interactions
├── store/              (4)         Zustand — auth, theme, sidebar, cookies
├── styles/             (3)         Global CSS, Liquid Glass, landing tokens
├── types/              (2)         27+ TypeScript interfaces
└── utils/              (1)         Sims 4 themed emoji mappings
```

<br/>

### Data Layer

All backend services run on **Supabase** with Row Level Security enabled across every table.

```
supabase/
├── schema.sql                      Complete schema — 965 lines
├── migrations/         (17)        Incremental schema evolution
└── functions/
    ├── send-push/                  Web Push notification sender
    └── ea-sync/                    EA Gallery sync (reserved)
```

<br/>

**30+ database tables** · **5 storage buckets** · **3 triggers** · **2 RPC functions** · **2 Edge Functions**

<br/>

---

<br/>

## Tech Stack

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| Runtime | Vite 5.4 | Dev server + bundler |
| Framework | React 18.3 | Declarative UI |
| Language | TypeScript 5.5 | Type safety |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| UI Primitives | Radix UI + shadcn/ui | Accessible components |
| State | Zustand 4.5 | Client state management |
| Server State | TanStack Query 5 | Async cache + sync |
| Routing | React Router 6 | SPA navigation |
| Forms | React Hook Form + Zod | Validation |
| Animation | Framer Motion 11 | Motion & transitions |
| Charts | Recharts 3.7 | Admin dashboard metrics |
| Backend | Supabase 2.45 | Auth + PostgreSQL + Storage + Edge Functions |
| Icons | Lucide React | SVG icon set |
| Deploy | Vercel | Hosting + CDN |

<br/>

---

<br/>

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A [Supabase](https://supabase.com) project

### Setup

```bash
# Clone
git clone https://github.com/pauloviccs/viccs_SimsKut.git
cd viccs_SimsKut

# Install
npm install

# Configure
cp .env.local.example .env.local
# Set your Supabase credentials:
#   VITE_SUPABASE_URL=https://your-project.supabase.co
#   VITE_SUPABASE_ANON_KEY=your-anon-key

# Run
npm run dev
```

Open **`http://localhost:5173`** — you're in.

<br/>

### Scripts

| Command | Description |
|:--------|:------------|
| `npm run dev` | Development server with HMR |
| `npm run build` | Production build (tsc + vite) |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint check |

<br/>

---

<br/>

## Routes

| Path | Component | Access |
|:-----|:----------|:-------|
| `/` | Landing Page | Public |
| `/register` | Registration (invite code) | Public |
| `/login` | Login (email + OAuth) | Public |
| `/pending` | Pending Approval | Public |
| `/auth/callback` | OAuth Redirect | Public |
| `/feed` | Social Feed | Authenticated |
| `/community` | Challenges Hub | Authenticated |
| `/community/hashtag/:tag` | Hashtag Posts | Authenticated |
| `/gallery/private` | Private Gallery | Authenticated |
| `/family` | Family Manager | Authenticated |
| `/settings` | User Settings | Authenticated |
| `/profile/:username` | Public Profile | Authenticated |
| `/admin/*` | Admin Dashboard | Admin Only |

<br/>

---

<br/>

## Database

### Core Tables

| Table | Description |
|:------|:------------|
| `profiles` | User profiles (1:1 with auth) |
| `invite_codes` | Invite system — pending → approved → used |
| `friendships` | Friend relationships — pending, accepted, blocked |
| `feed_posts` | Social feed posts — text + up to 4 images |
| `post_likes` · `post_comments` · `post_reactions` | Post interactions |
| `post_comment_likes` | Nested comment likes |
| `photos` · `photo_likes` · `photo_comments` | Gallery system |
| `gallery_folders` | Gallery folder organization |
| `families` · `sims` · `sim_traits` · `sim_photos` | Sims family management |
| `news` · `news_likes` · `news_comments` · `news_images` | News system |
| `notifications` · `push_subscriptions` | Notification infrastructure |
| `challenges` · `challenge_milestones` · `challenge_participants` | Challenge system |
| `milestone_entries` | Challenge proof submissions |
| `user_badges` · `admin_badges` · `admin_titles` · `user_titles` | Badges & titles |

### Storage

| Bucket | Access | Content |
|:-------|:-------|:--------|
| `avatars` | Public | Profile avatars & banners |
| `photos` | Public | Gallery photos |
| `posts` | Public | Feed post images |
| `news` | Public | News article images (admin upload only) |
| `challenges` | Public | Challenge thumbnails & badges |

<br/>

---

<br/>

## Roadmap

| Phase | Status | Description |
|:------|:-------|:------------|
| **Scaffold** | ✅ Complete | Vite + React + TypeScript + Tailwind + Liquid Glass |
| **Auth & Invites** | ✅ Complete | Supabase Auth, invite flow, RLS policies, admin approval |
| **Social Core** | ✅ Complete | Feed, gallery, friendships, notifications, mentions |
| **Sims Families** | ✅ Complete | Family CRUD, Sim profiles, traits, life stages, occult types |
| **Community** | ✅ Complete | Challenges hub, milestones, badges, titles, hashtags |
| **News & Admin** | ✅ Complete | Rich text news, admin dashboard, moderation tools |
| **Zen Theme** | ✅ Complete | Generative gradient backgrounds, harmony engine, persistence |
| **Landing V2** | ✅ Complete | Hero, features, news, showcase, fluid background |
| **EA Gallery Sync** | 🔲 Planned | Sync with EA Gallery API (Edge Function reserved) |
| **i18n** | 🔲 Planned | Multi-language support (currently PT-BR only) |
| **Light Mode** | 🔲 Planned | Full light theme option |
| **Advanced Search** | 🔲 Planned | Global search across users, posts, and families |

<br/>

---

<br/>

## License

Distributed under the **MIT** License. See [LICENSE](./LICENSE) for details.

<br/>

---

<div align="center">

<br/>

Made by [Paulo Vinicios](https://github.com/pauloviccs)

**SimsKut** — Where every family tells a story.

<br/>

</div>
