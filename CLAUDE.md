# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**ContentBeagle** is a multi-tenant SaaS platform for brand-aligned long-form content creation. It combines AI-powered content generation with brand discovery, SEO optimization, AI pattern removal (humanization), and intelligent cross-linking.

**Repository**: https://github.com/jotapess/contentbeagle

### Current Status: Phase 1 COMPLETE - Phase 2 COMPLETE - Phase 3 COMPLETE

**Phase 1 (Frontend with Mock Data)** - COMPLETED December 2024
- 27 routes built with Next.js 14+ App Router
- All UI modules functional: Auth, Brands, Articles, AI Rules, Team, Settings
- Mock data layer for all entities (users, teams, brands, articles, etc.)
- shadcn/ui components integrated with Tailwind CSS v4

**Phase 2 (Supabase Integration)** - COMPLETED December 10, 2024
- Issues #2, #3, #4, #5 all CLOSED
- 7 migration files, 21 tables created in Supabase
- RLS policies with 5 helper functions for complete team isolation
- Supabase Auth with client/server/middleware pattern
- Full data layer with server actions for teams/brands/articles/profile
- Onboarding flow for new user team creation

**Phase 3 (AI Integration)** - COMPLETED December 11, 2024
- Issue #7 CLOSED - BYOK provider registry with model configurations
- Issue #8 CLOSED - Content generation pipeline with streaming
- Issue #9 CLOSED - AI pattern removal (humanization) with real-time detection
- Vercel AI SDK v5 integrated with streaming support
- Brand-aware content generation with live preview
- Pattern detection with AI score calculation (0-100%)
- Streaming humanization with brand voice injection

**Phase 6 (Mock Data Migration)** - CREATED December 10, 2024
- Issues #27, #28, #29 created to address mixed mock/real data
- Some files still import from `/src/lib/mock-data/index.ts`
- RECOMMENDED: Complete to fully remove mock data dependencies

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
| **Database** | Supabase (PostgreSQL) | INTEGRATED - 21 tables |
| **Auth** | Supabase Auth | INTEGRATED - Email/OAuth |
| **AI** | Vercel AI SDK (BYOK) | OpenAI, Anthropic, Google |
| **Editor** | Tiptap | To be integrated |
| **Caching** | Upstash Redis | Serverless |
| **Crawling** | Firecrawl API | Brand discovery |
| **SEO Data** | DataForSEO | Keyword opportunities |
| **Deployment** | Vercel | Optimized for Next.js |

---

## Supabase Project Details

| Property | Value |
|----------|-------|
| **Project Ref** | eiowwhicvrtawgotvswt |
| **URL** | https://eiowwhicvrtawgotvswt.supabase.co |
| **Region** | (check Supabase dashboard) |
| **Status** | All migrations applied |

### Database Tables (21 total)
**Core (3)**: teams, team_members, profiles
**Brands (3)**: brands, brand_profiles, brand_competitors
**Content (4)**: articles, article_versions, article_workflow_log, article_comments
**Crawling (3)**: crawl_jobs, crawled_pages, crawl_usage_log
**AI (4)**: ai_pattern_rules_global, ai_pattern_rules, ai_usage_log, api_providers
**API Keys (1)**: user_api_keys
**SEO (3)**: keyword_research, keyword_cache, seo_usage_log

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

# Generate Supabase types (after schema changes)
npx supabase gen types typescript --project-id eiowwhicvrtawgotvswt > src/types/database.ts

