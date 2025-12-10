# ContentBeagle - Optimal Execution Order

This document provides a day-by-day recommended execution order for building ContentBeagle Phases 2-5, optimized for minimal blockers and maximum efficiency.

**For detailed sprint descriptions**: See `/docs/IMPLEMENTATION-ROADMAP.md`
**For executive summary**: See `/docs/ROADMAP-SUMMARY.md`

---

## Week-by-Week Execution Plan

### WEEK 1: Database Foundation

#### Day 1: Project Setup
- **Sprint 2.1.1**: Supabase Project Setup (S)
  - Create Supabase project
  - Configure environment variables
  - Install and init Supabase CLI
  - Verify connection

#### Day 2: Core Tables
- **Sprint 2.1.2**: Core Multi-Tenancy Tables (M)
  - Create migration for teams, team_members, profiles
  - Add indexes
  - Run migration
  - Manual testing

#### Days 3-4: Brand & Content Tables
- **Sprint 2.1.3**: Brand & Content Tables (L)
  - Create brands, brand_profiles, articles, article_versions
  - Add workflow log, comments tables
  - Run migration
  - Validate schemas

#### Day 5: Supporting Tables
- **Sprint 2.1.4**: Crawling & AI Tables (M)
  - Create crawl_jobs, crawled_pages
  - Create AI rules tables
  - Create API keys and usage tables
  - Create SEO tables
  - Run migration

**END OF WEEK 1**: All 21 tables created ✅

---

### WEEK 2: Row-Level Security

#### Day 6: RLS Foundation
- **Sprint 2.1.5**: Indexes & Performance (S - 0.5 day)
  - Add all performance indexes
  - Verify with EXPLAIN ANALYZE
- **Sprint 2.2.1**: RLS Helper Functions (M - 0.5 day)
  - Create is_team_member(), has_team_role(), get_user_teams()
  - Test functions

#### Days 7-8: Core RLS Policies
- **Sprint 2.2.2**: Core Table RLS Policies (L)
  - Enable RLS on teams, team_members, profiles
  - Implement all SELECT/INSERT/UPDATE/DELETE policies
  - Test with different roles
  - Validate isolation

#### Days 9-10: Content RLS Policies
- **Sprint 2.2.3**: Brand & Article RLS Policies (L)
  - Enable RLS on all brand tables
  - Enable RLS on all article tables
  - Test role permissions (editor vs viewer)
  - Validate cascade behaviors

**END OF WEEK 2**: RLS policies complete, multi-tenancy secure ✅

---

### WEEK 3: Authentication & Initial Data Migration

#### Day 11: Auth Setup
- **Sprint 2.2.4**: API Keys & Usage RLS (M - 1 day)
  - Enable RLS on user_api_keys, usage logs
  - Test admin-only access
- **Sprint 2.3.1**: Auth Configuration (M - 0.5 day starts)
  - Enable Email/Password, Google OAuth, GitHub OAuth in dashboard
  - Configure redirect URLs

#### Day 12: Auth Setup (continued)
- **Sprint 2.3.1**: Auth Configuration (M - 0.5 day complete)
  - Configure email templates
  - Test auth flows in dashboard

#### Days 13-14: Supabase Client
- **Sprint 2.3.2**: Supabase Client Setup (M)
  - Install @supabase/supabase-js, @supabase/ssr
  - Create browser and server clients
  - Create auth middleware
  - Test client creation

#### Day 15: Auth UI
- **Sprint 2.3.3**: Auth UI Pages (M - 1 day starts)
  - Replace mock login/signup pages
  - Implement OAuth buttons
  - Implement password reset

**END OF WEEK 3**: Auth partially complete, clients ready ✅

---

### WEEK 4: Complete Auth & Begin Data Migration

#### Day 16: Auth UI (continued)
- **Sprint 2.3.3**: Auth UI Pages (M - 1 day complete)
  - Complete auth flows
  - Add error handling
  - Test end-to-end

