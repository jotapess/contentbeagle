# ContentBeagle - System Architecture

## Overview

ContentBeagle is a modern web application built with:
- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes & Server Actions, Supabase (PostgreSQL + Auth)
- **AI**: Vercel AI SDK with multi-provider support (BYOK)
- **External Services**: Firecrawl (crawling), DataForSEO (SEO data)
- **Deployment**: Vercel (optimized for Next.js)

---

## Finalized Technology Decisions

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Authentication** | Supabase OAuth | Built-in Google/GitHub OAuth, simpler setup, unified with database |
| **Rich Text Editor** | Tiptap | Headless, extensible, excellent Markdown support. Used by Notion, GitLab |
| **Caching** | Upstash Redis | Serverless Redis, works seamlessly with Vercel, pay-per-request pricing |
| **Billing** | Deferred (not MVP) | Focus on core features first, add Stripe in future phase |
| **Email Service** | Resend (Phase 2) | For team invitations, transactional emails |

### Key Libraries

```json
{
  "dependencies": {
    "next": "^14.x",
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.x",
    "ai": "^3.x",
    "@ai-sdk/openai": "^0.x",
    "@ai-sdk/anthropic": "^0.x",
    "@tiptap/react": "^2.x",
    "@tiptap/starter-kit": "^2.x",
    "@upstash/redis": "^1.x",
    "@upstash/ratelimit": "^1.x",
    "zod": "^3.x",
    "tailwindcss": "^3.x"
  }
}
```

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Auth UI   │  │ Dashboard   │  │    Article Editor       │  │
│  │ (Login/etc) │  │  (Brands,   │  │  (Rich Text, SEO,       │  │
│  │             │  │  Articles)  │  │   Cross-links, etc.)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Application (Vercel)                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    App Router (src/app)                  │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │    │
│  │  │ (auth)/*     │  │ (dashboard)/*│  │    api/*     │   │    │
│  │  │ Server Comp. │  │ Server Comp. │  │ API Routes   │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Server Actions (src/lib)               │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │    │
│  │  │  Supabase  │  │ AI Service │  │ External Services  │ │    │
│  │  │   Client   │  │  (Vercel   │  │ (Firecrawl, DFSEO) │ │    │
│  │  │            │  │   AI SDK)  │  │                    │ │    │
│  │  └─────┬──────┘  └─────┬──────┘  └─────────┬──────────┘ │    │
│  └────────┼───────────────┼───────────────────┼────────────┘    │
└───────────┼───────────────┼───────────────────┼─────────────────┘
            │               │                   │
            ▼               ▼                   ▼
     ┌──────────┐    ┌──────────────┐    ┌─────────────────┐
     │ Supabase │    │  AI Providers │    │ External APIs   │
     │ Database │    │  (OpenAI,     │    │ (Firecrawl,     │
     │ + Auth   │    │  Anthropic,   │    │  DataForSEO)    │
     │ + Vault  │    │  Google)      │    │                 │
     └──────────┘    └──────────────┘    └─────────────────┘
```

---

## Folder Structure

```
contentbeagle/
├── docs/                          # Project documentation
│   ├── PRD.md                     # Product requirements
│   ├── DATABASE.md                # Database schema
│   ├── AI-PIPELINE.md             # AI pipeline details
│   ├── INTEGRATIONS.md            # External service integrations
│   └── ARCHITECTURE.md            # This file
│
├── public/                        # Static assets
│   ├── images/
│   └── fonts/
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/               # Auth route group (public)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx        # Auth layout (no sidebar)
│   │   │
│   │   ├── (dashboard)/          # Protected route group
│   │   │   ├── layout.tsx        # Dashboard layout with sidebar
│   │   │   ├── page.tsx          # Dashboard home
│   │   │   │
│   │   │   ├── brands/
│   │   │   │   ├── page.tsx              # Brands list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx          # Create brand wizard
│   │   │   │   └── [brandId]/
│   │   │   │       ├── page.tsx          # Brand overview
│   │   │   │       ├── profile/
│   │   │   │       │   └── page.tsx      # Brand voice editor
│   │   │   │       ├── crawled/
│   │   │   │       │   └── page.tsx      # Crawled pages list
│   │   │   │       └── settings/
│   │   │   │           └── page.tsx      # Brand settings
│   │   │   │
│   │   │   ├── articles/
│   │   │   │   ├── page.tsx              # Articles list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx          # Create article
│   │   │   │   └── [articleId]/
│   │   │   │       ├── page.tsx          # Article editor
│   │   │   │       ├── seo/
│   │   │   │       │   └── page.tsx      # SEO optimization
│   │   │   │       ├── links/
│   │   │   │       │   └── page.tsx      # Cross-linking
│   │   │   │       ├── humanize/
│   │   │   │       │   └── page.tsx      # AI pattern removal
│   │   │   │       └── history/
│   │   │   │           └── page.tsx      # Version history
│   │   │   │
│   │   │   ├── ai-rules/
│   │   │   │   ├── page.tsx              # AI pattern rules
│   │   │   │   └── [ruleId]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── team/
│   │   │   │   ├── page.tsx              # Team members
│   │   │   │   ├── invite/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── page.tsx              # User settings
│   │   │       ├── api-keys/
│   │   │       │   └── page.tsx          # BYOK management
│   │   │       └── usage/
│   │   │           └── page.tsx          # Usage analytics
│   │   │
│   │   ├── api/                   # API Routes
│   │   │   ├── auth/
│   │   │   │   └── callback/
│   │   │   │       └── route.ts
│   │   │   ├── content/
│   │   │   │   └── generate/
│   │   │   │       └── route.ts          # Streaming generation
│   │   │   └── webhooks/
│   │   │       └── firecrawl/
│   │   │           └── route.ts
│   │   │
│   │   ├── layout.tsx             # Root layout
│   │   ├── loading.tsx            # Global loading
│   │   ├── error.tsx              # Global error
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── toast.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── nav-menu.tsx
│   │   │   └── team-switcher.tsx
│   │   │
│   │   ├── features/              # Feature-specific components
│   │   │   ├── brands/
│   │   │   │   ├── brand-card.tsx
│   │   │   │   ├── brand-wizard.tsx
│   │   │   │   ├── voice-profile-editor.tsx
│   │   │   │   └── crawl-progress.tsx
│   │   │   │
│   │   │   ├── articles/
│   │   │   │   ├── article-editor.tsx
│   │   │   │   ├── article-toolbar.tsx
│   │   │   │   ├── workflow-status.tsx
│   │   │   │   ├── version-history.tsx
│   │   │   │   └── seo-panel.tsx
│   │   │   │
│   │   │   ├── ai/
│   │   │   │   ├── provider-selector.tsx
│   │   │   │   ├── humanization-panel.tsx
│   │   │   │   ├── pattern-rule-editor.tsx
│   │   │   │   └── generation-progress.tsx
│   │   │   │
│   │   │   └── cross-linking/
│   │   │       ├── link-suggestions.tsx
│   │   │       └── page-search.tsx
│   │   │
│   │   └── providers/
│   │       ├── auth-provider.tsx
│   │       ├── team-provider.tsx
│   │       └── toast-provider.tsx
│   │
│   ├── lib/                       # Core utilities and services
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser client
│   │   │   ├── server.ts          # Server client
│   │   │   ├── middleware.ts      # Auth middleware
│   │   │   └── api-keys.ts        # Vault operations
│   │   │
│   │   ├── ai/
│   │   │   ├── provider-registry.ts
│   │   │   ├── generation-service.ts
│   │   │   ├── token-estimation.ts
│   │   │   ├── brand-extraction.ts
│   │   │   └── prompts/
│   │   │       ├── content-generation.ts
│   │   │       ├── ai-pattern-removal.ts
│   │   │       ├── seo-enhancement.ts
│   │   │       ├── cross-linking.ts
│   │   │       └── final-polish.ts
│   │   │
│   │   ├── services/
│   │   │   ├── firecrawl/
│   │   │   │   ├── client.ts
│   │   │   │   ├── actions.ts
│   │   │   │   └── types.ts
│   │   │   │
│   │   │   ├── dataforseo/
│   │   │   │   ├── client.ts
│   │   │   │   ├── seo-service.ts
│   │   │   │   └── types.ts
│   │   │   │
│   │   │   ├── rate-limiter.ts
│   │   │   ├── quota.ts
│   │   │   └── retry.ts
│   │   │
│   │   ├── cache/
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── cn.ts              # Class name utility
│   │   │   └── format.ts
│   │   │
│   │   ├── mock-data/             # Mock data for frontend-first development
│   │   │   ├── brands.ts
│   │   │   ├── articles.ts
│   │   │   ├── users.ts
│   │   │   └── index.ts
│   │   │
│   │   └── constants.ts
│   │
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-team.ts
│   │   ├── use-brand.ts
│   │   ├── use-article.ts
│   │   └── use-ai-generation.ts
│   │
│   └── types/
│       ├── database.ts            # Generated from Supabase
│       ├── api.ts
│       └── index.ts
│
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 00001_initial_schema.sql
│   │   ├── 00002_rls_policies.sql
│   │   ├── 00003_vault_functions.sql
│   │   └── 00004_seed_data.sql
│   └── seed.sql
│
├── .env.local                     # Local environment variables
├── .env.example                   # Template
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── CLAUDE.md                      # AI assistant guidance
```

---

## Key Architectural Decisions

### 1. Multi-Tenancy Strategy

**Decision**: Team-based multi-tenancy with shared database and RLS

- Single database for all teams
- Row Level Security (RLS) policies isolate data
- Team ID present on all tenant-scoped tables
- Helper functions (`is_team_member`, `has_team_role`) for efficient RLS

**Trade-offs**:
- **Pros**: Simple operations, cost-effective, easy to manage
- **Cons**: RLS complexity, shared resource contention at scale

### 2. BYOK (Bring Your Own Key) for AI

**Decision**: Users provide their own API keys, stored encrypted in Supabase Vault

- No AI costs for platform operator
- Users control their AI spend
- Support multiple providers (OpenAI, Anthropic, Google)
- Provider abstraction via Vercel AI SDK registry

**Trade-offs**:
- **Pros**: No AI billing complexity, user autonomy, no vendor lock-in
- **Cons**: Users must manage keys, harder to provide consistent experience

### 3. Frontend-First Development

**Decision**: Build complete UI with mock data before backend integration

- All screens functional with mock data
- Easier to validate UX before committing to data structures
- Clear separation of concerns

**Approach**:
1. Phase 1: All UI screens with mock data
2. Phase 2: Replace mock with Supabase
3. Phase 3: Add AI integration
4. Phase 4: Add external services

### 4. Streaming for AI Generation

**Decision**: Server-Sent Events (SSE) for content generation

- Real-time feedback during generation
- Progressive content display
- Better UX for long operations

**Implementation**:
- `/api/content/generate` returns SSE stream
- Client uses `EventSource` or fetch with stream reader
- Pipeline events include step progress, content chunks, completion

### 5. Article Workflow States

**Decision**: Linear workflow with explicit state machine

```
draft → editing → seo_review → cross_linking → humanizing → polished → approved → published
```

- Clear progression through optimization steps
- Audit trail via workflow log
- States can be skipped by admins
- Version created on each save

---

## Data Flow Patterns

### Content Generation Flow

```
1. User clicks "Generate"
   │
   ▼
2. Client sends POST to /api/content/generate
   │  - brandId, inputType, content, settings
   │
   ▼
3. Server loads brand profile from Supabase
   │
   ▼
4. Server builds generation prompt
   │  - Injects brand voice, terminology, rules
   │
   ▼
5. Server calls AI provider (streaming)
   │  - Using user's API key from Vault
   │
   ▼
6. Server streams response via SSE
   │  - Progress events, content chunks
   │
   ▼
7. Client updates editor in real-time
   │
   ▼
8. On completion, article saved to database
```

### Brand Discovery Flow

```
1. User provides URL(s)
   │
   ▼
2. Server calls Firecrawl to scrape pages
   │  - Using user's Firecrawl key
   │
   ▼
3. Server stores raw markdown
   │
   ▼
4. Server calls AI for brand analysis
   │  - Extracts voice, tone, terminology
   │
   ▼
5. Brand profile created/updated
   │
   ▼
6. User can review and edit profile
```

---

## Security Considerations

1. **API Key Storage**: All keys encrypted in Supabase Vault, decrypted only server-side

2. **Row Level Security**: All tables have RLS policies, no direct client access to other teams' data

3. **Input Validation**: Zod schemas for all API inputs

4. **HTTPS Only**: All traffic encrypted

5. **Auth Middleware**: Protected routes require valid session

6. **Rate Limiting**: Per-team limits on external API calls

---

## Performance Considerations

1. **Database Indexes**: All frequently-queried columns indexed

2. **Caching**: Redis (Upstash) for hot data, PostgreSQL for warm data

3. **Streaming**: AI responses streamed to avoid timeout and improve UX

4. **Lazy Loading**: Dashboard uses React Suspense for component loading

5. **Edge Functions**: Supabase Edge Functions for low-latency operations

---

## Deployment Architecture (Vercel)

```
┌─────────────────────────────────────────────────┐
│                    Vercel                        │
│  ┌─────────────────────────────────────────┐    │
│  │         Edge Network (CDN)              │    │
│  │  - Static assets                        │    │
│  │  - Edge middleware (auth)               │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │      Serverless Functions               │    │
│  │  - API routes                           │    │
│  │  - Server components                    │    │
│  │  - Server actions                       │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │Supabase │ │ Upstash │ │ External│
   │(DB+Auth)│ │ (Redis) │ │  APIs   │
   └─────────┘ └─────────┘ └─────────┘
```

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Upstash Redis (for caching)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Optional: Default API keys for development
FIRECRAWL_API_KEY=
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=
```

---

## Scaling Considerations

### Current Architecture Limits

- **Supabase Free Tier**: 500MB database, 1GB bandwidth
- **Vercel Hobby**: 100GB bandwidth, 10s function timeout
- **Firecrawl**: Varies by plan (500-100,000 pages/month)

### Future Scaling Options

1. **Database**: Upgrade Supabase plan, add read replicas

2. **Caching**: Expand Redis usage, add CDN caching

3. **Background Jobs**: Add queue system (Inngest, BullMQ) for heavy operations

4. **Search**: Add vector search (pgvector) for semantic cross-linking
