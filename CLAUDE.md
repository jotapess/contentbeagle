# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**ContentBeagle** is a multi-tenant SaaS platform for brand-aligned long-form content creation. It combines AI-powered content generation with brand discovery, SEO optimization, AI pattern removal (humanization), and intelligent cross-linking.

**Repository**: https://github.com/jotapess/contentbeagle

### Current Status: Phase 1 COMPLETE

**Phase 1 (Frontend with Mock Data)** - COMPLETED December 2024
- 27 routes built with Next.js 14+ App Router
- All UI modules functional: Auth, Brands, Articles, AI Rules, Team, Settings
- Mock data layer for all entities (users, teams, brands, articles, etc.)
- shadcn/ui components integrated with Tailwind CSS v4

---

## Tech Stack (FINALIZED)

| Component | Technology | Notes |
|-----------|------------|-------|
| **Framework** | Next.js 16+ (App Router) | Server components by default |
| **React** | React 19 | Latest stable |
| **TypeScript** | TypeScript 5 | Strict mode |
| **Styling** | Tailwind CSS v4 | With tw-animate-css |
| **UI Components** | shadcn/ui + Radix | Headless, accessible |
| **Forms** | react-hook-form + zod | With @hookform/resolvers |
| **State** | Zustand | Lightweight global state |
| **Database** | Supabase (PostgreSQL) | To be integrated Phase 2 |
| **Auth** | Supabase OAuth | Google, GitHub |
| **AI** | Vercel AI SDK (BYOK) | OpenAI, Anthropic, Google |
| **Editor** | Tiptap | To be integrated |
| **Caching** | Upstash Redis | Serverless |
| **Crawling** | Firecrawl API | Brand discovery |
| **SEO Data** | DataForSEO | Keyword opportunities |
| **Deployment** | Vercel | Optimized for Next.js |

---

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Future: Generate Supabase types
npm run db:types