# Push migrations to Supabase
npx supabase db push --project-ref eiowwhicvrtawgotvswt
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
├── supabase/                      # [NEW - Phase 2] Database migrations
│   └── migrations/
│       ├── 20241210000001_core_tables.sql       # teams, team_members, profiles
│       ├── 20241210000002_brand_content_tables.sql  # brands, articles, versions
│       ├── 20241210000003_crawl_ai_tables.sql   # crawling, AI rules, API keys
│       ├── 20241210000004_seo_tables.sql        # keyword_research, caching
│       ├── 20241210000005_seed_data.sql         # API providers, global AI rules
│       ├── 20241210000006_rls_helpers.sql       # RLS helper functions
│       └── 20241210000007_rls_policies.sql      # Complete RLS policies
│
├── src/
│   ├── app/
│   │   ├── api/                               # API routes
│   │   │   ├── ai/test/route.ts              # [NEW - Phase 3] Provider test endpoint
│   │   │   └── content/generate/route.ts     # [NEW - Phase 3] Streaming generation
│   │   │
│   │   ├── auth/                              # [Phase 2]
│   │   │   └── callback/route.ts             # OAuth callback handler
│   │   │
│   │   ├── (auth)/                           # Public auth pages
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/                      # Protected dashboard pages
│   │   │   ├── layout.tsx                    # Dashboard layout with sidebar
│   │   │   ├── onboarding/page.tsx           # [NEW - Phase 2] Team creation
│   │   │   ├── dashboard/page.tsx
│   │   │   │
│   │   │   ├── brands/
│   │   │   │   ├── page.tsx                  # Brands list
│   │   │   │   ├── new/page.tsx              # Create brand
│   │   │   │   └── [brandId]/
│   │   │   │       ├── page.tsx              # Brand overview
│   │   │   │       ├── profile/page.tsx      # Voice editor
│   │   │   │       ├── crawled/page.tsx      # Crawled pages
│   │   │   │       └── settings/page.tsx
│   │   │   │
│   │   │   ├── articles/
│   │   │   │   ├── page.tsx                  # Articles list
│   │   │   │   ├── new/page.tsx              # Create article
│   │   │   │   └── [articleId]/
│   │   │   │       ├── layout.tsx            # Article sub-navigation
│   │   │   │       ├── page.tsx              # Editor
│   │   │   │       ├── seo/page.tsx          # SEO optimization
│   │   │   │       ├── links/page.tsx        # Cross-linking
│   │   │   │       ├── humanize/page.tsx     # AI pattern removal
│   │   │   │       └── history/page.tsx      # Version history
│   │   │   │
│   │   │   ├── ai-rules/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [ruleId]/page.tsx
│   │   │   │
│   │   │   ├── team/
│   │   │   │   ├── page.tsx                  # Members list
│   │   │   │   ├── invite/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── page.tsx                  # User settings
│   │   │       ├── api-keys/page.tsx         # BYOK management
│   │   │       └── usage/page.tsx            # Usage analytics
│   │   │
│   │   ├── page.tsx                          # Landing/redirect
│   │   └── layout.tsx                        # Root layout
│   │
│   ├── components/
│   │   ├── ui/                               # 26 shadcn/ui components
│   │   ├── layout/                           # Sidebar, Header, TeamSwitcher
│   │   ├── features/                         # Feature-specific components
│   │   └── providers/                        # [NEW - Phase 2]
│   │       └── auth-provider.tsx             # AuthContext + useAuth hook
│   │
│   ├── lib/
│   │   ├── supabase/                         # [Phase 2] Supabase clients
│   │   │   ├── client.ts                     # Browser client (createBrowserClient)
│   │   │   ├── server.ts                     # Server client + admin client
│   │   │   └── middleware.ts                 # Session refresh + route protection (used by proxy.ts)
│   │   │
│   │   ├── ai/                               # [NEW - Phase 3] AI integration
│   │   │   ├── provider-registry.ts          # BYOK provider registry, model configs
│   │   │   ├── generation-service.ts         # AIGenerationService with streaming
│   │   │   ├── brand-context.ts              # Brand profile loader
│   │   │   ├── index.ts                      # Barrel exports
│   │   │   └── prompts/                      # Prompt templates
│   │   │       ├── content-generation.ts     # Brand-aware generation prompts
│   │   │       └── index.ts                  # Prompts barrel export
│   │   │
│   │   ├── actions/                          # Server actions
│   │   │   ├── index.ts                      # Re-exports all actions
│   │   │   ├── teams.ts                      # Team CRUD, member management
│   │   │   ├── brands.ts                     # Brand CRUD, profiles, crawled pages
│   │   │   ├── articles.ts                   # Article CRUD, versioning, workflow
│   │   │   ├── profile.ts                    # User profile management
│   │   │   ├── api-keys.ts                   # [NEW - Phase 3] API key CRUD
│   │   │   └── ai-usage.ts                   # [NEW - Phase 3] Token usage tracking
│   │   │
│   │   ├── mock-data/index.ts                # Mock data (to be deprecated)
│   │   └── utils.ts                          # cn() utility
│   │
│   ├── hooks/                                # [NEW - Phase 3] Custom hooks
│   │   ├── use-ai-generation.ts              # Frontend AI generation with streaming
│   │   └── index.ts                          # Hooks barrel export
│   │
│   ├── types/
│   │   ├── index.ts                          # TypeScript interfaces
│   │   └── database.ts                       # [NEW - Phase 2] Supabase types (auto-generated)
│   │
│   └── proxy.ts                              # [RENAMED - Next.js 16] Was middleware.ts, uses proxy() function
│
├── .env.example                              # [NEW - Phase 2] Environment template
├── CLAUDE.md                                 # This file
└── package.json
```

---

## Implementation Timeline (12-16 Weeks)

### Execution Strategy: 7 Batches

The implementation is organized into 7 logical batches to minimize context switching:

| Batch | Phase | Weeks | Focus | Critical Path |
|-------|-------|-------|-------|---------------|
| 1 | 2.1 | 1 | Database Foundation (21 tables) | YES - blocks everything |
| 2 | 2.2 | 2 | Row-Level Security Policies | YES - blocks auth |
| 3 | 2.3-2.4 | 3-4 | Auth + Data Migration | YES - blocks Phase 3 |
| 4 | 3.1-3.2 | 5-7 | AI Provider + Content Generation | YES - core product |
| 5 | 3.3-3.4 | 7-9 | Humanization + Brand Extraction | YES - differentiators |
| 6 | 4.x | 10-13 | External APIs (Firecrawl, DataForSEO) | Parallel possible |
| 7 | 5.x | 14-16 | Polish + Production | Final validation |

### Critical Path
```
Database (21 tables) -> RLS Policies -> Auth -> Data Layer -> AI Integration -> External APIs -> Production
```

**Key Insight**: Phase 2 blocks everything. No work on Phases 3-5 can proceed until database and auth are complete.

### Parallel Work Opportunities
After Phase 2 complete (Week 4):
- Phase 3 (AI) and Phase 4 (External APIs) can partially overlap
- Start Firecrawl client (4.1.1) once API keys working (after 2.4.5)
- DataForSEO client (4.2.1) can run parallel to Phase 3 work

---

## Development Phases - Detailed

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

### Phase 2: Supabase Integration - COMPLETED December 10, 2024

**GitHub Issues CLOSED**: #2, #3, #4, #5

#### Phase 2 Completion Summary

| Issue | Title | Status | Key Deliverables |
|-------|-------|--------|------------------|
| #2 | Database Migrations | CLOSED | 7 migration files, 21 tables |
| #3 | RLS Policies | CLOSED | 5 helper functions, policies for all tables |
| #4 | Authentication | CLOSED | Client/server/middleware, AuthProvider |
| #5 | Data Layer | CLOSED | Server actions for teams/brands/articles/profile |

#### Files Created in Phase 2

**Database Migrations** (`/supabase/migrations/`):
- `20241210000001_core_tables.sql` - teams, team_members, profiles + triggers
- `20241210000002_brand_content_tables.sql` - brands, brand_profiles, articles, versions, comments
- `20241210000003_crawl_ai_tables.sql` - crawl_jobs, crawled_pages, ai_pattern_rules, api_providers, user_api_keys
- `20241210000004_seo_tables.sql` - keyword_research, keyword_cache, seo_usage_log
- `20241210000005_seed_data.sql` - API providers, global AI rules
- `20241210000006_rls_helpers.sql` - 5 RLS helper functions
- `20241210000007_rls_policies.sql` - Complete RLS policies for all 21 tables

**Supabase Clients** (`/src/lib/supabase/`):
- `client.ts` - Browser client using `createBrowserClient<Database>`
- `server.ts` - Server client + admin client (bypasses RLS)
- `middleware.ts` - Session refresh, route protection logic

**Server Actions** (`/src/lib/actions/`):
- `teams.ts` - getUserTeams, getTeam, createTeam, updateTeam, deleteTeam, updateMemberRole, removeMember, getOrCreateDefaultTeam
- `brands.ts` - getBrands, getBrand, createBrand, updateBrand, deleteBrand, getBrandProfile, updateBrandProfile, getCrawledPages, updateBrandStatus
- `articles.ts` - getArticles, getArticle, createArticle, updateArticle, updateArticleContent, transitionArticleStatus, getArticleVersions, getArticleWorkflowLog, deleteArticle, restoreArticleVersion
- `profile.ts` - getProfile, updateProfile, setDefaultTeam, updatePreferences
- `index.ts` - Re-exports all actions and types

**Auth Components**:
- `/src/components/providers/auth-provider.tsx` - AuthContext + useAuth hook
- `/src/app/auth/callback/route.ts` - OAuth callback handler
- `/src/middleware.ts` - Next.js middleware for auth

**Other**:
- `/src/app/(dashboard)/onboarding/page.tsx` - Team creation for new users
- `/src/types/database.ts` - Auto-generated Supabase types
- `/.env.example` - Environment variable template

#### RLS Helper Functions

```sql
-- Check if user is member of a team
is_team_member(team_id UUID) -> BOOLEAN