#### Day 17: Protected Routes
- **Sprint 2.3.4**: Protected Routes & Middleware (M - 1.5 days starts)
  - Update root middleware
  - Protect dashboard routes
  - Implement logout

#### Day 18: Protected Routes (continued) + Type Gen
- **Sprint 2.3.4**: Protected Routes & Middleware (M - 0.5 day complete)
  - Test session refresh
  - Handle expired sessions
- **Sprint 2.4.1**: Type Generation & Base Queries (M - 0.5 day starts)
  - Generate TypeScript types
  - Create query utilities

#### Day 19: Type Gen + Team Data
- **Sprint 2.4.1**: Type Generation & Base Queries (M - 1 day complete)
  - Create reusable query hooks
  - Test type safety
- **Sprint 2.4.2**: Team & User Data (M - 1 day starts)
  - Create teams.ts with queries
  - Replace mock team data in dashboard

#### Day 20: Team Data (continued)
- **Sprint 2.4.2**: Team & User Data (M - 1 day complete)
  - Implement team creation
  - Implement profile updates
  - Test team switcher

**END OF WEEK 4**: Auth complete, team data migrated ✅

---

### WEEK 5: Data Migration + AI Foundation

#### Days 21-23: Brand Data Migration
- **Sprint 2.4.3**: Brand Data (L)
  - Create brands.ts with queries
  - Replace mock brand list
  - Implement brand creation
  - Implement profile versioning
  - Test brand workflows

#### Days 24-26: Article Data Migration
- **Sprint 2.4.4**: Article Data (XL)
  - Create articles.ts with queries
  - Replace mock articles list
  - Implement auto-save (30 seconds)
  - Implement version history
  - Implement workflow transitions
  - Test all article workflows

#### Day 27: Settings Data
- **Sprint 2.4.5**: AI Rules & Settings Data (M - 1.5 days starts)
  - Create ai-rules.ts
  - Replace mock AI rules
  - Implement Vault functions

**END OF WEEK 5**: Major data migration progress ✅

---

### WEEK 6: Complete Phase 2 & Start Phase 3

#### Day 28: Settings Data (continued)
- **Sprint 2.4.5**: AI Rules & Settings Data (M - 0.5 day complete)
  - Replace mock API keys
  - Test Vault encryption/decryption

#### Day 29: Phase 2 Testing
- **Sprint 2.4.6**: Testing & Validation (M)
  - Create test users with different roles
  - Validate all CRUD per role
  - Test cross-team isolation
  - Performance testing

#### Days 30-31: AI Provider Setup
- **Sprint 3.1.1**: Provider Registry Setup (M)
  - Install AI SDK packages
  - Create provider-registry.ts
  - Create generation-service.ts
  - Test registry with sample keys

**MILESTONE: Phase 2 Complete** ✅
- All mock data replaced
- Auth working with 3 providers
- Multi-tenancy validated

#### Day 32: Generation Service
- **Sprint 3.1.2**: Generation Service Interface (M - 1.5 days starts)
  - Implement generate() method
  - Implement streamGenerate() method
  - Add token counting

**END OF WEEK 6**: Phase 2 done, Phase 3 started ✅

---

### WEEK 7: AI Content Generation

#### Day 33: Generation Service (continued)
- **Sprint 3.1.2**: Generation Service Interface (M - 0.5 day complete)
  - Test with each provider
  - Document usage

#### Day 34: Token Tracking
- **Sprint 3.1.3**: Token Estimation & Usage Tracking (M)
  - Create token-estimation.ts
  - Implement usage logging
  - Display usage in dashboard

#### Days 35-36: Prompt Engineering
- **Sprint 3.2.1**: Prompt Engineering Foundation (L)
  - Create prompts/ directory
  - Implement content-generation.ts prompt
  - Support all 4 input types
  - Test prompt quality

