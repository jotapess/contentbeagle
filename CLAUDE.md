# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**ContentBeagle** is a multi-tenant SaaS platform for brand-aligned long-form content creation. It combines AI-powered content generation with brand discovery, SEO optimization, AI pattern removal (humanization), and intelligent cross-linking.

**Repository**: https://github.com/jotapess/contentbeagle

### Current Status: Phase 1 COMPLETE - Phase 2 Detailed Planning Complete

**Phase 1 (Frontend with Mock Data)** - COMPLETED December 2024
- 27 routes built with Next.js 14+ App Router
- All UI modules functional: Auth, Brands, Articles, AI Rules, Team, Settings
- Mock data layer for all entities (users, teams, brands, articles, etc.)
- shadcn/ui components integrated with Tailwind CSS v4

**Planning Milestone** - COMPLETED December 10, 2024
- Comprehensive implementation roadmap created (57 sprints, 16 weeks)
- Detailed day-by-day execution order (110 days)
- Risk analysis and mitigation strategies documented
- GitHub issues #1-#18 created and organized on project board

**Phase 2 Detailed Planning** - COMPLETED December 10, 2024
- Product Manager created granular sub-task breakdown for all Phase 2 issues
- 7 active Phase 2 issues with 62+ sub-tasks defined
- Critical path established: #2 -> #3 -> #4 -> #5 -> Phase 3+
- Total effort: 17 days (3-4 weeks with 1 developer)

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

### Phase 2: Supabase Integration (Weeks 1-4) - READY TO START
**GitHub Issues**: #1 (Epic), #2, #3, #4, #5, #20, #25, #26
**Issue #19**: CLOSED (merged into #2 - duplicate of migration work)

#### Development Workflow
**IMPORTANT**: All Phase 2 development is tied to individual GitHub issues. Before starting work:
1. Check the relevant GitHub issue for the complete sub-task checklist
2. Update issue checkboxes as tasks are completed
3. Reference the issue number in commit messages

---

#### Issue #2: Database Migrations (2 days) - CRITICAL PATH START
**8 sub-tasks defined** | Blocks: #3, #4, #5

**Migration Files to Create:**
1. `01_core_tables.sql` - teams, team_members, profiles
2. `02_brand_content_tables.sql` - brands, brand_profiles, articles, article_versions, comments, article_workflow_log
3. `03_crawl_ai_tables.sql` - crawled_pages, crawl_jobs, ai_pattern_rules, user_api_keys (Vault)
4. `04_seo_usage_tables.sql` - keyword_research, ai_usage_log, seo_usage_log
5. `05_indexes_fts.sql` - performance indexes, full-text search

**Done Criteria:**
- [ ] All 21 tables created with foreign keys and constraints
- [ ] Performance indexes on frequently queried columns
- [ ] Full-text search on articles.content and crawled_pages.content
- [ ] Schema matches /docs/DATABASE.md exactly

---

#### Issue #3: Row-Level Security (3 days) - CRITICAL PATH
**13 sub-tasks defined** | Requires: #2 | Blocks: #4, #5

**RLS Helper Functions:**
1. `is_team_member(team_id)` - check team membership
2. `has_team_role(team_id, roles[])` - check role permissions
3. `get_user_teams()` - return user's team list

**RLS Policies for All 21 Tables:**
- teams, team_members, profiles (core)
- brands, brand_profiles, brand_competitors
- articles, article_versions, article_workflow_log, article_comments
- crawl_jobs, crawled_pages
- ai_pattern_rules, ai_pattern_rules_global
- user_api_keys, api_providers
- ai_usage_log, seo_usage_log, crawl_usage_log
- keyword_research, keyword_cache

**Role Permissions Hierarchy:**
```
owner > admin > editor > viewer
```

**Done Criteria:**
- [ ] RLS enabled on all 21 tables
- [ ] Team isolation enforced (no cross-team data leakage)
- [ ] Role-based permissions working for all CRUD operations
- [ ] /docs/RLS-POLICIES.md documentation created