-- Check if user has specific role(s) in team
has_team_role(team_id UUID, roles TEXT[]) -> BOOLEAN

-- Get all team IDs for current user
get_user_teams() -> SETOF UUID

-- Get user's role in a specific team
get_user_role(team_id UUID) -> TEXT

-- Check if user owns a team
is_team_owner(team_id UUID) -> BOOLEAN
```

#### Architectural Decisions Made in Phase 2

1. **Server-first data fetching**: All data operations use server actions, not client-side fetching
2. **Type-safe Supabase**: Auto-generated types from Supabase schema ensure type safety
3. **Onboarding flow**: New users redirected to `/onboarding` to create their first team
4. **Admin client pattern**: `createAdminClient()` for operations that need to bypass RLS
5. **Revalidation strategy**: Use `revalidatePath()` after mutations for cache invalidation
6. **Auth callback flow**: OAuth redirects to `/onboarding` for new users

### Phase 3: AI Integration - IN PROGRESS (Issue #7 Complete, #8 In Progress)

#### Phase 3 Status Summary (December 10, 2024)

| Issue | Title | Status | Key Deliverables |
|-------|-------|--------|------------------|
| #7 | Vercel AI SDK + BYOK | CLOSED | Provider registry, model configs, test endpoint |
| #8 | Content Generation Pipeline | IN PROGRESS | Brand-aware prompts, streaming API, frontend hook - 401 auth errors |
| #9 | AI Pattern Removal | BLOCKED | Blocked by #8 and mock data issues |

#### Files Created in Phase 3

**Issue #7 - BYOK Provider Registry** (Commit: f82d3bd):
- `/src/lib/ai/provider-registry.ts` - Multi-provider registry with model configurations
- `/src/lib/ai/generation-service.ts` - AIGenerationService with streaming support
- `/src/lib/ai/index.ts` - Barrel exports for AI module
- `/src/lib/actions/api-keys.ts` - API key CRUD server actions
- `/src/app/api/ai/test/route.ts` - Provider connectivity test endpoint

**Issue #8 - Content Generation Pipeline** (Commit: c769730):
- `/src/lib/ai/prompts/content-generation.ts` - Brand-aware prompt builder
- `/src/lib/ai/prompts/index.ts` - Prompts barrel export
- `/src/lib/ai/brand-context.ts` - Brand profile loader for voice injection
- `/src/app/api/content/generate/route.ts` - Streaming generation endpoint
- `/src/hooks/use-ai-generation.ts` - Frontend hook with abort support
- `/src/hooks/index.ts` - Hooks barrel export
- `/src/lib/actions/ai-usage.ts` - Token usage tracking with cost estimation
- Updated `/src/app/(dashboard)/articles/new/page.tsx` - Real generation with live preview

#### Supported AI Models

| Provider | Model ID | Display Name |
|----------|----------|--------------|
| OpenAI | gpt-4o | GPT-4o |
| OpenAI | gpt-4o-mini | GPT-4o Mini |
| Anthropic | claude-sonnet-4-20250514 | Claude Sonnet 4 |
| Anthropic | claude-opus-4-5-20251101 | Claude Opus 4.5 |
| Google | gemini-1.5-pro | Gemini 1.5 Pro |

#### Content Generation Features

- **4 Input Types**: bullets, draft, research, topic_only
- **3 Length Options**: short (~500 words), medium (~1000 words), long (~1500 words)
- **Brand Voice Injection**: Tone, vocabulary, power words from brand profile
- **Live Streaming Preview**: Real-time content display during generation
- **Article Auto-Creation**: Saves to database with initial version
- **Token Usage Tracking**: Logs to ai_usage_log with cost estimation

#### Development Fallback Pattern

For local development without user API keys, environment variables are checked:
```bash
OPENAI_API_KEY=      # Fallback for OpenAI models
ANTHROPIC_API_KEY=   # Fallback for Anthropic models
GOOGLE_AI_API_KEY=   # Fallback for Google models
```

#### Architectural Decisions Made in Phase 3

1. **Vercel AI SDK v5**: Using latest SDK with `streamText()` for streaming generation
2. **Provider abstraction**: Registry pattern allows easy addition of new providers
3. **Brand context injection**: Prompts dynamically include brand voice, tone, vocabulary
4. **Streaming-first**: All generation endpoints return streaming responses
5. **Abort controller support**: Frontend can cancel in-progress generation
6. **Usage tracking**: Every generation logs tokens and estimated cost to ai_usage_log

#### Issues NOT Completed (Deferred)

| Issue | Title | Status | Notes |
|-------|-------|--------|-------|
| #20 | Team Invitations | OPEN | Requires Resend integration |
| #25 | Seed Data | PARTIALLY DONE | Providers seeded, rules seeded |
| #26 | Backup Procedures | OPEN | Documentation task |

### Phase 3: AI Provider Integration (Weeks 5-9) - IN PROGRESS (67%)
**GitHub Issues**: #7 CLOSED, #8 CLOSED, #9 OPEN

**Milestone 3.1 - Provider Abstraction (Issue #7)** - COMPLETED December 10, 2024:
- [x] Sprint 3.1.1: Provider registry setup (Vercel AI SDK v5)
- [x] Sprint 3.1.2: Generation service interface with streaming
- [x] Sprint 3.1.3: Token estimation & usage tracking

**Milestone 3.2 - Content Generation (Issue #8)** - COMPLETED December 10, 2024:
- [x] Sprint 3.2.1: Prompt engineering foundation (brand-aware prompts)
- [x] Sprint 3.2.2: Basic generation API with streaming
- [x] Sprint 3.2.3: Frontend generation integration (live preview)
- [x] Sprint 3.2.4: Article creation with auto-versioning

**Milestone 3.3 - AI Pattern Removal (Issue #9)** - COMPLETED December 11, 2024:
- [x] Sprint 3.3.1: Pattern detection engine (pattern-detector.ts)
- [x] Sprint 3.3.2: Humanization prompt (prompts/humanization.ts)
- [x] Sprint 3.3.3: Humanization API & UI (streaming endpoint, use-humanization hook)
- [x] Sprint 3.3.4: Pattern rule management (ai-rules.ts actions, ai-rules pages)

**Milestone 3.4 - Brand Voice** - DEFERRED:
- [ ] Sprint 3.4.1: Brand extraction prompt
- [ ] Sprint 3.4.2: Brand discovery integration

### Phase 4: External APIs (Weeks 10-13)
**GitHub Issues**: #10, #11, #13, #14

**Milestone 4.1 - Firecrawl**:
- [ ] Sprint 4.1.1: Firecrawl client wrapper
- [ ] Sprint 4.1.2: Crawl job management
- [ ] Sprint 4.1.3: Brand discovery UI integration
- [ ] Sprint 4.1.4: Incremental crawling

**Milestone 4.2 - DataForSEO**:
- [ ] Sprint 4.2.1: DataForSEO client wrapper
- [ ] Sprint 4.2.2: SEO service & keyword opportunities
- [ ] Sprint 4.2.3: SEO optimization UI
- [ ] Sprint 4.2.4: Caching & cost optimization (Upstash Redis)

**Milestone 4.3 - Cross-Linking**:
- [ ] Sprint 4.3.1: Page summary generation
- [ ] Sprint 4.3.2: Link suggestion engine
- [ ] Sprint 4.3.3: Cross-linking UI

**Milestone 4.4 - Rate Limiting**:
- [ ] Sprint 4.4.1: Rate limiter implementation
- [ ] Sprint 4.4.2: Quota management

### Phase 5: Polish & Production (Weeks 14-16)
**GitHub Issues**: #15, #16, #17, #18

**Milestone 5.1 - Rich Text Editor**:
- [ ] Sprint 5.1.1: Tiptap setup & basic editor
- [ ] Sprint 5.1.2: Advanced editor features

**Milestone 5.2 - Error Handling**:
- [ ] Sprint 5.2.1: Error handling framework
- [ ] Sprint 5.2.2: Retry & fallback logic

**Milestone 5.3 - Performance**:
- [ ] Sprint 5.3.1: Database query optimization
- [ ] Sprint 5.3.2: Frontend performance

**Milestone 5.4 - Security**:
- [ ] Sprint 5.4.1: Security review
- [ ] Sprint 5.4.2: Penetration testing

**Milestone 5.5 - Deployment**:
- [ ] Sprint 5.5.1: Environment setup
- [ ] Sprint 5.5.2: Monitoring & analytics
- [ ] Sprint 5.5.3: Deployment & launch
- [ ] Sprint 5.5.4: Post-launch monitoring

### Phase 6: Mock Data Migration - CREATED December 10, 2024
**GitHub Issues**: #27, #28, #29

**CRITICAL BLOCKER IDENTIFIED**: Mixed mock data and real Supabase data causing:
- 401 authentication errors in API routes
- Confusion between mock IDs and real UUIDs
- 22 files still importing from `/src/lib/mock-data/index.ts`

**Issue #27 - Database Seed Scripts** (1-2 days):
- [ ] Create comprehensive seed scripts for all 21 tables
- [ ] Seed test user, team, brand, brand_profile
- [ ] Seed sample articles in various workflow states
- [ ] Seed AI pattern rules (global + team-specific)
- GitHub: https://github.com/jotapess/contentbeagle/issues/27

**Issue #28 - Migrate Critical Pages** (2-3 days):
- [ ] Migrate dashboard page to real data
- [ ] Migrate brands list and detail pages
- [ ] Migrate articles list and editor pages
- [ ] Migrate settings/api-keys page
- GitHub: https://github.com/jotapess/contentbeagle/issues/28

**Issue #29 - Complete Migration & Cleanup** (2-3 days):
- [ ] Migrate remaining pages (team, ai-rules, settings)
- [ ] Remove `/src/lib/mock-data/index.ts`
- [ ] Update all imports to use server actions
- [ ] Final testing of all routes with real data
- GitHub: https://github.com/jotapess/contentbeagle/issues/29

**Files Currently Using Mock Data** (22 files):
```
src/app/(dashboard)/ai-rules/[ruleId]/page.tsx
src/app/(dashboard)/ai-rules/new/page.tsx
src/app/(dashboard)/ai-rules/page.tsx
src/app/(dashboard)/articles/[articleId]/history/page.tsx
src/app/(dashboard)/articles/[articleId]/humanize/page.tsx
src/app/(dashboard)/articles/[articleId]/layout.tsx
src/app/(dashboard)/articles/[articleId]/links/page.tsx
src/app/(dashboard)/articles/[articleId]/page.tsx
src/app/(dashboard)/articles/[articleId]/seo/page.tsx
src/app/(dashboard)/articles/new/page.tsx
src/app/(dashboard)/articles/page.tsx
src/app/(dashboard)/brands/[brandId]/crawled/page.tsx
src/app/(dashboard)/brands/[brandId]/page.tsx
src/app/(dashboard)/brands/[brandId]/profile/page.tsx
src/app/(dashboard)/brands/[brandId]/settings/page.tsx
src/app/(dashboard)/brands/new/page.tsx
src/app/(dashboard)/brands/page.tsx
src/app/(dashboard)/dashboard/page.tsx
src/app/(dashboard)/settings/api-keys/page.tsx
src/app/(dashboard)/settings/usage/page.tsx
src/app/(dashboard)/team/page.tsx
src/components/layout/team-switcher.tsx
```

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

### Implementation Roadmap
- `/docs/IMPLEMENTATION-ROADMAP.md` - **57 sprints** across 16 weeks, detailed tasks with acceptance criteria
- `/docs/ROADMAP-SUMMARY.md` - Executive overview with timeline, risk matrix, and success criteria
- `/docs/EXECUTION-ORDER.md` - **Day-by-day schedule** (110 days), daily checklists, milestone validation
- `/docs/VISUAL-ROADMAP.md` - ASCII diagrams of timeline, dependencies, and sprint distribution
- `/docs/RECOMMENDATIONS.md` - Strategic guidance, architecture patterns, optimization tips

### Phase 2 Code (Supabase Integration)
- `/supabase/migrations/` - All database migrations (7 files)
- `/src/lib/supabase/client.ts` - Browser client for client components
- `/src/lib/supabase/server.ts` - Server client + admin client
- `/src/lib/supabase/middleware.ts` - Session management and route protection logic
- `/src/lib/actions/` - Server actions (teams, brands, articles, profile)
- `/src/components/providers/auth-provider.tsx` - AuthContext + useAuth hook
- `/src/proxy.ts` - Next.js 16 proxy (renamed from middleware.ts, uses `proxy()` function)
- `/src/types/database.ts` - Auto-generated Supabase types
- `/.env.example` - Environment variable template

### Core UI Code
- `/src/lib/mock-data/index.ts` - Mock data (being replaced by server actions)
- `/src/types/index.ts` - TypeScript interfaces
- `/src/components/layout/` - Sidebar, Header, TeamSwitcher
- `/src/app/(dashboard)/layout.tsx` - Protected dashboard layout
- `/src/app/(dashboard)/onboarding/page.tsx` - New user team creation

### Phase 3 Code (AI Integration) - Issues #7, #8, #9 COMPLETE

**AI Provider Layer** (`/src/lib/ai/`):
- `provider-registry.ts` - BYOK provider registry, model configs for OpenAI/Anthropic/Google
- `generation-service.ts` - AIGenerationService with streaming support
- `brand-context.ts` - Brand profile loader for voice injection
- `pattern-detector.ts` - Pattern detection engine with AI score calculation (Issue #9)
- `index.ts` - Barrel exports for AI module

**AI Prompts** (`/src/lib/ai/prompts/`):
- `content-generation.ts` - Brand-aware prompt builder (tone, vocabulary, power words)
- `humanization.ts` - Humanization prompts with brand voice injection (Issue #9)
- `index.ts` - Prompts barrel export

**API Routes**:
- `/src/app/api/ai/test/route.ts` - Provider test endpoint
- `/src/app/api/content/generate/route.ts` - Streaming generation endpoint
- `/src/app/api/content/detect/route.ts` - Pattern detection endpoint (Issue #9)
- `/src/app/api/content/humanize/route.ts` - Streaming humanization endpoint (Issue #9)

**Server Actions** (`/src/lib/actions/`):
- `api-keys.ts` - API key CRUD operations
- `ai-usage.ts` - Token usage tracking with cost estimation
- `ai-rules.ts` - AI pattern rules CRUD and team overrides (Issue #9)

**Hooks** (`/src/hooks/`):
- `use-ai-generation.ts` - Frontend hook with abort support, streaming state
- `use-humanization.ts` - Detection + humanization hook (Issue #9)
- `index.ts` - Hooks barrel export

**Updated Pages**:
- `/src/app/(dashboard)/articles/new/page.tsx` - Real generation with live streaming preview
- `/src/app/(dashboard)/articles/[articleId]/humanize/humanize-page-client.tsx` - Real pattern detection and humanization (Issue #9)
- `/src/app/(dashboard)/ai-rules/page.tsx` - Server component with real data (Issue #9)
- `/src/app/(dashboard)/ai-rules/ai-rules-client.tsx` - Client component with filtering and toggles (Issue #9)

### Future Implementation (Phase 4+)
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

## Risk Areas & Mitigations

### High-Risk Areas (Prototype First)

| Risk Area | Why It's Risky | Mitigation Strategy |
|-----------|----------------|---------------------|
| **Supabase Vault** | Complex encryption/decryption, edge cases | Prototype in Week 1, add comprehensive error handling |
| **AI Streaming** | Provider differences, token tracking during stream | Test with all 3 providers early, build abstraction layer |
| **Firecrawl Costs** | Crawling large sites expensive | Implement incremental crawling from Day 1, smart URL filtering |
| **RLS Complexity** | Data leakage risk, performance impact | Profile queries early, extensive multi-tenant isolation testing |

### Medium-Risk Areas

| Risk Area | Mitigation |
|-----------|------------|
| AI output quality | Dedicated prompt engineering time, test with real brand content |
| Token costs | Cost estimation before generation, user budget controls |
| DataForSEO expenses | Aggressive caching (30-day TTL), batch keyword lookups |
| Pattern detection false positives | Allow rule customization, confidence thresholds |

### Cross-Cutting Concerns

These span multiple phases and need attention throughout:
1. **Testing** - Incremental, not at the end. Write tests alongside features.
2. **Documentation** - Update API docs as endpoints are built
3. **Security** - Weekly security checklist reviews
4. **Performance** - Profile database queries regularly

---

## GitHub Issue Tracking

**Repository**: https://github.com/jotapess/contentbeagle.git
**Latest Commit**: (check git log)
**Branch**: main

### All Issues (#1-#29)

| Phase | Issues | Description | Status |
|-------|--------|-------------|--------|
| Phase 2 | #2, #3, #4, #5 | Migrations, RLS, auth, data layer | **CLOSED** |
| Phase 2 | #20, #25, #26 | Invitations, seed, backup | OPEN (deferred) |
| Phase 3 | #7 | BYOK provider registry | **CLOSED** |
| Phase 3 | #8 | Content generation pipeline | **IN PROGRESS** (401 auth errors) |
| Phase 3 | #9 | AI pattern removal (humanization) | BLOCKED (by #8, mock data) |
| Phase 4 | #10, #11, #13, #14 | External APIs, Firecrawl, DataForSEO | OPEN |
| Phase 5 | #15, #16, #17, #18, #21, #22, #23, #24 | Polish, editor, testing, security | OPEN |
| **Phase 6** | **#27, #28, #29** | **Mock data migration** | **OPEN - RECOMMENDED NEXT** |

**Note:** Issue #19 was CLOSED as duplicate (merged into #2)

### Phase 2 Issues - COMPLETED

| Issue | Title | Status | Completed |
|-------|-------|--------|-----------|
| #2 | Database Migrations | CLOSED | Dec 10, 2024 |
| #3 | RLS Policies | CLOSED | Dec 10, 2024 |
| #4 | Authentication | CLOSED | Dec 10, 2024 |
| #5 | Data Layer | CLOSED | Dec 10, 2024 |

### Phase 3 Issues - COMPLETED (100%)

| Issue | Title | Status | Completed |
|-------|-------|--------|-----------|
| #7 | Vercel AI SDK + BYOK | CLOSED | Dec 10, 2024 |
| #8 | Content Generation Pipeline | CLOSED | Dec 10, 2024 |
| #9 | AI Pattern Removal (Humanization) | CLOSED | Dec 11, 2024 |

### Phase 6 Issues - RECOMMENDED NEXT

| Issue | Title | Status | Estimate | URL |
|-------|-------|--------|----------|-----|
| #27 | Database Seed Scripts | OPEN | 1-2 days | https://github.com/jotapess/contentbeagle/issues/27 |
| #28 | Migrate Critical Pages | OPEN | 2-3 days | https://github.com/jotapess/contentbeagle/issues/28 |
| #29 | Complete Migration & Cleanup | OPEN | 2-3 days | https://github.com/jotapess/contentbeagle/issues/29 |

### Project Board
Issues are organized on the "Content Beagle Project" board (ID: PVT_kwHOAr5cW84BKU7C).

---

## Agent Analysis Summary (December 10, 2024)

### Product Manager Agent Findings - Initial Planning
- Created 57 sprints across 16 weeks
- Identified optimal execution order (110 days)
- Recommended 7-batch approach to minimize context switching
- Flagged parallel work opportunities after Phase 2

### Product Manager Agent Findings - Phase 2 Detail Planning
- Decomposed 7 Phase 2 issues into 62+ granular sub-tasks
- Created comprehensive done criteria for Phase 2 (30+ checkboxes)
- Established critical path: #2 -> #3 -> #4 -> #5
- Identified parallel work opportunities: #20, #25, #26 after #4
- Created 2 new issues: #25 (Seed Data), #26 (Backup Procedures)
- Closed #19 as duplicate (merged into #2)
- Calculated total Phase 2 effort: 17 days (3-4 weeks)

### Project Orchestrator Agent Findings
- Gap analysis: 6 areas not covered by current issues
- Issue decomposition: #5 and #8 should be split
- Cross-cutting concerns: testing, documentation, security
- Risk assessment: Vault complexity, AI quality, external API costs
- Agent allocation: Can use 2-3 developers in parallel after Week 4

### Implementation Recommendations
1. **Don't rush RLS policies** - Security is paramount for multi-tenancy
2. **Invest in prompt engineering** - Core product quality depends on it
3. **Implement caching aggressively** - Control external API costs
4. **Test continuously** - Not just at the end
5. **Document as you go** - Future sessions need context
6. **Follow the critical path** - Database -> RLS -> Auth -> Data Layer (no shortcuts)

---

## User Preferences & Workflow

### Commit Preferences
- **No Claude attribution** in commit messages (no "Generated by Claude" footer)
- Standard commit message format

### Development Workflow
1. **PM defines phase** - Product Manager creates comprehensive phase plan
2. **Document ALL issues** - Create/update GitHub issues with detailed sub-tasks
3. **Development (issue-by-issue)** - Work through issues in dependency order
4. **Close issues on completion** - Mark issues closed when all sub-tasks done

### Approach Preferences
- **Frontend-first with mock data** - Build UI before backend integration
- **Proactive context preservation** - Update CLAUDE.md after significant work
- **Server-first data fetching** - Use server actions over client-side fetching

---

## Known Constraints & Gotchas

### Current Limitations (December 10, 2024)
- **CRITICAL**: 22 files still use mock data - blocking reliable Phase 3 testing
- Issue #8 (Content Generation) has 401 auth errors - needs mock data migration first
- Issue #9 (AI humanization) blocked by #8 and mock data issues
- Tiptap editor not yet integrated
- Team invitations not yet implemented (requires Resend)
- Mock data creates confusion between fake IDs and real Supabase UUIDs

### Technical Notes
- Using Next.js 16 with React 19 (latest)
- Tailwind CSS v4 (new syntax)
- All shadcn/ui components already installed

### Next.js 16 Breaking Changes (CRITICAL)

**Middleware Renamed to Proxy**:
- File renamed: `middleware.ts` -> `proxy.ts`
- Function renamed: `middleware()` -> `proxy()`
- Location: `/src/proxy.ts`
- The file still imports from `/src/lib/supabase/middleware.ts` for auth logic
- Config export remains the same (`matcher` array)

```typescript
// OLD (Next.js 15)
// src/middleware.ts
export async function middleware(request: NextRequest) { ... }