#### Days 37-38: Generation API
- **Sprint 3.2.2**: Basic Generation API (L)
  - Create /api/content/generate endpoint
  - Implement SSE streaming
  - Load brand profile
  - Stream generation

#### Day 39: Frontend Integration
- **Sprint 3.2.3**: Frontend Generation Integration (M - 2 days starts)
  - Create use-ai-generation.ts hook
  - Update article creation page

**END OF WEEK 7**: Basic AI generation working ✅

---

### WEEK 8: Complete Generation & Start Humanization

#### Day 40: Frontend Integration (continued)
- **Sprint 3.2.3**: Frontend Generation Integration (M - 1 day complete)
  - Stream content into editor
  - Handle errors
  - Test all input types

#### Day 41: SEO-Aware Generation
- **Sprint 3.2.4**: SEO-Aware Generation (M - 1.5 days starts)
  - Update prompt for keywords
  - Test keyword integration

#### Day 42: SEO-Aware Generation (continued)
- **Sprint 3.2.4**: SEO-Aware Generation (M - 0.5 day complete)
  - Ensure natural keyword usage

#### Days 43-45: Pattern Detection
- **Sprint 3.3.1**: Pattern Detection Engine (L)
  - Create pattern-detection.ts
  - Implement regex matching
  - Load rules from database
  - Highlight patterns in editor

#### Day 46: Humanization Prompt
- **Sprint 3.3.2**: Humanization Prompt (M - 1.5 days starts)
  - Create ai-pattern-removal.ts prompt
  - Inject detected patterns

**END OF WEEK 8**: Pattern detection working ✅

---

### WEEK 9: Humanization & External APIs

#### Day 47: Humanization Prompt (continued)
- **Sprint 3.3.2**: Humanization Prompt (M - 0.5 day complete)
  - Test rewrite quality

#### Days 48-49: Humanization API
- **Sprint 3.3.3**: Humanization API & UI (L)
  - Create /api/content/humanize endpoint
  - Update humanize page UI
  - Show before/after comparison
  - Implement accept/reject changes

#### Day 50: Rule Management
- **Sprint 3.3.4**: Pattern Rule Management (M - 1.5 days starts)
  - Update AI rules page
  - Implement custom rule creation

#### Day 51: Rule Management (continued)
- **Sprint 3.3.4**: Pattern Rule Management (M - 0.5 day complete)
  - Add rule testing interface

#### Days 52-53: Brand Extraction
- **Sprint 3.4.1**: Brand Extraction Prompt (L)
  - Create brand-extraction.ts
  - Define BrandVoiceSchema
  - Implement extractBrandVoice()
  - Test with sample content

**MILESTONE: Phase 3 Complete** ✅
- Content generation working
- AI pattern removal functional
- Brand extraction ready

**END OF WEEK 9**: Phase 3 done, ready for Phase 4 ✅

---

### WEEK 10: External APIs - Firecrawl & DataForSEO

#### Day 54: Brand Discovery Integration
- **Sprint 3.4.2**: Brand Discovery Integration (M - 1.5 days starts)
  - Integrate brand analysis
  - Update brand wizard

#### Day 55: Brand Discovery (continued)
- **Sprint 3.4.2**: Brand Discovery Integration (M - 0.5 day complete)
  - Test discovery flow

#### Days 56-57: Firecrawl Client
- **Sprint 4.1.1**: Firecrawl Client Wrapper (M)
  - Install @mendable/firecrawl-js
  - Create client.ts
  - Implement scrape(), crawl(), map()
  - Test with sample URLs

#### Days 58-59: Crawl Jobs
- **Sprint 4.1.2**: Crawl Job Management (L)
  - Create actions.ts server actions
  - Implement crawlSite()
  - Store pages in database
  - Track usage

#### Day 60: Brand Discovery UI
- **Sprint 4.1.3**: Brand Discovery UI Integration (M - 2 days starts)
  - Update brand wizard to accept URLs
  - Show crawl progress

**END OF WEEK 10**: Firecrawl integration started ✅

---