# Future: Run Supabase migrations
npm run db:push
```

---

## Project Structure

```
contentbeagle/
├── docs/                          # Detailed documentation
│   ├── PRD.md                     # Product requirements (comprehensive)
│   ├── DATABASE.md                # Complete schema, 21 tables, RLS policies
│   ├── AI-PIPELINE.md             # 7-step AI pipeline, all prompts
│   ├── INTEGRATIONS.md            # Firecrawl & DataForSEO patterns
│   └── ARCHITECTURE.md            # System architecture, folder structure
│
├── src/
│   ├── app/                       # Next.js App Router (27 routes)
│   │   ├── (auth)/               # Public auth pages
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/          # Protected dashboard pages
│   │   │   ├── layout.tsx        # Dashboard layout with sidebar
│   │   │   ├── dashboard/page.tsx
│   │   │   │
│   │   │   ├── brands/
│   │   │   │   ├── page.tsx              # Brands list
│   │   │   │   ├── new/page.tsx          # Create brand
│   │   │   │   └── [brandId]/
│   │   │   │       ├── page.tsx          # Brand overview
│   │   │   │       ├── profile/page.tsx  # Voice editor
│   │   │   │       ├── crawled/page.tsx  # Crawled pages
│   │   │   │       └── settings/page.tsx
│   │   │   │
│   │   │   ├── articles/
│   │   │   │   ├── page.tsx              # Articles list
│   │   │   │   ├── new/page.tsx          # Create article
│   │   │   │   └── [articleId]/
│   │   │   │       ├── layout.tsx        # Article sub-navigation
│   │   │   │       ├── page.tsx          # Editor
│   │   │   │       ├── seo/page.tsx      # SEO optimization
│   │   │   │       ├── links/page.tsx    # Cross-linking
│   │   │   │       ├── humanize/page.tsx # AI pattern removal
│   │   │   │       └── history/page.tsx  # Version history
│   │   │   │
│   │   │   ├── ai-rules/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [ruleId]/page.tsx
│   │   │   │
│   │   │   ├── team/
│   │   │   │   ├── page.tsx              # Members list
│   │   │   │   ├── invite/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── page.tsx              # User settings
│   │   │       ├── api-keys/page.tsx     # BYOK management
│   │   │       └── usage/page.tsx        # Usage analytics
│   │   │
│   │   ├── page.tsx              # Landing/redirect
│   │   └── layout.tsx            # Root layout
│   │
│   ├── components/
│   │   ├── ui/                   # 26 shadcn/ui components
│   │   ├── layout/               # Sidebar, Header, TeamSwitcher, MobileNav
│   │   └── features/             # Feature-specific (brands/)
│   │
│   ├── lib/
│   │   ├── mock-data/index.ts    # All mock data for Phase 1
│   │   └── utils.ts              # cn() utility
│   │
│   └── types/index.ts            # TypeScript interfaces
│
├── CLAUDE.md                     # This file
└── package.json
```

---

## Development Phases

### Phase 1: Frontend with Mock Data - COMPLETE
- [x] All 27 routes implemented
- [x] Auth pages (login, signup, forgot-password)
- [x] Dashboard with sidebar navigation
- [x] Brands module (list, create, overview, profile editor, crawled pages, settings)
- [x] Articles module (list, create, editor, SEO, links, humanize, history)
- [x] AI Rules module (list, create, edit)
- [x] Team module (members, invite, settings)
- [x] Settings module (profile, API keys, usage)
- [x] Mock data for all entities
- [x] shadcn/ui components integrated

### Phase 2: Supabase Integration - NEXT
- [ ] Set up Supabase project
- [ ] Run database migrations (21 tables from DATABASE.md)
- [ ] Implement RLS policies
- [ ] Set up Supabase Auth (email, Google, GitHub OAuth)
- [ ] Replace mock data with real database queries
- [ ] Implement Vault for API key encryption

### Phase 3: AI Provider Integration
- [ ] Implement BYOK provider registry (Vercel AI SDK)
- [ ] Content generation with streaming
- [ ] Brand voice analysis/extraction
- [ ] AI pattern detection and removal
- [ ] SEO enhancement suggestions

### Phase 4: External APIs
- [ ] Firecrawl integration (brand discovery, site crawling)
- [ ] DataForSEO integration (keyword opportunities)
- [ ] Usage tracking and quotas
- [ ] Caching with Upstash Redis

### Phase 5: Polish & Production
- [ ] Tiptap editor integration
- [ ] Error handling and edge cases
- [ ] Performance optimization
- [ ] Security audit
- [ ] Production deployment

---

## Key Architectural Decisions

### Multi-Tenancy Strategy
- **Decision**: Team-based multi-tenancy with RLS
- All data scoped to teams via `team_id`
- Row Level Security policies on all tables
- Helper functions: `is_team_member()`, `has_team_role()`

### BYOK (Bring Your Own Key)
- **Decision**: Users provide their own AI API keys
- Keys encrypted in Supabase Vault
- Provider abstraction via Vercel AI SDK registry
- Supports: OpenAI, Anthropic, Google AI

### Article Workflow States
```
draft -> editing -> seo_review -> cross_linking -> humanizing -> polished -> approved -> published
```
- Clear progression through optimization steps
- States can be skipped by admins
- Version created on each save

### Component Conventions
- Server components by default
- `'use client'` only when needed (interactivity, hooks)
- shadcn/ui for base components
- Feature components in `components/features/[feature]/`

---

## Important Files Reference

### Documentation
- `/docs/PRD.md` - Complete product requirements with acceptance criteria
- `/docs/DATABASE.md` - Full SQL schema, 21 tables, RLS policies, Vault functions
- `/docs/AI-PIPELINE.md` - 7-step pipeline, all prompt templates
- `/docs/INTEGRATIONS.md` - Firecrawl and DataForSEO integration patterns
- `/docs/ARCHITECTURE.md` - System architecture, folder structure, data flows

### Core Code
- `/src/lib/mock-data/index.ts` - All mock data (replace in Phase 2)
- `/src/types/index.ts` - TypeScript interfaces matching database schema
- `/src/components/layout/` - Sidebar, Header, TeamSwitcher
- `/src/app/(dashboard)/layout.tsx` - Protected dashboard layout

### Future Implementation
- `/src/lib/supabase/` - Database client (Phase 2)
- `/src/lib/ai/` - AI service, prompts, provider registry (Phase 3)
- `/src/lib/services/firecrawl/` - Crawling client (Phase 4)
- `/src/lib/services/dataforseo/` - SEO data client (Phase 4)
- `/src/lib/cache/` - Upstash Redis caching (Phase 4)

---

## Database Schema Overview (21 Tables)

See `/docs/DATABASE.md` for complete SQL.

**Core Tables**:
- `teams` - Multi-tenant organizations
- `team_members` - User-team relationships with roles
- `profiles` - Extended user data

**Brand Tables**:
- `brands` - Brand entities
- `brand_profiles` - Voice/tone/terminology (versioned)
- `brand_competitors` - Competitive differentiation

**Content Tables**:
- `articles` - Main content with workflow status
- `article_versions` - Version history
- `article_workflow_log` - Transition audit trail
- `article_comments` - Collaboration

**Crawling Tables**:
- `crawl_jobs` - Crawl operation tracking
- `crawled_pages` - Scraped content with summaries

**AI Tables**:
- `ai_pattern_rules_global` - System-provided rules
- `ai_pattern_rules` - Team-specific rules
- `ai_usage_log` - Token tracking

**API Tables**:
- `api_providers` - Provider metadata
- `user_api_keys` - Encrypted keys (Vault)

**SEO Tables**:
- `keyword_research` - Keyword data
- `keyword_cache` - Cost optimization
- `seo_usage_log` - API usage tracking
- `crawl_usage_log` - Firecrawl usage

---

## Role Permissions Matrix

| Permission | Owner | Admin | Editor | Viewer |
|------------|-------|-------|--------|--------|
| Manage team settings | Yes | Yes | No | No |
| Manage members | Yes | Yes | No | No |
| Manage API keys | Yes | Yes | No | No |
| Create/edit brands | Yes | Yes | Yes | No |
| Delete brands | Yes | Yes | No | No |
| Create/edit articles | Yes | Yes | Yes | No |
| Delete articles | Yes | Yes | No | No |
| View all content | Yes | Yes | Yes | Yes |

---

## AI Pipeline Overview (7 Steps)

See `/docs/AI-PIPELINE.md` for complete implementation.

1. **Input Parser** - Classify input type, extract structure
2. **Brand Context Loader** - Load brand profile, voice, terminology
3. **SEO Enricher** - Fetch DataForSEO keywords (optional)
4. **Content Generator** - Main LLM generation (streaming)
5. **AI Pattern Remover** - Rule-based + LLM pattern detection/rewrite
6. **Cross-Link Injector** - Match content to crawled pages
7. **Final Polish** - Brand re-verification, consistency check

---

## Mock Data Entities

Current mock data in `/src/lib/mock-data/index.ts`:

- **Users**: 3 users (John, Jane, Mike)
- **Teams**: 2 teams (Acme Content Team, Personal Workspace)
- **Team Members**: 3 members with owner/editor/viewer roles
- **Brands**: 3 brands (TechFlow SaaS, GreenLeaf Wellness, FinanceFirst)
- **Brand Profiles**: 2 complete profiles with voice/tone/terminology
- **Articles**: 3 articles in various workflow states
- **Crawled Pages**: 3 pages for TechFlow brand
- **AI Pattern Rules**: 6 rules (5 global, 1 team-specific)
- **API Keys**: 3 configured (OpenAI, Anthropic, Firecrawl)
- **Usage Data**: Sample AI usage logs
- **Keyword Data**: Sample SEO keywords

---

## Known Constraints & Gotchas

### Current Limitations (Phase 1)
- All data is mock - no persistence
- No actual authentication
- No API routes implemented yet
- Tiptap editor not yet integrated

### Technical Notes
- Using Next.js 16 with React 19 (latest)
- Tailwind CSS v4 (new syntax)
- All shadcn/ui components already installed

### Future Considerations
- Content calendar and scheduling (out of MVP scope)
- WordPress/CMS integrations (future)
- Collaborative real-time editing (future)
- Custom AI model fine-tuning (future)

---

## Environment Variables (Phase 2+)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Development defaults (optional)
FIRECRAWL_API_KEY=
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=
```

---

## Quick Reference Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm run lint                   # ESLint check

# Git
git status                     # Check changes
git diff                       # View changes

# Project navigation
code src/app/(dashboard)       # Dashboard routes
code src/components/ui         # UI components
code docs/                     # Documentation
```

---

## Session Context Protocol

When starting a new session:
1. Review this CLAUDE.md for current state
2. Check `/docs/` for detailed specifications
3. Reference mock data structure when implementing real data
4. Follow established component patterns in existing code

When completing work:
1. Update this file if architectural decisions change
2. Document any gotchas discovered
3. Note progress on phase completion

---

*Last Updated: December 2024 - Phase 1 Complete*
