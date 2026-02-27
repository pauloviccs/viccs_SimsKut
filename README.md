<div align="center">

# 💎 SimsKut

**Rede Social Privada para Comunidades de The Sims**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

<br/>

> *Uma intranet-social exclusiva para comunidades de jogadores de The Sims.*
> *Acesso por convite, aprovação manual, e cada família é uma obra de arte.*

<br/>

---

</div>

## 🌟 Visão Geral

**SimsKut** (VICCS SimsKut) é uma rede social **privada e por convites** inspirada no antigo Orkut, com a estética do **Liquid Glass Design System** (Apple WWDC 2025) e fundo **Zen** (gradiente harmônico configurável). Cada usuário gerencia sua **Família Sims**, interage com a **galeria global**, publica no **feed** com menções e comentários, mantém **perfil** e rede de amizades — tudo dentro de uma comunidade fechada e segura.

Para visão técnica detalhada, WIP e TODOs, veja [.agent/overview/PROJECT_STATUS.md](.agent/overview/PROJECT_STATUS.md).

<br/>

## ✨ Features

| Status | Feature | Descrição |
|:------:|---------|-----------|
| ✅ | **Landing Page** | Entrada por código de convite com validação |
| ✅ | **Auth Pages** | Registro, Login e OAuth com formulários glass |
| ✅ | **Feed Social** | Timeline de posts, comentários, likes e menções |
| ✅ | **Galeria Pública** | Galeria global com pastas, likes e comentários |
| ✅ | **Galeria Privada** | Coleção pessoal com pastas e upload |
| ✅ | **Família Sims** | Configuração da família e Sims |
| ✅ | **Árvore Genealógica** | Visualização da árvore (WIP) |
| ✅ | **Perfil** | Página pública por username, bio, amigos |
| ✅ | **Configurações** | Avatar (crop), Zen gradient, preferências |
| ✅ | **Zen Theme** | Fundo em gradiente harmônico (HarmonyEngine) |
| ✅ | **Admin Dashboard** | Stats, convites, moderação, feed admin |
| ✅ | **Liquid Glass UI** | Componentes glass + ZenBackground, FluidBackground |
| ✅ | **Layout Responsivo** | Sidebar desktop + Bottom Nav mobile |
| ✅ | **Cookie Banner** | Consentimento de cookies |
| ✅ | **Notificações** | Painel de notificações em tempo real |
| ✅ | **Rotas** | 5 públicas + 7 protegidas + `/admin/*` no AppShell |

<br/>

## 🎨 Design System — Liquid Glass

O design system é inspirado no **Apple Liquid Glass** com glassmorfismo, blur layers e paleta de cores refinada.

```
┌─────────────────────────────────────────────────────────────┐
│                      DESIGN TOKENS                          │
├──────────────────┬──────────────────────────────────────────┤
│  Glass BG        │  rgba(255, 255, 255, 0.08)              │
│  Glass Border    │  rgba(255, 255, 255, 0.18)              │
│  Glass Blur      │  blur(20px) / blur(40px) heavy          │
│  Text Primary    │  rgba(255, 255, 255, 0.95)              │
│  Text Secondary  │  rgba(255, 255, 255, 0.65)              │
├──────────────────┼──────────────────────────────────────────┤
│  🔵 Accent       │  #007AFF                                │
│  🟢 Success      │  #34C759                                │
│  🟡 Warning      │  #FF9500                                │
│  🔴 Danger       │  #FF3B30                                │
├──────────────────┼──────────────────────────────────────────┤
│  Font Display    │  SF Pro Display → Inter (fallback)      │
│  Radius          │  10px / 16px / 24px / 32px              │
│  Animation       │  cubic-bezier(0.34, 1.56, 0.64, 1)     │
└──────────────────┴──────────────────────────────────────────┘
```

### Componentes UI Disponíveis