### WEEK 11: Complete Crawling & SEO

#### Day 61: Brand Discovery UI (continued)
- **Sprint 4.1.3**: Brand Discovery UI Integration (M - 1 day complete)
  - Trigger AI extraction after crawl
  - Test full flow

#### Days 62-63: Incremental Crawling
- **Sprint 4.1.4**: Incremental Crawling (L)
  - Create incremental-crawl.ts
  - Implement smart re-crawl logic
  - Test efficiency

#### Days 64-65: DataForSEO Client
- **Sprint 4.2.1**: DataForSEO Client Wrapper (M)
  - Create dataforseo/client.ts
  - Implement keyword methods
  - Test with sample keywords

#### Days 66-67: SEO Service
- **Sprint 4.2.2**: SEO Service & Keyword Opportunities (L)
  - Create seo-service.ts
  - Implement getKeywordOpportunities()
  - Test keyword selection algorithm

**END OF WEEK 11**: Crawling and SEO APIs integrated ✅

---

### WEEK 12: Cross-Linking & Performance

#### Days 68-69: SEO UI
- **Sprint 4.2.3**: SEO Optimization UI (M)
  - Update SEO page
  - Display keyword opportunities
  - Track keyword usage

#### Day 70: Caching
- **Sprint 4.2.4**: Caching & Cost Optimization (M - 1.5 days starts)
  - Install Upstash Redis
  - Implement cache wrapper

#### Day 71: Caching (continued)
- **Sprint 4.2.4**: Caching & Cost Optimization (M - 0.5 day complete)
  - Cache keyword data
  - Test cache hit rates

#### Days 72-73: Page Summaries
- **Sprint 4.3.1**: Page Summary Generation (M)
  - Create summarization background job
  - Generate summaries with AI
  - Store in crawled_pages

#### Days 74-76: Link Suggestions
- **Sprint 4.3.2**: Link Suggestion Engine (L)
  - Create cross-linking.ts prompt
  - Create /api/content/suggest-links
  - Implement link scoring

**MILESTONE: Phase 4 Mostly Complete** ✅
- Firecrawl integration working
- DataForSEO integration working
- Cross-linking engine ready

**END OF WEEK 12**: Major features complete ✅

---

### WEEK 13: Cross-Linking UI & Rate Limiting

#### Days 77-78: Link UI
- **Sprint 4.3.3**: Cross-Linking UI (M)
  - Update links page
  - Display suggestions
  - Implement one-click insert

#### Day 79: Rate Limiting
- **Sprint 4.4.1**: Rate Limiter Implementation (M - 1.5 days starts)
  - Install @upstash/ratelimit
  - Implement rate limits

#### Day 80: Rate Limiting (continued) + Quotas
- **Sprint 4.4.1**: Rate Limiter Implementation (M - 0.5 day complete)
  - Test rate limiting
- **Sprint 4.4.2**: Quota Management (M - 1 day starts)
  - Create quota.ts
  - Define quota limits per plan

**MILESTONE: Phase 4 Complete** ✅
- All external APIs integrated
- Rate limiting and quotas enforced
- Caching optimized

#### Day 81: Quotas (continued)
- **Sprint 4.4.2**: Quota Management (M - 0.5 day complete)
  - Display quotas in settings

**END OF WEEK 13**: Phase 4 done ✅

---

### WEEK 14: Polish - Editor & Error Handling

#### Days 82-83: Tiptap Setup
- **Sprint 5.1.1**: Tiptap Setup & Basic Editor (M)
  - Install Tiptap packages
  - Create rich-text-editor.tsx
  - Configure toolbar
  - Test basic editing

#### Day 84: Advanced Editor
- **Sprint 5.1.2**: Advanced Editor Features (M - 1.5 days starts)
  - Add word count, reading time
  - Implement keyboard shortcuts

#### Day 85: Advanced Editor (continued)
- **Sprint 5.1.2**: Advanced Editor Features (M - 0.5 day complete)
  - Add focus mode
  - Highlight patterns in editor