---

#### Issue #4: Authentication (3 days) - CRITICAL PATH
**12 sub-tasks defined** | Requires: #2, #3 | Blocks: #5

**Auth Methods:**
- Email/password authentication
- Google OAuth (requires Google Cloud Console setup)
- GitHub OAuth (requires GitHub App setup)

**Implementation Components:**
- `/src/lib/supabase/client.ts` - createBrowserClient()
- `/src/lib/supabase/server.ts` - createServerClient()
- `/src/middleware.ts` - auth middleware for /dashboard routes
- `/src/contexts/auth-context.tsx` - AuthProvider + useAuth hook
- `/src/app/auth/callback/route.ts` - OAuth callback handler

**Done Criteria:**
- [ ] All 3 auth methods working
- [ ] Middleware protecting /dashboard routes
- [ ] Sessions persist across page reloads
- [ ] Profile auto-created on first sign-up
- [ ] Password reset flow working

---

#### Issue #5: Data Layer (5 days) - LARGEST EFFORT - CRITICAL PATH
**15 sub-tasks defined** | Requires: #2, #3, #4 | Blocks: Phase 3+

**Server Actions to Implement:**
- Teams: createTeam, updateTeam, listTeams, addMember, removeMember
- Profiles: getProfile, updateProfile
- Brands: createBrand, updateBrand, deleteBrand, listBrands, getBrandWithProfile
- Articles: createArticle, updateArticle, deleteArticle, listArticles, updateStatus, createVersion, getVersionHistory
- Crawled Pages: listCrawledPages, searchCrawledPages (full-text search)
- AI Rules: listRules, createRule, updateRule, deleteRule, toggleRule
- API Keys (Vault): storeApiKey, getApiKey, deleteApiKey, testApiKey
- Usage: logAiUsage, logSeoUsage, getUsageStats
- SEO: listKeywordResearch, saveKeywordData

**Key Features:**
- Auto-save: Save article draft every 30 seconds
- Versioning: New version on publish, restore previous versions
- Vault encryption: API keys encrypted at rest
- Zod validation: All inputs validated before database operations

**Done Criteria:**
- [ ] Zero imports from mock-data.ts anywhere in codebase
- [ ] All CRUD operations working for all entities
- [ ] Auto-save and versioning implemented
- [ ] Vault encryption working for API keys
- [ ] Full-text search working on articles and crawled pages

---

#### Issue #20: Team Invitations (2.5 days) - PARALLEL WORK
**12 sub-tasks defined** | Requires: #2, #3, #4 | Can run parallel after #4

**Email Integration:**
- Resend email service integration
- Branded HTML email templates

**Invitation Flow:**
1. Admin invites member by email
2. Secure token generated, stored in `team_invitations` table
3. Email sent with accept/decline links
4. User clicks accept -> joins team, invitation marked accepted
5. Tokens expire after 7 days

**New Routes:**
- `/app/invite/accept/[token]/page.tsx`
- `/app/invite/decline/[token]/page.tsx`

**Done Criteria:**
- [ ] Invitation emails sent successfully
- [ ] Accept/decline flow working
- [ ] Expired invitations handled gracefully
- [ ] Admin notification on acceptance

---

#### Issue #25: Seed Data (0.5 days)
**7 sub-tasks defined** | Requires: #2 | No blockers

**Data to Seed:**
- 5 API Providers: OpenAI, Anthropic, Google AI, Firecrawl, DataForSEO
- 12 Global AI Pattern Rules: delve, in conclusion, leverage, robust, comprehensive, utilize, it's important to note, in today's digital landscape, revolutionary, game-changer, cutting-edge, seamlessly

**Done Criteria:**
- [ ] Migration `18_seed_data.sql` runs without errors
- [ ] Teams can see global rules in AI Rules page

---

#### Issue #26: Backup Procedures (1 day)
**8 sub-tasks defined** | Requires: #2 | No blockers