// NEW (Next.js 16)
// src/proxy.ts
export async function proxy(request: NextRequest) { ... }
```

### Vercel AI SDK v5 Gotchas (CRITICAL for Future Sessions)

**Token Parameter Names**:
- Use `maxOutputTokens` NOT `maxTokens` - the parameter name changed in v5
- Usage object returns `inputTokens`/`outputTokens` NOT `promptTokens`/`completionTokens`

**Database Column Names**:
- `api_providers` table uses `id` as the slug (e.g., "openai", "anthropic", "google")
- `ai_usage_log` uses `provider` and `feature` columns (NOT provider_id, operation)
- `ai_usage_log.feature` examples: "content_generation", "humanization"

**Brand Profile Schema Reality**:
- `brand_profiles` does NOT have `target_audience` or `writing_rules` columns
- Use `brands.target_audience` for target audience data
- Use `brand_profiles.do_list` and `brand_profiles.dont_list` for writing rules
- Brand voice injection pulls from: tone, vocabulary, power_words, do_list, dont_list

### Streaming Pattern Reference

```typescript
// API Route (server)
import { streamText } from 'ai';
const result = streamText({ model, messages, maxOutputTokens });
return result.toDataStreamResponse();

// Frontend Hook
const response = await fetch('/api/content/generate', { body, signal });
const reader = response.body.getReader();
// Read chunks and update UI progressively
```

### Future Considerations (Post-MVP)
- Content calendar and scheduling
- WordPress/CMS integrations
- Collaborative real-time editing
- Custom AI model fine-tuning
- White-label option for agencies
- Content performance analytics

---

## Environment Variables (Phase 3+)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Providers (development fallback - production uses BYOK from user_api_keys)
OPENAI_API_KEY=          # Fallback for OpenAI models (gpt-4o, gpt-4o-mini)
ANTHROPIC_API_KEY=       # Fallback for Anthropic models (claude-sonnet-4, claude-opus-4-5)
GOOGLE_AI_API_KEY=       # Fallback for Google models (gemini-1.5-pro)

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# External APIs (Phase 4)
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

### When Starting a New Session:
1. Review this CLAUDE.md for current state and recent progress
2. Check GitHub issues for latest status: `gh issue list`
3. Review `/docs/EXECUTION-ORDER.md` for day-by-day tasks
4. Follow established component patterns in existing code

### RECOMMENDED NEXT SESSION PRIORITIES (December 11, 2024):

**Priority 0: GitHub Issue Checklist Audit Cleanup** ⚠️
Audit found 92 UNCHECKED checklist items across 6 closed issues:

| Issue | Title | Unchecked Items |
|-------|-------|-----------------|
| #2 | Database migrations | 15 |
| #3 | RLS policies | 21 |
| #4 | Auth middleware | 24 |
| #5 | Data layer | 27 |
| #8 | Content generation | 5 |

**Work is DONE** (verified in closing comments) but checklists were never updated.

Action items:
1. Re-open issues #2, #3, #4, #5, #8 temporarily
2. Verify each checklist item against actual code/files
3. Check off verified items
4. Re-close with updated checklists
5. Updated `github-issue-architect` agent to prevent this in future

**Priority 1: Complete Phase 6 - Mock Data Migration**
The mixed mock/real data is blocking reliable testing of Phase 3 features.

1. **Start with Issue #27** (Database Seed Scripts)
   - Create seed scripts for test data in Supabase
   - URL: https://github.com/jotapess/contentbeagle/issues/27
   - This establishes reliable test data

2. **Then Issue #28** (Migrate Critical Pages)
   - Dashboard, brands, articles pages to real data
   - URL: https://github.com/jotapess/contentbeagle/issues/28

3. **Finally Issue #29** (Complete Migration)
   - Remove `/src/lib/mock-data/index.ts` entirely
   - URL: https://github.com/jotapess/contentbeagle/issues/29

**Priority 2: Complete Issue #8 (Content Generation)**
After mock data migration, test content generation with real data:
- The 401 auth errors should be resolved with proper auth context
- Test with real brand and article data from Supabase

**Priority 3: Issue #9 (Humanization)**
Only after #8 is fully working with real data.

### Key Files for Next Session:

**Mock Data Migration (Phase 6)**:
- `/src/lib/mock-data/index.ts` - The file to eventually remove
- `/supabase/migrations/` - Reference for table schemas
- `/src/lib/actions/` - Server actions already built (use these!)

**Content Generation Debugging (Issue #8)**:
- `/src/app/api/content/generate/route.ts` - Has debug logging, check for 401 errors
- `/src/hooks/use-ai-generation.ts` - Has `credentials: 'include'` fix applied
- `/src/proxy.ts` - New Next.js 16 proxy file (was middleware.ts)
- `/src/lib/supabase/middleware.ts` - Auth logic used by proxy

**AI Integration Reference**:
- `/src/lib/ai/provider-registry.ts` - How to get AI provider instances
- `/src/lib/ai/generation-service.ts` - AIGenerationService pattern
- `/src/lib/ai/prompts/content-generation.ts` - Prompt building pattern

### Issue #8 Known Problems (December 10, 2024):

1. **401 Auth Errors**: Content generation API returning 401
   - Multiple fixes applied but not fully tested
   - Likely caused by mixed mock data confusing auth context

2. **Fixes Applied During Session**:
   - Changed to admin client for bypassing RLS
   - Added PROVIDER_MAP for model-to-provider lookup
   - Added topic_only mode support
   - Added `credentials: 'include'` to frontend fetch
   - Renamed middleware.ts to proxy.ts for Next.js 16

3. **Root Cause Identified**: 22 files still use mock data
   - Creates confusion between mock IDs and real UUIDs
   - Auth context gets corrupted with mixed data sources

### When Completing Work (CRITICAL - GitHub Issue Protocol):

**MANDATORY: Before closing ANY GitHub issue, you MUST:**
1. **Read the issue body**: `gh issue view <number>`
2. **Update EVERY checkbox** in the issue body with `gh issue edit <number> --body "..."`
   - Check (`[x]`) items that are complete
   - Leave unchecked (`[ ]`) items that are deferred/incomplete with a note
3. **Verify checkboxes are accurate** before closing
4. **Add closing comment** summarizing what was done

**Issue Closing Workflow:**
```bash
# 1. Read issue to see all checkboxes
gh issue view 27