#### Days 86-87: Error Handling
- **Sprint 5.2.1**: Error Handling Framework (L)
  - Create errors/ directory
  - Define custom error classes
  - Implement global error boundary
  - Add error logging

#### Day 88: Retry Logic
- **Sprint 5.2.2**: Retry & Fallback Logic (M - 1.5 days starts)
  - Create retry.ts
  - Implement exponential backoff

**END OF WEEK 14**: Editor and error handling complete ✅

---

### WEEK 15: Performance & Security

#### Day 89: Retry Logic (continued)
- **Sprint 5.2.2**: Retry & Fallback Logic (M - 0.5 day complete)
  - Test retry scenarios

#### Days 90-92: Database Optimization
- **Sprint 5.3.1**: Database Query Optimization (L)
  - Audit queries with EXPLAIN ANALYZE
  - Add missing indexes
  - Implement query caching
  - Optimize RLS policies

#### Days 93-94: Frontend Performance
- **Sprint 5.3.2**: Frontend Performance (M)
  - Audit bundle size
  - Implement code splitting
  - Optimize images
  - Implement virtual scrolling

#### Days 95-96: Security Review
- **Sprint 5.4.1**: Security Review (M)
  - Audit RLS policies
  - Validate input sanitization
  - Check XSS/CSRF protection
  - Review auth flows

**END OF WEEK 15**: Performance and security audited ✅

---

### WEEK 16: Security Testing & Deployment

#### Days 97-98: Penetration Testing
- **Sprint 5.4.2**: Penetration Testing (L)
  - Attempt unauthorized access
  - Test SQL injection
  - Test XSS attacks
  - Fix vulnerabilities

#### Day 99: Production Setup
- **Sprint 5.5.1**: Environment Setup (M - 1.5 days starts)
  - Create production Supabase project
  - Run migrations on production

#### Day 100: Production Setup (continued)
- **Sprint 5.5.1**: Environment Setup (M - 0.5 day complete)
  - Configure environment variables
  - Set up Vercel project

#### Day 101: Monitoring
- **Sprint 5.5.2**: Monitoring & Analytics (M - 1.5 days starts)
  - Set up Vercel Analytics
  - Configure error tracking

#### Day 102: Monitoring (continued)
- **Sprint 5.5.2**: Monitoring & Analytics (M - 0.5 day complete)
  - Set up database monitoring
  - Configure alerts

#### Day 103: Deployment
- **Sprint 5.5.3**: Deployment & Launch (M)
  - Deploy to Vercel production
  - Test all features in production
  - Smoke test critical flows
  - Monitor for errors

#### Days 104-110: Post-Launch Monitoring
- **Sprint 5.5.4**: Post-Launch Monitoring (S - ongoing)
  - Monitor error rates
  - Track user signups
  - Review feedback
  - Address critical issues

**MILESTONE: Phase 5 Complete** ✅
**PRODUCTION LAUNCHED!** 🚀

**END OF WEEK 16**: ContentBeagle live in production! ✅

---

## Critical Path Summary

**Cannot start until complete**:

1. **Day 5**: All tables created → Enables RLS policies
2. **Day 10**: RLS policies complete → Enables auth integration
3. **Day 20**: Auth complete → Enables data migration
4. **Day 29**: Phase 2 complete → Enables Phase 3
5. **Day 53**: Brand extraction ready → Enables brand discovery
6. **Day 81**: Phase 4 complete → Enables Phase 5
7. **Day 98**: Security audit complete → Enables production deploy

**Parallel Work Opportunities**:

- Days 56-57: Firecrawl client can be built parallel to brand extraction
- Days 64-65: DataForSEO client can be built parallel to crawl jobs
- Days 82-88: Editor and error handling can be built parallel to final Phase 4 tasks

---

## Daily Checklist Template

Use this checklist for each sprint:

### Morning
- [ ] Review sprint acceptance criteria
- [ ] Check dependencies completed
- [ ] Identify potential blockers
- [ ] Set up test environment

### During Sprint
- [ ] Follow implementation reference docs
- [ ] Write tests alongside code
- [ ] Document any deviations
- [ ] Commit progress regularly

### Evening
- [ ] Run all tests
- [ ] Update documentation
- [ ] Mark acceptance criteria complete
- [ ] Note any blockers for next day

---

## Execution Tips

### For 1 Developer
- Strictly follow this order (no skipping)
- Expect 16 weeks (4 months)
- Take breaks between phases
- Focus on one sprint at a time

### For 2 Developers
- Dev 1: Follow this order through Phase 2
- Dev 2: Join at Day 29, start Phase 4 (Firecrawl) while Dev 1 does Phase 3
- Expect 10-12 weeks (2.5-3 months)
- Coordinate on shared dependencies

### For 3+ Developers
- Dev 1: Phase 2 (database & auth)
- Dev 2: Phase 3 (AI) starting Day 29
- Dev 3: Phase 4 (APIs) starting Day 56
- All: Phase 5 together
- Expect 8-10 weeks (2-2.5 months)

---

## Milestone Validation Checklist

### After Week 4 (Phase 2)
- [ ] Can login with email/password
- [ ] Can login with Google OAuth
- [ ] Can login with GitHub OAuth
- [ ] Dashboard shows real teams
- [ ] Brands list loads from database
- [ ] Articles list loads from database
- [ ] Team switcher works
- [ ] Can create new brand
- [ ] Can create new article
- [ ] No mock data anywhere
- [ ] Multi-tenancy isolation tested
- [ ] All RLS policies working

### After Week 9 (Phase 3)
- [ ] Can generate article with OpenAI
- [ ] Can generate article with Anthropic
- [ ] Can generate article with Google
- [ ] Content streams progressively
- [ ] AI patterns detected
- [ ] Humanization rewrites working
- [ ] Brand voice extraction working
- [ ] Token usage tracked
- [ ] Usage displayed in dashboard

### After Week 13 (Phase 4)
- [ ] Can crawl brand website
- [ ] Crawled pages stored
- [ ] Brand profile extracted from pages
- [ ] Keyword opportunities displayed
- [ ] SEO optimization functional
- [ ] Cross-link suggestions shown
- [ ] Link insertion works
- [ ] Caching reduces API calls
- [ ] Rate limiting enforced
- [ ] Quotas tracked

### After Week 16 (Phase 5)
- [ ] Tiptap editor fully functional
- [ ] Error handling catches all errors
- [ ] Retry logic working on failures
- [ ] Database queries optimized
- [ ] Frontend performance good (Lighthouse >90)
- [ ] Security audit passed
- [ ] Deployed to production
- [ ] Monitoring and alerts working
- [ ] No critical errors
- [ ] Users can sign up and create content

---

## When Things Go Wrong

### Sprint Taking Longer Than Expected
1. Identify specific blocker (complexity? dependency? bug?)
2. Break sprint into smaller tasks
3. Get help (pair programming, code review, external consultation)
4. Add buffer to timeline, communicate to stakeholders
5. Don't skip testing to catch up

### Stuck on Technical Problem
1. Review implementation reference docs
2. Check Supabase/Vercel/AI SDK documentation
3. Search GitHub issues for similar problems
4. Ask in Discord/community forums (Supabase, Vercel)
5. Consider alternative approach
6. Engage professional support if critical

### Quality Not Meeting Expectations
1. Revisit acceptance criteria
2. Add more testing
3. Get external code review
4. Iterate on prompts (for AI quality)
5. Consider prototype/MVP approach
6. Don't compromise on security or data integrity

---

**Ready to execute!** Start with Day 1: Sprint 2.1.1 (Supabase Project Setup).

---

*Document Version: 1.0*
*Created: 2025-01-10*
*Next Update: Weekly during execution*