```
📦 src/components/ui/
├── GlassCard.tsx        →  Container translúcido com blur
├── GlassButton.tsx      →  Botão com hover glow + animação spring
├── GlassInput.tsx       →  Input com label flutuante + foco glass
├── GlassDivider.tsx     →  Divisor visual glass
├── Avatar.tsx           →  Avatar circular com fallback de iniciais
├── ZenBackground.tsx    →  Fundo gradiente harmônico (Zen theme)
├── FluidBackground.tsx  →  Fundo fluido alternativo
├── OAuthButton.tsx      →  Botão de login OAuth (Google, etc.)
├── CookieBanner.tsx     →  Banner de consentimento de cookies
├── NotificationsPanel.tsx →  Painel de notificações
├── EmojiPicker.tsx      →  Seletor de emojis
└── MentionInput.tsx     →  Input com suporte a @menções
```

### Zen Theme (gradiente harmônico)

O **HarmonyEngine** (`src/lib/zenTheme/HarmonyEngine.ts`) gera paletas a partir de uma cor primária usando algoritmos de harmonia: `complement`, `triadic`, `analogous`, `split`, `tetradic`. O usuário configura o fundo em **Configurações** (ZenGradientPicker): posição dos pontos, luminosidade, ruído e algoritmo. O estado fica em `themeStore` e pode ser persistido no perfil (`zen_background`).

<br/>

## 🏗 Estrutura do Projeto

```
viccs_SimsKut/
│
├── 📄 index.html                    # Entry point HTML
├── 📄 package.json                  # Dependências (11 prod + 7 dev)
├── 📄 vite.config.ts                # Vite config + alias @/
├── 📄 vercel.json                   # SPA rewrite para Vercel
├── 📄 tsconfig.json                 # TypeScript strict mode
│
└── 📂 src/
    ├── 📄 App.tsx                   # Router principal (públicas + protegidas + admin)
    ├── 📄 main.tsx                  # QueryClient + BrowserRouter
    │
    ├── 📂 components/
    │   ├── 📂 admin/                # AdminDashboard, InviteManager, UserManager, AdminFeed, etc.
    │   ├── 📂 auth/                 # LandingPage, RegisterPage, LoginPage, PendingApproval, AuthCallback
    │   ├── 📂 family/               # FamilyConfig, FamilyTree
    │   ├── 📂 feed/                 # FeedPage, PostCard, PostComposer, CommentSection, GalleryPicker
    │   ├── 📂 gallery/              # GlobalGallery, PrivateGallery, PhotoUploadModal, PhotoLightbox
    │   ├── 📂 layout/               # AppShell, Sidebar, Navbar
    │   ├── 📂 profile/              # ProfilePage, ProfileEditModal, SimDetailsModal, FriendsListModal
    │   ├── 📂 settings/            # SettingsPage, ZenGradientPicker, AvatarCropper
    │   └── 📂 ui/                   # Glass*, Avatar, ZenBackground, FluidBackground, etc.
    │
    ├── 📂 lib/                      # Serviços e utilitários
    │   ├── supabaseClient.ts
    │   ├── authService.ts, inviteService.ts, inviteUtils.ts
    │   ├── profileService.ts, avatarService.ts, imageService.ts
    │   ├── feedService.ts, galleryService.ts, familyService.ts, friendshipService.ts
    │   ├── notificationService.ts, renderMentions.tsx
    │   └── zenTheme/HarmonyEngine.ts  # Cores harmônicas (complement, triadic, etc.)
    │
    ├── 📂 store/                    # authStore, themeStore, cookieStore, sidebarStore (Zustand)
    ├── 📂 styles/                   # global.css, liquid-glass.css
    └── 📂 types/                    # TypeScript interfaces (Profile, FeedPost, Photo, Family, Sim, etc.)
```

<br/>

## 🧬 Schema de Dados

O projeto define interfaces TypeScript que espelham o schema SQL do Supabase:

```typescript
Profile        →  Perfil (username, avatar_url, banner_url, bio, zen_background, is_admin)
ProfileStats   →  Contagens (friends_count, posts_count, photos_count)
InviteCode     →  Código de convite (status: pending → approved → used / rejected)
Friendship     →  Relacionamento (pending → accepted / blocked)
FeedPost       →  Post no feed (content, image_url, likes/comments)
PostLike, PostComment
Photo          →  Foto (visibility, folder_id, likes/comments)
GalleryFolder  →  Pasta na galeria
PhotoLike, PhotoComment
Family         →  Família Sims do usuário
Sim            →  Personagem Sim (profissão, bio, traits, fotos)
SimTrait       →  Qualidade ou habilidade do Sim
SimPhoto       →  Foto individual do Sim
```

<br/>

## 🛠 Tech Stack Completa

| Camada | Tecnologia | Versão | Função |
|--------|-----------|--------|--------|
| **Runtime** | Node.js | 22.17 | Ambiente de execução |
| **Framework** | React | 18.3 | UI declarativa |
| **Linguagem** | TypeScript | 5.5 | Type-safety |
| **Build** | Vite | 5.4 | Dev server + bundler |
| **Styling** | Tailwind CSS | 4.0 | Utility-first CSS |
| **Design** | Liquid Glass | — | Design system custom |
| **Backend** | Supabase | 2.45 | Auth, DB, Storage, RLS |
| **State (client)** | Zustand | 4.5 | Auth store global |
| **State (server)** | TanStack Query | 5.56 | Cache + sync |
| **Routing** | React Router | 6.26 | SPA navigation |
| **Forms** | React Hook Form | 7.53 | Validação de formulários |
| **Validation** | Zod | 3.23 | Schema validation |
| **Animations** | Framer Motion | 11.5 | Animações + transições |
| **Icons** | Lucide React | 0.441 | Ícones SVG |
| **Deploy** | Vercel | — | Hosting + CDN |
| **Fonts** | Inter | — | Google Fonts |

<br/>

## 🚀 Quick Start

### Pré-requisitos

- **Node.js** ≥ 18
- **npm** ≥ 9
- Conta no [Supabase](https://supabase.com) (para backend)

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/pauloviccs/viccs_SimsKut.git
cd viccs_SimsKut

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas chaves do Supabase:
#   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
#   VITE_SUPABASE_ANON_KEY=sua-anon-key

# 4. Inicie o dev server
npm run dev
```

O app estará disponível em **`http://localhost:5173`** 🎉

### Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server com HMR |
| `npm run build` | Build de produção (tsc + vite build) |
| `npm run preview` | Preview do build local |
| `npm run lint` | Linting com ESLint |

<br/>

## 🗺 Roadmap

```
Phase 0 — Scaffold                         ██████████████████████ 100%
├── Vite + React + TS + Tailwind
├── Design System Liquid Glass
├── Componentes UI + Layout responsivo
├── 9 rotas (3 públicas + 6 protegidas)
└── TypeScript interfaces completas

Phase 1 — Auth & Convites                   ██████████████████████ 100%
├── Supabase Auth (login/registro real)
├── Fluxo de convites conectado ao banco
├── SQL Migrations + RLS Policies
└── Admin: aprovar/rejeitar convites

Phase 2 — Social Core                      ██████████████████████ 100%
├── Feed com posts reais (CRUD + scroll)
├── Upload de fotos (Supabase Storage)
├── Sistema de amizades
└── Notificações em tempo real

Phase 3 — Família & Sims                   ████░░░░░░░░░░░░░░░░   ~30%
├── Configuração de Família e árvore (FamilyConfig, FamilyTree) ✅
├── CRUD completo de Família/Sims (parcial)
├── Árvore Genealógica (refinamento visual/navegação — WIP)
├── Traits e habilidades dos Sims
└── Galeria individual por Sim

Phase 4 — Polish                           ████░░░░░░░░░░░░░░░░   ~20%
├── Zen theme (gradiente harmônico configurável) ✅
├── Tema claro/escuro (lightness no Zen)
├── Favicon SVG personalizado
├── Performance + lazy loading
└── SEO meta tags
```

<br/>

## 📜 Licença

Este projeto é distribuído sob a licença **MIT**. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

<br/>

---

<div align="center">

Feito com 💎 por [Paulo Vinicios](https://github.com/pauloviccs)

**SimsKut** — *Onde cada família conta uma história.*

</div>
