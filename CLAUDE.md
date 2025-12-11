# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

---

## Project Overview

**ContentBeagle** - Multi-tenant SaaS for brand-aligned long-form content creation with AI-powered generation, SEO optimization, humanization, and cross-linking.

**Repository**: https://github.com/jotapess/contentbeagle

### Current Status: Phase 5 IN PROGRESS (Polish & Production)

| Phase | Status | Details |
|-------|--------|---------|
| Phase 1 | DONE | Frontend with mock data (27 routes) |
| Phase 2 | DONE | Supabase (21 tables, RLS, auth) |
| Phase 3 | DONE | AI integration (BYOK, generation, humanization) |
| Phase 4 | DONE | External APIs (Firecrawl, DataForSEO, cross-linking) |
| Phase 5 | **IN PROGRESS** | Polish & Production |

**Phase 5 Priority Order**: #21 (Tiptap) → #16 (errors) → #23 (testing) → #24 (security) → #22 (monitoring) → #18 (deploy)

For detailed phase history, see `/docs/PHASE-HISTORY.md`

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16+ (App Router), React 19 |
| Styling | Tailwind CSS v4, shadcn/ui + Radix |
| Forms | react-hook-form + zod |
| State | Zustand |
| Database | Supabase (PostgreSQL) - 21 tables |
| Auth | Supabase Auth |
| AI | Vercel AI SDK v5 (BYOK) |
| Editor | Tiptap (to be integrated) |
| Crawling | Firecrawl API |
| SEO | DataForSEO |
| Deployment | Vercel |

---

## Supabase Details

| Property | Value |
|----------|-------|
| Project Ref | eiowwhicvrtawgotvswt |
| URL | https://eiowwhicvrtawgotvswt.supabase.co |

**Tables (21)**: teams, team_members, profiles, brands, brand_profiles, brand_competitors, articles, article_versions, article_workflow_log, article_comments, crawl_jobs, crawled_pages, crawl_usage_log, ai_pattern_rules_global, ai_pattern_rules, ai_usage_log, api_providers, user_api_keys, keyword_research, keyword_cache, seo_usage_log

---

## Development Commands

```bash
npm run dev              # Dev server (http://localhost:3000)
npm run build            # Production build
npm run lint             # ESLint

# Supabase
npx supabase gen types typescript --project-id eiowwhicvrtawgotvswt > src/types/database.ts
npx supabase db push --project-ref eiowwhicvrtawgotvswt
```

---

## Project Structure (Key Paths)

```
src/
├── app/
│   ├── api/content/          # AI endpoints (generate, detect, humanize)
│   ├── api/webhooks/         # Firecrawl webhook
│   ├── (auth)/               # Login, signup, forgot-password
│   └── (dashboard)/          # Protected routes
│       ├── brands/[brandId]/ # Brand management
│       ├── articles/[articleId]/ # Article editor, SEO, links, humanize
│       ├── ai-rules/         # Pattern rules
│       ├── team/             # Team management
│       └── settings/         # User settings, API keys
├── components/
│   ├── ui/                   # shadcn/ui (26 components)
│   ├── layout/               # Sidebar, Header
│   └── features/             # Feature-specific components
├── lib/
│   ├── supabase/             # client.ts, server.ts, middleware.ts
│   ├── ai/                   # provider-registry, prompts/, generation
│   ├── actions/              # Server actions (teams, brands, articles, etc.)
│   ├── services/             # firecrawl/, dataforseo/, cross-linking/
│   └── cache/                # keyword-cache.ts
├── hooks/                    # use-ai-generation, use-humanization
└── types/                    # index.ts, database.ts (auto-generated)
```

**Documentation**: `/docs/PRD.md`, `/docs/DATABASE.md`, `/docs/AI-PIPELINE.md`, `/docs/INTEGRATIONS.md`

---

## Key Architectural Decisions

- **Multi-tenancy**: Team-based with RLS. All data scoped via `team_id`. Helpers: `is_team_member()`, `has_team_role()`
- **BYOK**: Users provide AI API keys, encrypted in Supabase Vault. Supports OpenAI, Anthropic, Google
- **Server-first**: All data operations use server actions, not client-side fetching
- **Streaming-first**: All AI generation endpoints use streaming responses
- **Article workflow**: `draft → editing → seo_review → cross_linking → humanizing → polished → approved → published`

---

## Critical Gotchas

### Next.js 16 Breaking Change
```typescript
// Middleware renamed to Proxy
// File: /src/proxy.ts (was middleware.ts)
export async function proxy(request: NextRequest) { ... }  // was middleware()
```

### Vercel AI SDK v5
- Use `maxOutputTokens` NOT `maxTokens`
- Usage: `inputTokens`/`outputTokens` NOT `promptTokens`/`completionTokens`
- `api_providers.id` is the slug (e.g., "openai", "anthropic")

### Database Schema Notes
- `brand_profiles` does NOT have `target_audience` or `writing_rules` columns
- Use `brands.target_audience` for audience data
- Use `brand_profiles.do_list` and `dont_list` for writing rules

### Type Patterns
```typescript
// Date null handling
{date ? new Date(date).toLocaleDateString() : "-"}

// Sort with nullable dates
.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))

// Complex relation casts
as unknown as TeamMemberWithUser[]
```

### Streaming Pattern
```typescript
// API Route
import { streamText } from 'ai';
const result = streamText({ model, messages, maxOutputTokens });
return result.toDataStreamResponse();

// Frontend
const response = await fetch('/api/content/generate', { body, signal });
const reader = response.body.getReader();
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI (dev fallback - production uses BYOK)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=

# External APIs
FIRECRAWL_API_KEY=
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=

# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Phase 5 Open Issues

| Priority | Issue | Title | Blockers |
|----------|-------|-------|----------|
| 1 | #21 | Tiptap rich text editor | None |
| 2 | #16 | Error handling framework | None |
| 3 | #23 | Testing infrastructure | None |
| 4 | #24 | Security audit | None |
| 5 | #22 | Monitoring & analytics | None |
| 6 | #18 | Deploy to Vercel | #24, #22 |

**Deferred**: #20 (Team invitations - needs Resend), #26 (Backup docs)

---

## User Preferences

- **No Claude attribution** in commit messages
- **Frontend-first** approach with mock data
- **Server-first** data fetching
- **Update CLAUDE.md** after significant work

---

## GitHub Issue Protocol

**Before closing ANY issue:**
1. `gh issue view <number>` - Read all checkboxes
2. `gh issue edit <number> --body "..."` - Check off completed items
3. `gh issue close <number> --comment "..."` - Summarize completion

---

## Session Quick Start

```bash
gh issue list              # Check current issues
npm run dev                # Start dev server
gh issue view <number>     # View specific issue
```

**Key docs**: `/docs/EXECUTION-ORDER.md` (day-by-day), `/docs/PHASE-HISTORY.md` (archived details)

---

*Last Updated: December 11, 2024 - Phases 1-4 COMPLETE. Phase 5 IN PROGRESS.*