# 2. Update issue body with checked boxes (REQUIRED)
gh issue edit 27 --body "$(cat <<'EOF'
## Summary
...existing content with [ ] changed to [x]...
EOF
)"

# 3. Close with verification comment
gh issue close 27 --comment "Verified all checkboxes. Completed: X, Y, Z. Deferred: A (reason)."
```

**Other completion tasks:**
- Document any gotchas discovered in the appropriate section
- Note architectural decisions that deviate from the plan
- **Update CLAUDE.md** with phase completion summary (per user preference)

### Quick Status Check Commands:
```bash
# View all issues
gh issue list

# View project board
gh project list

# Check specific issue
gh issue view <number>

# Run dev server
npm run dev

# Generate Supabase types
npx supabase gen types typescript --project-id eiowwhicvrtawgotvswt > src/types/database.ts

# Check which files still use mock data
grep -r "mock-data" src/ --include="*.tsx" --include="*.ts" -l
```

### Key Planning Documents:
- **Day-by-day plan**: `/docs/EXECUTION-ORDER.md`
- **Detailed sprints**: `/docs/IMPLEMENTATION-ROADMAP.md`
- **Risk guidance**: `/docs/RECOMMENDATIONS.md`
- **Executive summary**: `/docs/ROADMAP-SUMMARY.md`

---

*Last Updated: December 11, 2024 - Phase 3 COMPLETE (Issues #7, #8, #9 all CLOSED). AI pattern detection, humanization, and rules management fully implemented. Phase 4 (External APIs - Firecrawl, DataForSEO) or Phase 6 (Mock Data Migration) are recommended next.*