**Deliverables:**
- `/docs/DATABASE-BACKUP.md` - backup and restore procedures
- `/docs/MIGRATION-ROLLBACK.md` - rollback templates
- `/scripts/backup-db.sh` - manual backup script
- Emergency recovery procedure tested

---

#### Phase 2 Critical Path
```
#2 (Database - 2 days)
  |
  v
#3 (RLS - 3 days)
  |
  v
#4 (Auth - 3 days) -----> #20 (Invitations - 2.5 days, parallel)
  |
  v
#5 (Data Layer - 5 days)
  |
  v
Phase 3 (AI Integration)
```

**Parallel Work (after #4 completes):** #20, #25, #26
**Total Effort:** 17 days (3-4 weeks with 1 developer)

---

#### Phase 2 Done Criteria Summary (30+ checkboxes in Issue #1)

**Database:**
- 21 tables created with all FKs and constraints
- Performance indexes on all frequently queried columns
- Full-text search on articles.content and crawled_pages.content

**Security:**
- RLS enabled on all 21 tables
- Team isolation verified (no cross-team data leakage)
- Role-based permissions working (owner > admin > editor > viewer)
- Vault encryption for API keys

**Authentication:**
- Email/password, Google OAuth, GitHub OAuth all working
- Auth middleware protecting /dashboard routes
- Sessions persisting across page reloads
- Profile auto-created on sign-up

**Data Layer:**
- Zero imports from mock-data.ts
- All CRUD operations working
- Auto-save (30s) and versioning implemented
- Zod validation on all inputs

**Team Collaboration:**
- Invitation emails delivered via Resend
- Accept/decline flow working with token expiration

---

#### Phase 2 Risk Areas

| Risk | Impact | Mitigation |
|------|--------|------------|
| RLS complexity/performance | High | Profile queries early, extensive testing |
| Vault API key encryption | Medium | Prototype in Week 1, add error handling |
| OAuth setup complexity | Medium | Follow Supabase docs exactly, test each provider |
| Migration failures | Low | Test locally first, have rollback ready |

### Phase 3: AI Provider Integration (Weeks 5-9)
**GitHub Issues**: #6, #7, #8, #9, #12

**Milestone 3.1 - Provider Abstraction**:
- [ ] Sprint 3.1.1: Provider registry setup (Vercel AI SDK)
- [ ] Sprint 3.1.2: Generation service interface
- [ ] Sprint 3.1.3: Token estimation & usage tracking

**Milestone 3.2 - Content Generation**:
- [ ] Sprint 3.2.1: Prompt engineering foundation
- [ ] Sprint 3.2.2: Basic generation API with streaming
- [ ] Sprint 3.2.3: Frontend generation integration
- [ ] Sprint 3.2.4: SEO-aware generation

**Milestone 3.3 - AI Pattern Removal**:
- [ ] Sprint 3.3.1: Pattern detection engine
- [ ] Sprint 3.3.2: Humanization prompt
- [ ] Sprint 3.3.3: Humanization API & UI
- [ ] Sprint 3.3.4: Pattern rule management

**Milestone 3.4 - Brand Voice**:
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

### Implementation Roadmap (NEW - December 2024)
- `/docs/IMPLEMENTATION-ROADMAP.md` - **57 sprints** across 16 weeks, detailed tasks with acceptance criteria
- `/docs/ROADMAP-SUMMARY.md` - Executive overview with timeline, risk matrix, and success criteria
- `/docs/EXECUTION-ORDER.md` - **Day-by-day schedule** (110 days), daily checklists, milestone validation
- `/docs/VISUAL-ROADMAP.md` - ASCII diagrams of timeline, dependencies, and sprint distribution
- `/docs/RECOMMENDATIONS.md` - Strategic guidance, architecture patterns, optimization tips

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

### All Issues (#1-#26)

| Phase | Issues | Description |
|-------|--------|-------------|
| Phase 2 | #1, #2, #3, #4, #5, #20, #25, #26 | Supabase, migrations, RLS, auth, data layer, invitations, seed, backup |
| Phase 3 | #6, #7, #8, #9, #12 | AI integration, BYOK, generation, humanization, brand discovery |
| Phase 4 | #10, #11, #13, #14 | External APIs, Firecrawl, DataForSEO, cross-linking |
| Phase 5 | #15, #16, #17, #18, #21, #22, #23, #24 | Polish, editor, testing, security, monitoring, deployment |

**Note:** Issue #19 was CLOSED as duplicate (merged into #2)

### Phase 2 Issues (Active) - Detailed Planning Complete

| Issue | Title | Effort | Sub-tasks | Dependencies |
|-------|-------|--------|-----------|--------------|
| #1 | Phase 2: Supabase Integration (Epic) | - | 30+ done criteria | - |
| #2 | Database Migrations | 2 days | 8 | None (START HERE) |
| #3 | RLS Policies | 3 days | 13 | #2 |
| #4 | Authentication | 3 days | 12 | #2, #3 |
| #5 | Data Layer | 5 days | 15 | #2, #3, #4 |
| #20 | Team Invitations | 2.5 days | 12 | #2, #3, #4 |
| #25 | Seed Data | 0.5 days | 7 | #2 |
| #26 | Backup Procedures | 1 day | 8 | #2 |

### Issues Updated December 10, 2024

- **#1 (Phase 2 Epic)**: Updated with complete done criteria checklist (30+ items), dependency graph, timeline
- **#2 (Database)**: Updated with 5 migration file breakdown, 8 sub-tasks
- **#3 (RLS)**: Updated with 3 helper functions, policies for all 21 tables, 13 sub-tasks
- **#4 (Auth)**: Updated with 3 auth methods, implementation files, 12 sub-tasks
- **#5 (Data Layer)**: Updated with all server actions list, key features, 15 sub-tasks
- **#20 (Invitations)**: Updated with email flow, new routes, 12 sub-tasks
- **#25 (Seed Data)**: NEW - seed API providers and global AI rules
- **#26 (Backup)**: NEW - documentation and rollback procedures

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

### Future Considerations (Post-MVP)
- Content calendar and scheduling
- WordPress/CMS integrations
- Collaborative real-time editing
- Custom AI model fine-tuning
- White-label option for agencies
- Content performance analytics

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

### When Starting a New Session:
1. Review this CLAUDE.md for current state and recent progress
2. Check the Phase 2 section for issue details and dependencies
3. Review `/docs/EXECUTION-ORDER.md` for day-by-day tasks
4. Check GitHub issues for latest status: `gh issue list`
5. Reference mock data structure when implementing real data
6. Follow established component patterns in existing code

### When Starting Phase 2 Work:
1. Check which issue to work on based on critical path: #2 -> #3 -> #4 -> #5
2. Review the GitHub issue for complete sub-task checklist: `gh issue view <number>`
3. Update issue checkboxes as tasks are completed
4. Reference /docs/DATABASE.md for schema details
5. Test RLS policies thoroughly before moving to next issue

### When Completing Work:
1. Update GitHub issue checkboxes (primary source of truth)
2. Mark GitHub issues as complete when all sub-tasks done
3. Document any gotchas discovered in the appropriate section
4. Note architectural decisions that deviate from the plan
5. Update risk areas if new risks discovered
6. For Phase 2: verify done criteria in Issue #1 (Phase 2 Epic)

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
```

### Key Planning Documents:
- **Day-by-day plan**: `/docs/EXECUTION-ORDER.md`
- **Detailed sprints**: `/docs/IMPLEMENTATION-ROADMAP.md`
- **Risk guidance**: `/docs/RECOMMENDATIONS.md`
- **Executive summary**: `/docs/ROADMAP-SUMMARY.md`

---

*Last Updated: December 10, 2024 - Phase 2 Detailed Planning Complete (62+ sub-tasks, 7 issues, 17 days estimated)*
