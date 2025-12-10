# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**ContentBeagle** is a multi-tenant SaaS platform for brand-aligned long-form content creation. It combines AI-powered content generation with brand discovery, SEO optimization, AI pattern removal (humanization), and intelligent cross-linking.

**Repository**: https://github.com/jotapess/contentbeagle

### Current Status: Phase 1 COMPLETE - Phase 2 Ready to Start

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

### Phase 2: Supabase Integration (Weeks 1-4) - NEXT
**GitHub Issues**: #1, #2, #3, #4, #5

**Milestone 2.1 - Database Foundation** (Week 1):
- [ ] Sprint 2.1.1: Supabase project setup
- [ ] Sprint 2.1.2: Core multi-tenancy tables (teams, team_members, profiles)
- [ ] Sprint 2.1.3: Brand & content tables (8 tables)
- [ ] Sprint 2.1.4: Crawling & AI tables (13 tables)
- [ ] Sprint 2.1.5: Indexes & performance

**Milestone 2.2 - Row-Level Security** (Week 2):
- [ ] Sprint 2.2.1: RLS helper functions (is_team_member, has_team_role)
- [ ] Sprint 2.2.2: Core table RLS policies
- [ ] Sprint 2.2.3: Brand & article RLS policies
- [ ] Sprint 2.2.4: API keys & usage RLS

**Milestone 2.3 - Authentication** (Weeks 2-3):
- [ ] Sprint 2.3.1: Auth configuration (email, Google, GitHub)
- [ ] Sprint 2.3.2: Supabase client setup
- [ ] Sprint 2.3.3: Auth UI pages
- [ ] Sprint 2.3.4: Protected routes & middleware

**Milestone 2.4 - Data Migration** (Weeks 3-4):
- [ ] Sprint 2.4.1: Type generation & base queries
- [ ] Sprint 2.4.2: Team & user data migration
- [ ] Sprint 2.4.3: Brand data migration
- [ ] Sprint 2.4.4: Article data migration (XL - includes version history, workflow)
- [ ] Sprint 2.4.5: AI rules & settings data
- [ ] Sprint 2.4.6: Testing & validation

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

### All Issues (#1-#24)

| Phase | Issues | Description |
|-------|--------|-------------|
| Phase 2 | #1, #2, #3, #4, #5, #19, #20 | Supabase, migrations, RLS, auth, data layer, invitations |
| Phase 3 | #6, #7, #8, #9, #12 | AI integration, BYOK, generation, humanization, brand discovery |
| Phase 4 | #10, #11, #13, #14 | External APIs, Firecrawl, DataForSEO, cross-linking |
| Phase 5 | #15, #16, #17, #18, #21, #22, #23, #24 | Polish, editor, testing, security, monitoring, deployment |

### New Issues Created (#19-#24) - December 10, 2024

| Issue | Title | Phase |
|-------|-------|-------|
| #19 | Create Supabase migration files from schema documentation | Phase 2 |
| #20 | Implement team invitation system with email notifications | Phase 2 |
| #21 | Integrate Tiptap rich text editor for article content | Phase 5 |
| #22 | Set up monitoring and observability infrastructure | Phase 5 |
| #23 | Set up comprehensive testing infrastructure | Cross-cutting |
| #24 | Conduct security audit and implement hardening measures | Phase 5 |

### Issues Updated with Detailed Checklists

- **#5 (Data Layer)**: Updated with entity-by-entity breakdown (teams, brands, articles)
- **#8 (Content Generation)**: Updated with sub-tasks for generation, streaming, SEO integration

### Project Board
Issues are organized on the "Content Beagle Project" board (ID: PVT_kwHOAr5cW84BKU7C).

---

## Agent Analysis Summary (December 10, 2024)

### Product Manager Agent Findings
- Created 57 sprints across 16 weeks
- Identified optimal execution order (110 days)
- Recommended 7-batch approach to minimize context switching
- Flagged parallel work opportunities after Phase 2

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
2. Check the Implementation Timeline section for what's next
3. Review `/docs/EXECUTION-ORDER.md` for day-by-day tasks
4. Check GitHub issues for latest status: `gh issue list`
5. Reference mock data structure when implementing real data
6. Follow established component patterns in existing code

### When Completing Work:
1. Update sprint checkboxes in this file
2. Mark GitHub issues as complete when milestones finish
3. Document any gotchas discovered in the appropriate section
4. Note architectural decisions that deviate from the plan
5. Update risk areas if new risks discovered

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

*Last Updated: December 10, 2024 - Planning Milestone Complete, Phase 2 Ready to Start*
