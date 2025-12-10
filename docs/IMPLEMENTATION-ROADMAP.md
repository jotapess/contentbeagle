# ContentBeagle - Complete Implementation Roadmap

## Executive Summary

This document provides a detailed, actionable implementation plan for ContentBeagle Phases 2-5. Phase 1 (Frontend with Mock Data) is complete with 27 routes. This roadmap breaks down each phase into specific milestones with sprint-sized tasks, dependency mapping, complexity estimates, and acceptance criteria.

**Total Estimated Timeline**: 12-16 weeks
**Current Status**: Phase 1 Complete, Phase 2 Ready to Start
**Risk Level**: Medium (complex AI integration, external API dependencies)

---

## Phase Dependency Chain

```
Phase 1 (COMPLETE) ─────► Phase 2 (Database & Auth) ─────► Phase 3 (AI) ─┐
                                                                          │
                                                     ┌────────────────────┘
                                                     │
                                                     └─► Phase 4 (External APIs) ─► Phase 5 (Production)
```

**Critical Path**: Phase 2 → Phase 3 → Phase 4 (brand discovery) → Phase 5
**Parallel Opportunities**: Some Phase 3 & 4 tasks can run concurrently after Phase 2 completion

---

# PHASE 2: Supabase Integration

**Goal**: Replace mock data with production-ready database and authentication
**Duration**: 3-4 weeks
**Existing Issues**: #1, #2, #3, #4
**Blockers**: None (can start immediately)
**Enables**: All subsequent phases

## Milestone 2.1: Database Foundation (Week 1)

**Objective**: Create and validate complete database schema with all 21 tables

### Sprint 2.1.1: Supabase Project Setup
**Issue**: #2
**Complexity**: S
**Duration**: 1 day
**Dependencies**: None

**Tasks**:
- [ ] Create Supabase project via dashboard
- [ ] Note project URL and anon key
- [ ] Configure environment variables in `.env.local`
- [ ] Install Supabase CLI: `npm install -D supabase`
- [ ] Initialize local Supabase: `supabase init`
- [ ] Link to remote project: `supabase link --project-ref <ref>`

**Acceptance Criteria**:
- [ ] Supabase project visible in dashboard
- [ ] Environment variables configured
- [ ] `supabase status` shows running services
- [ ] Can query database from local environment

**Technical Notes**:
- Use Supabase free tier initially (500MB, sufficient for MVP)
- Enable database webhooks for future real-time features
- Configure custom domain if available

---

### Sprint 2.1.2: Core Multi-Tenancy Tables
**Issue**: #2
**Complexity**: M
**Duration**: 2 days
**Dependencies**: 2.1.1

**Tasks**:
- [ ] Create migration: `supabase migration new core_tables`
- [ ] Implement `teams` table with plan enum
- [ ] Implement `team_members` table with role enum
- [ ] Implement `profiles` table with auth.users FK
- [ ] Add indexes on foreign keys
- [ ] Run migration: `supabase db push`
- [ ] Verify tables in Supabase dashboard

**Acceptance Criteria**:
- [ ] All 3 core tables created successfully
- [ ] Foreign key constraints enforced
- [ ] Indexes created on `team_id`, `user_id`
- [ ] Can insert test records manually
- [ ] `updated_at` triggers work correctly

**SQL Reference**: `/docs/DATABASE.md` lines 58-98

---

### Sprint 2.1.3: Brand & Content Tables
**Issue**: #2
**Complexity**: L
**Duration**: 2 days
**Dependencies**: 2.1.2

**Tasks**:
- [ ] Create migration: `supabase migration new brand_tables`
- [ ] Implement `brands` table with status enum
- [ ] Implement `brand_profiles` table (versioned)
- [ ] Implement `brand_competitors` table
- [ ] Implement `articles` table with workflow enum
- [ ] Implement `article_versions` table
- [ ] Implement `article_workflow_log` table
- [ ] Implement `article_comments` table
- [ ] Add full-text search indexes
- [ ] Run migration and validate

**Acceptance Criteria**:
- [ ] All 8 tables created with correct schemas
- [ ] JSON fields (JSONB) properly configured
- [ ] Array fields properly configured
- [ ] Workflow enum includes all states from PRD
- [ ] Can create brand with profile version
- [ ] Can create article with version history

**SQL Reference**: `/docs/DATABASE.md` lines 101-372

**Edge Cases**:
- Brand profile versioning: ensure `is_active` flag works correctly
- Article workflow transitions: validate state machine logic
- Comments threading: test `parent_id` self-reference

---

### Sprint 2.1.4: Crawling & AI Tables
**Issue**: #2
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: 2.1.3

**Tasks**:
- [ ] Create migration: `supabase migration new crawl_ai_tables`
- [ ] Implement `crawl_jobs` table
- [ ] Implement `crawled_pages` table with FTS
- [ ] Implement `ai_pattern_rules_global` table
- [ ] Implement `ai_pattern_rules` table
- [ ] Implement `api_providers` table (seed data ready)
- [ ] Implement `user_api_keys` table (vault reference)
- [ ] Implement all usage tracking tables
- [ ] Implement SEO data tables
- [ ] Run migration and validate

**Acceptance Criteria**:
- [ ] All 13 remaining tables created
- [ ] Full-text search on `crawled_pages` works
- [ ] Pattern rule categories enum correct
- [ ] Keyword cache expiration index created
- [ ] All foreign key relationships validated

**SQL Reference**: `/docs/DATABASE.md` lines 189-585

---

### Sprint 2.1.5: Indexes & Performance
**Issue**: #2
**Complexity**: S
**Duration**: 0.5 days
**Dependencies**: 2.1.4

**Tasks**:
- [ ] Create migration: `supabase migration new indexes`
- [ ] Add all performance indexes from DATABASE.md
- [ ] Create composite indexes for common queries
- [ ] Verify index usage with EXPLAIN ANALYZE
- [ ] Document any custom indexes added

**Acceptance Criteria**:
- [ ] All indexes from lines 589-630 created
- [ ] Query performance acceptable (<100ms for simple queries)
- [ ] No missing indexes on foreign keys
- [ ] Full-text search performance validated

**SQL Reference**: `/docs/DATABASE.md` lines 589-630

---

## Milestone 2.2: Row-Level Security (Week 2)

**Objective**: Implement complete RLS policies for multi-tenant data isolation

### Sprint 2.2.1: RLS Helper Functions
**Issue**: #3
**Complexity**: M
**Duration**: 1 day
**Dependencies**: 2.1.5

**Tasks**:
- [ ] Create migration: `supabase migration new rls_helpers`
- [ ] Implement `is_team_member()` function
- [ ] Implement `has_team_role()` function
- [ ] Implement `get_user_teams()` function
- [ ] Mark functions as SECURITY DEFINER
- [ ] Test functions with sample data
- [ ] Document function usage

**Acceptance Criteria**:
- [ ] All 3 helper functions created
- [ ] Functions return correct results for test users
- [ ] Performance acceptable (use indexes)
- [ ] SECURITY DEFINER flag set correctly

**SQL Reference**: `/docs/DATABASE.md` lines 635-671

**Security Consideration**: These functions must be STABLE and SECURITY DEFINER to work correctly with RLS

---

### Sprint 2.2.2: Core Table RLS Policies
**Issue**: #3
**Complexity**: L
**Duration**: 2 days
**Dependencies**: 2.2.1

**Tasks**:
- [ ] Create migration: `supabase migration new rls_core`
- [ ] Enable RLS on `teams`, `team_members`, `profiles`
- [ ] Implement SELECT policies (view permissions)
- [ ] Implement INSERT policies (creation permissions)
- [ ] Implement UPDATE policies (edit permissions)
- [ ] Implement DELETE policies (removal permissions)
- [ ] Test each policy with different roles
- [ ] Document policy logic

**Acceptance Criteria**:
- [ ] RLS enabled on all core tables
- [ ] Owner can do everything on their teams
- [ ] Admins can manage team settings
- [ ] Members can only view team data
- [ ] Users cannot access other teams' data
- [ ] Test suite validates all permission combinations

**SQL Reference**: `/docs/DATABASE.md` lines 698-746

**Testing Strategy**:
- Create 3 test users: owner, admin, viewer
- Validate each CRUD operation per role
- Ensure cross-team isolation

---

### Sprint 2.2.3: Brand & Article RLS Policies
**Issue**: #3
**Complexity**: L
**Duration**: 2 days
**Dependencies**: 2.2.2

**Tasks**:
- [ ] Create migration: `supabase migration new rls_content`
- [ ] Enable RLS on all brand tables
- [ ] Enable RLS on all article tables
- [ ] Implement role-based permissions per PRD matrix
- [ ] Test editor vs viewer permissions
- [ ] Validate cascade behaviors
- [ ] Document special cases

**Acceptance Criteria**:
- [ ] Editors can create/edit brands and articles
- [ ] Viewers can only read content
- [ ] Admins can delete content
- [ ] Brand profile versioning respects RLS
- [ ] Article workflow transitions tracked correctly
- [ ] Comments visible to all team members

**SQL Reference**: `/docs/DATABASE.md` lines 748-797

**Permission Matrix Validation**: Cross-reference `/docs/PRD.md` lines 67-77

---

### Sprint 2.2.4: API Keys & Usage RLS
**Issue**: #3
**Complexity**: M
**Duration**: 1 day
**Dependencies**: 2.2.3

**Tasks**:
- [ ] Create migration: `supabase migration new rls_api_usage`
- [ ] Enable RLS on `user_api_keys` (admin-only)
- [ ] Enable RLS on usage tracking tables
- [ ] Implement read-only policies for usage logs
- [ ] Test API key visibility restrictions
- [ ] Validate usage log aggregation queries

**Acceptance Criteria**:
- [ ] Only admins/owners can view API keys
- [ ] All team members can view usage logs
- [ ] Usage logs properly filtered by team
- [ ] Cannot modify historical usage logs
- [ ] Vault references secure

**SQL Reference**: `/docs/DATABASE.md` lines 817-825

---

## Milestone 2.3: Supabase Auth Integration (Week 2-3)

**Objective**: Implement production authentication with OAuth providers

### Sprint 2.3.1: Auth Configuration
**Issue**: #4
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: 2.2.4

**Tasks**:
- [ ] Enable Email/Password auth in Supabase dashboard
- [ ] Configure Google OAuth (create OAuth app)
- [ ] Configure GitHub OAuth (create OAuth app)
- [ ] Set up redirect URLs
- [ ] Configure email templates (verification, reset)
- [ ] Test auth flows manually in dashboard
- [ ] Document OAuth app setup

**Acceptance Criteria**:
- [ ] Email/password auth works in dashboard
- [ ] Google OAuth works in dashboard
- [ ] GitHub OAuth works in dashboard
- [ ] Email verification emails sent
- [ ] Password reset emails sent
- [ ] All redirect URLs configured correctly

**Configuration Reference**:
- Google OAuth: https://console.cloud.google.com
- GitHub OAuth: https://github.com/settings/developers
- Supabase Auth docs: https://supabase.com/docs/guides/auth

---

### Sprint 2.3.2: Supabase Client Setup
**Issue**: #4
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: 2.3.1

**Tasks**:
- [ ] Install: `npm install @supabase/supabase-js @supabase/ssr`
- [ ] Create `/src/lib/supabase/client.ts` (browser client)
- [ ] Create `/src/lib/supabase/server.ts` (server client)
- [ ] Create `/src/lib/supabase/middleware.ts` (auth middleware)
- [ ] Update `middleware.ts` in root to use Supabase auth
- [ ] Create utility functions for session management
- [ ] Test client creation in different contexts

**Acceptance Criteria**:
- [ ] Browser client works in client components
- [ ] Server client works in server components/actions
- [ ] Middleware correctly refreshes sessions
- [ ] Type-safe Supabase client (generated types)
- [ ] Session persists across page loads
- [ ] Auth state reactive in UI

**Implementation Reference**: `/docs/ARCHITECTURE.md` lines 236-238

**Key Pattern**:
```typescript
// Browser client
const supabase = createBrowserClient(url, anonKey)

// Server client (in server component)
const supabase = createServerClient(cookies)
```

---

### Sprint 2.3.3: Auth UI Pages
**Issue**: #4
**Complexity**: M
**Duration**: 2 days
**Dependencies**: 2.3.2

**Tasks**:
- [ ] Replace mock auth in `/src/app/(auth)/login/page.tsx`
- [ ] Implement real login with email/password
- [ ] Add Google OAuth button
- [ ] Add GitHub OAuth button
- [ ] Replace mock signup in `/src/app/(auth)/signup/page.tsx`
- [ ] Implement email verification flow
- [ ] Replace mock forgot-password page
- [ ] Implement password reset flow
- [ ] Add auth error handling
- [ ] Test all auth flows end-to-end

**Acceptance Criteria**:
- [ ] Login works with email/password
- [ ] Login works with Google OAuth
- [ ] Login works with GitHub OAuth
- [ ] Signup creates user and sends verification email
- [ ] Password reset sends email with reset link
- [ ] Auth errors displayed to user
- [ ] Successful auth redirects to dashboard
- [ ] Invalid credentials show error message

**UI Components**: Reuse existing shadcn/ui components in `/src/components/ui/`

---

### Sprint 2.3.4: Protected Routes & Middleware
**Issue**: #4
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: 2.3.3

**Tasks**:
- [ ] Update root `middleware.ts` to protect `/dashboard` routes
- [ ] Implement session refresh logic
- [ ] Create auth context provider
- [ ] Update dashboard layout to use real auth
- [ ] Implement logout functionality
- [ ] Handle expired sessions
- [ ] Test protected route access

**Acceptance Criteria**:
- [ ] Unauthenticated users redirected to login
- [ ] Authenticated users can access dashboard
- [ ] Sessions refresh automatically
- [ ] Logout clears session and redirects to login
- [ ] Expired sessions handled gracefully
- [ ] Auth state available in all dashboard pages

**Middleware Pattern**:
```typescript
export async function middleware(request: NextRequest) {
  const { supabase, response } = createServerClient(request)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}
```

---

## Milestone 2.4: Data Layer Migration (Week 3-4)

**Objective**: Replace all mock data with real Supabase queries

### Sprint 2.4.1: Type Generation & Base Queries
**Issue**: #2
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: 2.3.4

**Tasks**:
- [ ] Generate TypeScript types: `supabase gen types typescript`
- [ ] Save to `/src/types/database.ts`
- [ ] Create base query utilities in `/src/lib/supabase/queries.ts`
- [ ] Implement error handling wrapper
- [ ] Create reusable query hooks
- [ ] Test type safety with sample queries

**Acceptance Criteria**:
- [ ] Generated types match database schema
- [ ] Types imported in all data-fetching code
- [ ] Query utilities handle errors gracefully
- [ ] RLS policies enforced in queries
- [ ] Type-safe filters and joins

**Type Generation Command**:
```bash
npx supabase gen types typescript --project-id <ref> > src/types/database.ts
```

---

### Sprint 2.4.2: Team & User Data
**Issue**: #2
**Complexity**: M
**Duration**: 2 days
**Dependencies**: 2.4.1

**Tasks**:
- [ ] Create `/src/lib/supabase/teams.ts` with team queries
- [ ] Replace mock team data in dashboard
- [ ] Implement team creation flow
- [ ] Implement team member invitation
- [ ] Replace mock user profile data
- [ ] Implement profile update functionality
- [ ] Test team switcher with real data
- [ ] Handle edge cases (no teams, pending invites)

**Acceptance Criteria**:
- [ ] Dashboard loads user's teams from database
- [ ] Team switcher shows correct teams
- [ ] Can create new team
- [ ] Can invite members (email sent in Phase 4)
- [ ] User profile displays real data
- [ ] Can update profile (name, avatar URL)
- [ ] Edge cases handled gracefully

**Key Queries**:
- `getUserTeams(userId)` - Get all teams user belongs to
- `getTeamMembers(teamId)` - Get members with roles
- `createTeam(name, slug, userId)` - Create team, add owner
- `inviteTeamMember(teamId, email, role)` - Create invitation

---

### Sprint 2.4.3: Brand Data
**Issue**: #2
**Complexity**: L
**Duration**: 2.5 days
**Dependencies**: 2.4.2

**Tasks**:
- [ ] Create `/src/lib/supabase/brands.ts` with brand queries
- [ ] Replace mock brand list in `/src/app/(dashboard)/brands/page.tsx`
- [ ] Implement brand creation flow
- [ ] Replace mock brand profile data
- [ ] Implement brand profile editor save
- [ ] Handle brand profile versioning
- [ ] Implement crawled pages list
- [ ] Test brand workflows end-to-end

**Acceptance Criteria**:
- [ ] Brands list loads from database
- [ ] Can create new brand
- [ ] Brand profile editor loads active version
- [ ] Saving profile creates new version
- [ ] Previous versions accessible
- [ ] Crawled pages list works (empty until Phase 4)
- [ ] Brand settings update correctly

**Key Queries**:
- `getTeamBrands(teamId)` - List all brands
- `getBrand(brandId)` - Get brand with active profile
- `createBrand(teamId, data)` - Create brand
- `createBrandProfile(brandId, profileData)` - New version
- `getBrandProfileHistory(brandId)` - Version history

**Profile Versioning Logic**:
1. Mark current profile `is_active = false`
2. Insert new profile with `is_active = true`
3. Increment version number

---

### Sprint 2.4.4: Article Data
**Issue**: #2
**Complexity**: XL
**Duration**: 3 days
**Dependencies**: 2.4.3

**Tasks**:
- [ ] Create `/src/lib/supabase/articles.ts` with article queries
- [ ] Replace mock articles list
- [ ] Implement article creation flow
- [ ] Replace mock article editor data
- [ ] Implement auto-save every 30 seconds
- [ ] Implement version creation on save
- [ ] Implement workflow state transitions
- [ ] Replace mock version history
- [ ] Implement version diff view
- [ ] Implement version restore
- [ ] Test all article workflows

**Acceptance Criteria**:
- [ ] Articles list loads from database
- [ ] Can create new article
- [ ] Article editor loads current content
- [ ] Auto-save creates versions every 30s
- [ ] Manual save creates named version
- [ ] Workflow transitions logged
- [ ] Version history displays correctly
- [ ] Can view side-by-side diff
- [ ] Can restore previous version
- [ ] Word count and reading time calculated

**Key Queries**:
- `getTeamArticles(teamId, filters)` - List articles
- `getArticle(articleId)` - Get article with metadata
- `createArticle(teamId, brandId, data)` - New article
- `updateArticle(articleId, content)` - Save content
- `createArticleVersion(articleId, data)` - Version snapshot
- `transitionArticleWorkflow(articleId, fromStatus, toStatus)` - State change
- `getArticleVersions(articleId)` - Version history
- `compareVersions(versionId1, versionId2)` - Diff

**Auto-save Implementation**:
```typescript
useEffect(() => {
  const timer = setInterval(() => {
    if (hasChanges) {
      saveArticle(articleId, content)
    }
  }, 30000)
  return () => clearInterval(timer)
}, [content])
```

---

### Sprint 2.4.5: AI Rules & Settings Data
**Issue**: #2
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: 2.4.4

**Tasks**:
- [ ] Create `/src/lib/supabase/ai-rules.ts`
- [ ] Replace mock AI rules list
- [ ] Implement rule creation/editing
- [ ] Replace mock API keys list
- [ ] Implement Vault functions for API keys
- [ ] Replace mock usage data
- [ ] Test API key encryption/decryption
- [ ] Test usage aggregation queries

**Acceptance Criteria**:
- [ ] AI rules list loads (global + team rules)
- [ ] Can create custom team rule
- [ ] Can enable/disable rules
- [ ] API keys list loads (masked)
- [ ] Can add new API key (encrypted in Vault)
- [ ] Can delete API key
- [ ] Usage charts display real data
- [ ] Token usage tracked per provider

**Key Queries**:
- `getAIRules(teamId)` - Get global + team rules
- `createAIRule(teamId, data)` - Create custom rule
- `storeApiKey(teamId, provider, key)` - Encrypt in Vault
- `getApiKey(teamId, provider)` - Decrypt from Vault (server only)
- `getUsageStats(teamId, period)` - Aggregate usage

**Vault Security**: API keys NEVER exposed to client, only decrypted in server actions

---

### Sprint 2.4.6: Testing & Validation
**Issue**: #2
**Complexity**: M
**Duration**: 1 day
**Dependencies**: 2.4.5

**Tasks**:
- [ ] Create test user accounts with different roles
- [ ] Validate all CRUD operations per role
- [ ] Test cross-team isolation (cannot access other team data)
- [ ] Test edge cases (empty states, deletions, etc.)
- [ ] Performance test with 100+ records
- [ ] Document any query optimizations needed
- [ ] Fix any RLS policy issues discovered

**Acceptance Criteria**:
- [ ] All roles work correctly per permission matrix
- [ ] RLS policies prevent unauthorized access
- [ ] No N+1 query issues
- [ ] Queries complete in <100ms (simple) / <500ms (complex)
- [ ] Edge cases handled gracefully
- [ ] No data leakage between teams

**Test Scenarios**:
1. Owner: Can do everything
2. Admin: Can manage team, not delete team
3. Editor: Can create/edit content, not delete
4. Viewer: Can only read

---

## Phase 2 Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| RLS policies too complex/slow | High | Medium | Use helper functions, add indexes, profile queries |
| Vault key decryption fails | High | Low | Add retry logic, comprehensive error handling |
| Migration rollback needed | Medium | Low | Test migrations in local Supabase first |
| Auth edge cases not covered | Medium | Medium | Comprehensive testing, handle expired sessions |
| Type generation out of sync | Low | Medium | Run type gen after every migration |

---

## Phase 2 Completion Checklist

- [ ] All 21 tables created and indexed
- [ ] All RLS policies implemented and tested
- [ ] Supabase Auth working with all 3 providers
- [ ] All mock data replaced with real queries
- [ ] API keys encrypted in Vault
- [ ] Auto-save working on articles
- [ ] Version history and restore working
- [ ] Multi-tenancy isolation validated
- [ ] Performance acceptable (<100ms queries)
- [ ] Documentation updated

**Estimated Completion**: End of Week 4

---

# PHASE 3: AI Provider Integration

**Goal**: Implement AI-powered content generation with multiple providers
**Duration**: 3-4 weeks
**Existing Issues**: #6, #7, #8, #9
**Blockers**: Phase 2 (need API keys from Vault)
**Enables**: Core content generation features

## Milestone 3.1: AI Provider Abstraction (Week 5)

**Objective**: Set up BYOK with Vercel AI SDK multi-provider support

### Sprint 3.1.1: Provider Registry Setup
**Issue**: #7
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: Phase 2 complete (2.4.6)

**Tasks**:
- [ ] Install Vercel AI SDK packages
  - `npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google`
- [ ] Create `/src/lib/ai/provider-registry.ts`
- [ ] Implement `createUserProviderRegistry(keys)` function
- [ ] Create `/src/lib/ai/generation-service.ts`
- [ ] Implement `AIGenerationService` class
- [ ] Test registry creation with sample keys
- [ ] Document provider configuration

**Acceptance Criteria**:
- [ ] Can create registry with user's API keys
- [ ] Supports OpenAI, Anthropic, Google providers
- [ ] Registry correctly instantiates provider clients
- [ ] Service can switch between providers
- [ ] Errors handled when keys invalid

**Implementation Reference**: `/docs/AI-PIPELINE.md` lines 65-174

**Provider Models Supported**:
- OpenAI: `gpt-4o`, `gpt-4o-mini`
- Anthropic: `claude-3-5-sonnet-20241022`, `claude-opus-4-5-20251101`
- Google: `gemini-1.5-pro`

---

### Sprint 3.1.2: Generation Service Interface
**Issue**: #7
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: 3.1.1

**Tasks**:
- [ ] Define `GenerationRequest` and `GenerationResult` types
- [ ] Implement `generate()` method for synchronous generation
- [ ] Implement `streamGenerate()` method for streaming
- [ ] Add token counting and usage tracking
- [ ] Create error handling wrapper
- [ ] Test with each provider
- [ ] Document usage patterns

**Acceptance Criteria**:
- [ ] Can generate text with any provider
- [ ] Streaming works correctly (yields chunks)
- [ ] Token usage tracked accurately
- [ ] Errors handled gracefully (retry logic)
- [ ] Cost estimation accurate
- [ ] Generation respects temperature/maxTokens params

**Implementation Reference**: `/docs/AI-PIPELINE.md` lines 108-174

---

### Sprint 3.1.3: Token Estimation & Usage Tracking
**Issue**: #7
**Complexity**: M
**Duration**: 1 day
**Dependencies**: 3.1.2

**Tasks**:
- [ ] Create `/src/lib/ai/token-estimation.ts`
- [ ] Implement `estimatePipelineTokens()` function
- [ ] Create cost calculation utilities
- [ ] Implement usage logging to `ai_usage_log` table
- [ ] Create usage aggregation queries
- [ ] Display usage in settings/usage page
- [ ] Test estimation accuracy

**Acceptance Criteria**:
- [ ] Token estimates within 10% of actual usage
- [ ] Usage logged per generation
- [ ] Costs calculated per provider pricing
- [ ] Usage dashboard shows real-time data
- [ ] Can filter usage by date, feature, provider
- [ ] Budget alerts possible (future)

**Implementation Reference**: `/docs/AI-PIPELINE.md` lines 629-696

**Cost Tracking Formula**:
```typescript
cost = (totalTokens / 1000) * modelCostPer1k
```

---

## Milestone 3.2: Content Generation Pipeline (Week 5-6)

**Objective**: Implement end-to-end content generation with brand context

### Sprint 3.2.1: Prompt Engineering Foundation
**Issue**: #8
**Complexity**: L
**Duration**: 2 days
**Dependencies**: 3.1.3

**Tasks**:
- [ ] Create `/src/lib/ai/prompts/` directory
- [ ] Implement `content-generation.ts` prompt builder
- [ ] Implement `buildContentGenerationPrompt()` function
- [ ] Support all 4 input types (bullets, draft, research, topic_only)
- [ ] Inject brand voice characteristics
- [ ] Inject terminology guidelines
- [ ] Test prompt quality with sample data
- [ ] Refine prompts based on output quality

**Acceptance Criteria**:
- [ ] Prompt correctly injects brand voice
- [ ] Tone scales reflected in instructions
- [ ] Terminology included (power words, avoid words)
- [ ] Length guidance clear
- [ ] All 4 input types supported
- [ ] Output format instructions clear (Markdown)
- [ ] Generated content matches brand voice

**Implementation Reference**: `/docs/AI-PIPELINE.md` lines 243-344

**Prompt Template Structure**:
1. System: Brand voice profile, writing constraints, format
2. User: Input content + target audience + length + CTA

---

### Sprint 3.2.2: Basic Generation API
**Issue**: #8
**Complexity**: L
**Duration**: 2 days
**Dependencies**: 3.2.1

**Tasks**:
- [ ] Create `/src/app/api/content/generate/route.ts`
- [ ] Implement POST handler with SSE streaming
- [ ] Load user's API keys from Vault
- [ ] Load brand profile from database
- [ ] Build generation prompt
- [ ] Stream generation response
- [ ] Log token usage
- [ ] Handle errors and timeouts

**Acceptance Criteria**:
- [ ] API endpoint returns SSE stream
- [ ] Content generates progressively
- [ ] Uses user's configured provider
- [ ] Respects brand voice profile
- [ ] Token usage logged to database
- [ ] Errors returned in stream
- [ ] Generation can be cancelled

**Implementation Reference**: `/docs/AI-PIPELINE.md` lines 702-774

**SSE Event Types**:
```typescript
{ type: 'step_start', step: 'content_generation' }
{ type: 'content_chunk', chunk: 'text...' }
{ type: 'step_complete', step: 'content_generation' }
{ type: 'pipeline_complete', result: PipelineOutput }
{ type: 'pipeline_error', error: 'message' }
```

---

### Sprint 3.2.3: Frontend Generation Integration
**Issue**: #8
**Complexity**: M
**Duration**: 2 days
**Dependencies**: 3.2.2

**Tasks**:
- [ ] Create `/src/hooks/use-ai-generation.ts` hook
- [ ] Implement SSE client in hook
- [ ] Update article creation page to use real generation
- [ ] Display progress indicator during generation
- [ ] Stream content into editor
- [ ] Handle generation errors
- [ ] Add cancel generation button
- [ ] Test with all input types

**Acceptance Criteria**:
- [ ] "Generate" button triggers real API call
- [ ] Progress indicator shows current step
- [ ] Content appears progressively in editor
- [ ] Generation can be cancelled mid-stream
- [ ] Errors displayed to user
- [ ] Generated article saved to database
- [ ] Token usage visible in UI

**Client-Side Stream Handling**:
```typescript
const { generate, isGenerating, progress, cancel } = useAIGeneration()

await generate({
  brandId,
  inputType: 'bullets',
  content: bulletPoints,
  onChunk: (chunk) => appendToEditor(chunk),
  onComplete: (result) => saveArticle(result)
})
```

---

### Sprint 3.2.4: SEO-Aware Generation
**Issue**: #8
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: 3.2.3

**Tasks**:
- [ ] Update generation prompt to accept SEO keywords
- [ ] Inject keyword guidance into system prompt
- [ ] Add natural keyword integration instructions
- [ ] Test keyword density in output
- [ ] Ensure keywords don't sound forced
- [ ] Document keyword integration strategy

**Acceptance Criteria**:
- [ ] Can optionally pass keywords to generation
- [ ] Primary keywords appear 2-3 times naturally
- [ ] Secondary keywords appear 1-2 times
- [ ] Keywords in headings where natural
- [ ] Output still reads naturally
- [ ] No keyword stuffing

**Implementation Reference**: `/docs/AI-PIPELINE.md` lines 275-278

**Keyword Injection Strategy**:
- Add keywords to system prompt as "important terms to use naturally"
- Never force-fit keywords (readability first)
- Prefer keywords in H2 headers
- Use keywords in first 100 words when possible

---

## Milestone 3.3: AI Pattern Removal (Humanization) (Week 6-7)

**Objective**: Detect and remove AI-typical patterns to humanize content

### Sprint 3.3.1: Pattern Detection Engine
**Issue**: #9
**Complexity**: L
**Duration**: 2.5 days
**Dependencies**: 3.2.4

**Tasks**:
- [ ] Create `/src/lib/ai/pattern-detection.ts`
- [ ] Implement regex-based pattern matching
- [ ] Implement exact phrase matching
- [ ] Load global pattern rules from database
- [ ] Load team custom rules
- [ ] Detect patterns in content
- [ ] Highlight patterns in editor
- [ ] Calculate severity scores

**Acceptance Criteria**:
- [ ] All global rules from seed data detected
- [ ] Custom team rules applied
- [ ] Patterns highlighted with context
- [ ] Severity levels respected (low/medium/high)
- [ ] Pattern count accurate
- [ ] Detection performance acceptable (<500ms for 2000 words)

**Pattern Detection Algorithm**:
1. Load enabled rules (global + team)
2. For each rule, scan content
3. Record matches with position and context
4. Calculate confidence score
5. Group by severity
6. Return detection results

---

### Sprint 3.3.2: Humanization Prompt
**Issue**: #9
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: 3.3.1

**Tasks**:
- [ ] Create `/src/lib/ai/prompts/ai-pattern-removal.ts`
- [ ] Implement `buildAIPatternRemovalPrompt()` function
- [ ] Inject detected patterns into prompt
- [ ] Inject brand voice for consistency
- [ ] Add rewriting guidelines
- [ ] Test humanization output quality
- [ ] Refine prompt for natural rewrites

**Acceptance Criteria**:
- [ ] Prompt includes detected patterns
- [ ] Rewriting guidelines clear
- [ ] Brand voice maintained
- [ ] Output preserves meaning
- [ ] Patterns successfully removed
- [ ] Content sounds more human

**Implementation Reference**: `/docs/AI-PIPELINE.md` lines 348-406

**Rewriting Principles**:
1. Maintain technical accuracy
2. Preserve information
3. Vary sentence structure
4. Use conversational transitions
5. Add subtle personality
6. No meta-commentary

---

### Sprint 3.3.3: Humanization API & UI
**Issue**: #9
**Complexity**: L
**Duration**: 2 days
**Dependencies**: 3.3.2

**Tasks**:
- [ ] Create `/src/app/api/content/humanize/route.ts`
- [ ] Implement humanization endpoint
- [ ] Update humanize page UI (`/articles/[id]/humanize`)
- [ ] Display detected patterns
- [ ] Add "Humanize" button
- [ ] Show before/after comparison
- [ ] Implement accept/reject changes
- [ ] Apply accepted changes to article

**Acceptance Criteria**:
- [ ] Patterns detected and displayed
- [ ] "Humanize" button triggers rewrite
- [ ] Before/after comparison clear
- [ ] Can accept individual changes
- [ ] Can reject individual changes
- [ ] "Apply All" button works
- [ ] Changes saved as new version

**UI Components**:
- Pattern list with severity badges
- Side-by-side diff view
- Accept/reject toggle per pattern
- Summary of changes applied

---

### Sprint 3.3.4: Pattern Rule Management
**Issue**: #9
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: 3.3.3

**Tasks**:
- [ ] Update AI rules page with real data
- [ ] Implement global rule enable/disable
- [ ] Implement custom rule creation
- [ ] Add rule testing interface
- [ ] Validate regex patterns
- [ ] Test rules against sample text
- [ ] Document rule creation best practices

**Acceptance Criteria**:
- [ ] Can view all global rules
- [ ] Can enable/disable individual rules
- [ ] Can create custom team rule
- [ ] Rule testing shows matches
- [ ] Invalid regex prevented
- [ ] Rule changes applied immediately

**Rule Editor Fields**:
- Name
- Category (dropdown)
- Pattern (text or regex)
- Pattern type (exact/regex/semantic)
- Replacement options (array)
- Severity (low/medium/high)
- Test text area

---

## Milestone 3.4: Brand Voice Analysis (Week 7)

**Objective**: Extract brand voice from crawled content using AI

### Sprint 3.4.1: Brand Extraction Prompt
**Issue**: #12 (partial)
**Complexity**: L
**Duration**: 2 days
**Dependencies**: 3.3.4

**Tasks**:
- [ ] Create `/src/lib/ai/brand-extraction.ts`
- [ ] Define `BrandVoiceSchema` with Zod
- [ ] Implement `extractBrandVoice()` function
- [ ] Use `generateObject` for structured output
- [ ] Test with sample crawled content
- [ ] Validate output quality
- [ ] Refine extraction prompt

**Acceptance Criteria**:
- [ ] Returns structured brand voice data
- [ ] Matches `brand_profiles` table schema
- [ ] Extracts formality, tone adjectives, personality
- [ ] Identifies sentence complexity, vocabulary level
- [ ] Extracts industry terms, brand-specific terms
- [ ] Identifies avoided terms
- [ ] Includes confidence score (0-1)

**Implementation Reference**: `/docs/AI-PIPELINE.md` lines 561-625

**Extraction Schema**:
```typescript
{
  voiceCharacteristics: { formality, tone, personality },
  writingStyle: { sentenceComplexity, vocabularyLevel, commonPhrases },
  terminology: { industryTerms, brandSpecificTerms, avoidedTerms },
  targetAudience: { primaryAudience, knowledgeLevel, painPoints },
  confidence: 0.0 - 1.0
}
```

---

### Sprint 3.4.2: Brand Discovery Integration
**Issue**: #12 (partial)
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: 3.4.1

**Tasks**:
- [ ] Create server action for brand analysis
- [ ] Integrate with brand creation wizard
- [ ] Show "Analyzing brand voice..." progress
- [ ] Display extracted profile for review
- [ ] Allow editing before save
- [ ] Save as initial brand profile version
- [ ] Test end-to-end discovery flow

**Acceptance Criteria**:
- [ ] Brand creation wizard triggers analysis
- [ ] Progress indicator during analysis
- [ ] Extracted profile displayed
- [ ] All fields editable
- [ ] Saves as `brand_profiles` version 1
- [ ] Confidence score stored
- [ ] Can re-analyze from brand settings

**Discovery Flow**:
1. User provides URL(s) (mocked until Phase 4)
2. System analyzes content with AI
3. Display extracted profile
4. User reviews and edits
5. Save as brand profile version 1

**Note**: URL crawling happens in Phase 4; use placeholder content for now

---

## Phase 3 Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AI output quality inconsistent | High | Medium | Comprehensive prompt engineering, test with multiple providers |
| Token costs too high | Medium | Medium | Implement cost estimation, user controls, caching |
| Streaming breaks on errors | High | Low | Robust error handling, graceful degradation |
| Pattern detection false positives | Medium | Medium | Tune regex patterns, allow rule customization |
| Brand extraction inaccurate | Medium | Medium | Require human review, allow full editing |

---

## Phase 3 Completion Checklist

- [ ] BYOK provider registry working
- [ ] Content generation working with all providers
- [ ] Streaming generation functional
- [ ] Token usage tracked and displayed
- [ ] AI pattern detection working
- [ ] Humanization rewrites quality-checked
- [ ] Brand voice extraction functional
- [ ] All prompts tested and refined
- [ ] Error handling comprehensive
- [ ] Performance acceptable

**Estimated Completion**: End of Week 7

---

# PHASE 4: External API Integrations

**Goal**: Integrate Firecrawl (crawling) and DataForSEO (keywords)
**Duration**: 3-4 weeks
**Existing Issues**: #10, #11, #12, #13, #14
**Blockers**: Phase 2 (database), Phase 3 (brand extraction)
**Enables**: Full brand discovery, SEO optimization, cross-linking

## Milestone 4.1: Firecrawl Integration (Week 8)

**Objective**: Implement web crawling for brand discovery and site mapping

### Sprint 4.1.1: Firecrawl Client Wrapper
**Issue**: #11
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: Phase 2 complete

**Tasks**:
- [ ] Install: `npm install @mendable/firecrawl-js`
- [ ] Create `/src/lib/services/firecrawl/client.ts`
- [ ] Implement `FirecrawlClient` class
- [ ] Implement `scrape()` method (single page)
- [ ] Implement `crawl()` method (multiple pages)
- [ ] Implement `map()` method (URL discovery)
- [ ] Implement `batchScrape()` method
- [ ] Test with sample URLs
- [ ] Handle API errors

**Acceptance Criteria**:
- [ ] Can scrape single page to Markdown
- [ ] Can crawl multiple pages from seed URL
- [ ] Can map all URLs on a site
- [ ] Can batch scrape multiple URLs
- [ ] Errors handled gracefully
- [ ] Rate limits respected

**Implementation Reference**: `/docs/INTEGRATIONS.md` lines 22-139

**Key Methods**:
- `scrape(url)` → `{ url, markdown, metadata }`
- `crawl(url, limit)` → `[{ url, markdown, metadata }]`
- `map(url)` → `[urls]`
- `batchScrape(urls)` → `[{ url, markdown, metadata }]`

---

### Sprint 4.1.2: Crawl Job Management
**Issue**: #11
**Complexity**: L
**Duration**: 2 days
**Dependencies**: 4.1.1

**Tasks**:
- [ ] Create `/src/lib/services/firecrawl/actions.ts` (server actions)
- [ ] Implement `scrapePage()` action
- [ ] Implement `crawlSite()` action
- [ ] Create crawl job record in database
- [ ] Update job status (pending → running → completed/failed)
- [ ] Store crawled pages in `crawled_pages` table
- [ ] Track usage in `crawl_usage_log`
- [ ] Test crawl job lifecycle

**Acceptance Criteria**:
- [ ] Crawl job created with status tracking
- [ ] Progress visible in UI
- [ ] Crawled pages stored with markdown
- [ ] Content hash calculated for change detection
- [ ] Job status updates correctly
- [ ] Errors captured in job record
- [ ] Usage tracked per crawl

**Implementation Reference**: `/docs/INTEGRATIONS.md` lines 143-229

**Crawl Job States**:
- `pending` → Job created, not started
- `running` → Crawl in progress
- `completed` → All pages processed
- `failed` → Error occurred
- `cancelled` → User cancelled

---

### Sprint 4.1.3: Brand Discovery UI Integration
**Issue**: #11, #12
**Complexity**: M
**Duration**: 2 days
**Dependencies**: 4.1.2, 3.4.1 (brand extraction)

**Tasks**:
- [ ] Update brand creation wizard to accept URLs
- [ ] Trigger crawl on "Discover Brand Voice"
- [ ] Show crawl progress (X/Y pages)
- [ ] After crawl, trigger AI brand extraction
- [ ] Display extracted profile
- [ ] Allow editing before save
- [ ] Test full discovery flow

**Acceptance Criteria**:
- [ ] Can enter 1+ URLs in wizard
- [ ] Crawl starts and shows progress
- [ ] Crawled content stored
- [ ] AI extraction runs automatically
- [ ] Profile displayed for review
- [ ] Can edit all fields
- [ ] Saves as brand profile v1

**Discovery Flow**:
1. User enters brand name + URLs
2. Click "Discover Brand Voice"
3. System crawls URLs (Firecrawl)
4. System analyzes content (AI)
5. Display extracted profile
6. User reviews/edits
7. Save brand + profile

---

### Sprint 4.1.4: Incremental Crawling
**Issue**: #11
**Complexity**: L
**Duration**: 2 days
**Dependencies**: 4.1.3

**Tasks**:
- [ ] Create `/src/lib/services/firecrawl/incremental-crawl.ts`
- [ ] Implement `performIncrementalCrawl()` function
- [ ] Map site to discover all URLs
- [ ] Check existing pages by URL + content hash
- [ ] Only re-crawl changed/new pages
- [ ] Update existing pages with new content
- [ ] Track last crawled timestamp
- [ ] Test incremental efficiency

**Acceptance Criteria**:
- [ ] Discovers new pages since last crawl
- [ ] Re-crawls pages older than 7 days
- [ ] Skips unchanged pages (same content hash)
- [ ] Updates modified pages
- [ ] Significantly reduces API calls
- [ ] Maintains up-to-date site map

**Implementation Reference**: `/docs/INTEGRATIONS.md` lines 234-296

**Change Detection**:
```typescript
const contentHash = sha256(markdown)
const existing = await db.crawledPage.findUnique({ where: { url } })
if (existing?.contentHash === contentHash) {
  // Skip, unchanged
} else {
  // Update
}
```

---

## Milestone 4.2: DataForSEO Integration (Week 8-9)

**Objective**: Fetch keyword opportunities and search volume data

### Sprint 4.2.1: DataForSEO Client Wrapper
**Issue**: #13
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: Phase 2 complete

**Tasks**:
- [ ] Create `/src/lib/services/dataforseo/client.ts`
- [ ] Implement `DataForSEOClient` class with Basic Auth
- [ ] Implement `getKeywordVolume()` method
- [ ] Implement `getRelatedKeywords()` method
- [ ] Implement `getKeywordsForSite()` method
- [ ] Implement `getSerpOverview()` method
- [ ] Test with sample keywords
- [ ] Handle API errors

**Acceptance Criteria**:
- [ ] Can get search volume for keywords
- [ ] Can get related keywords for topic
- [ ] Can get keywords for domain
- [ ] Can get SERP overview
- [ ] Basic Auth works
- [ ] Errors handled gracefully

**Implementation Reference**: `/docs/INTEGRATIONS.md` lines 311-467

**Key Methods**:
- `getKeywordVolume(keywords)` → `[{ keyword, searchVolume, cpc, competition }]`
- `getRelatedKeywords(keyword)` → `[{ keyword, searchVolume, relevance }]`
- `getKeywordsForSite(domain)` → `[{ keyword, searchVolume }]`
- `getSerpOverview(keyword)` → SERP features and intent

---

### Sprint 4.2.2: SEO Service & Keyword Opportunities
**Issue**: #13
**Complexity**: L
**Duration**: 2 days
**Dependencies**: 4.2.1

**Tasks**:
- [ ] Create `/src/lib/services/dataforseo/seo-service.ts`
- [ ] Implement `SEOService` class
- [ ] Implement `getKeywordOpportunities()` method
- [ ] Identify primary keywords (high volume, manageable competition)
- [ ] Identify secondary keywords (long-tail)
- [ ] Extract LSI keywords
- [ ] Determine search intent (informational/transactional)
- [ ] Test keyword selection logic

**Acceptance Criteria**:
- [ ] Returns 5 primary keywords
- [ ] Returns 10 secondary keywords
- [ ] Identifies LSI keywords
- [ ] Determines search intent
- [ ] Filters out high-competition keywords
- [ ] Keyword selection algorithm effective

**Implementation Reference**: `/docs/INTEGRATIONS.md` lines 472-613

**Keyword Selection Algorithm**:
1. Fetch related keywords for topic
2. If domain provided, fetch domain keywords
3. Score keywords: `searchVolume / (competition + 0.1)`
4. Primary: High volume (>100), low-medium competition
5. Secondary: Lower volume (10-500), long-tail
6. LSI: Extract unique words from keyword phrases

---

### Sprint 4.2.3: SEO Optimization UI
**Issue**: #13
**Complexity**: M
**Duration**: 2 days
**Dependencies**: 4.2.2

**Tasks**:
- [ ] Update SEO page (`/articles/[id]/seo`)
- [ ] Fetch keyword opportunities for article topic
- [ ] Display primary keywords with search volume
- [ ] Display secondary keywords
- [ ] Display LSI keywords
- [ ] Show keyword usage count in article
- [ ] Calculate keyword density
- [ ] Test SEO panel functionality

**Acceptance Criteria**:
- [ ] Keyword opportunities displayed
- [ ] Search volume and competition shown
- [ ] Current keyword usage tracked
- [ ] Keyword density calculated
- [ ] Can click to insert keyword
- [ ] Meta title/description editor functional
- [ ] SEO score calculated (0-100)

**SEO Panel Components**:
- Keyword opportunities list
- Current usage indicators
- Keyword density bars
- Meta title editor (50-60 chars)
- Meta description editor (150-160 chars)
- SEO score gauge

---

### Sprint 4.2.4: Caching & Cost Optimization
**Issue**: #13
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: 4.2.3

**Tasks**:
- [ ] Install Upstash Redis: `npm install @upstash/redis`
- [ ] Create `/src/lib/cache/index.ts`
- [ ] Implement cache wrapper with TTL
- [ ] Cache keyword volume data (30 days)
- [ ] Cache SERP data (7 days)
- [ ] Implement cache invalidation by tag
- [ ] Track SEO API usage
- [ ] Test cache hit rates

**Acceptance Criteria**:
- [ ] Keyword data cached for 30 days
- [ ] SERP data cached for 7 days
- [ ] Cache hit rate >70% after warmup
- [ ] SEO API calls reduced significantly
- [ ] Cache invalidation works
- [ ] Usage tracked in `seo_usage_log`

**Implementation Reference**: `/docs/INTEGRATIONS.md` lines 622-663

**Cache TTL Strategy**:
- Page scrape: 24 hours
- Keyword volume: 30 days
- SERP overview: 7 days
- Related keywords: 7 days
- Brand profile: Indefinite (user-controlled)

---

## Milestone 4.3: Cross-Linking Intelligence (Week 9-10)

**Objective**: Suggest and insert relevant internal links

### Sprint 4.3.1: Page Summary Generation
**Issue**: #14
**Complexity**: M
**Duration**: 2 days
**Dependencies**: 4.1.3 (crawled pages available)

**Tasks**:
- [ ] Create background job for page summarization
- [ ] For each crawled page, generate AI summary (2-3 sentences)
- [ ] Extract key topics (AI or NLP)
- [ ] Store summary and topics in `crawled_pages`
- [ ] Batch process existing pages
- [ ] Test summary quality
- [ ] Document summarization prompt

**Acceptance Criteria**:
- [ ] All crawled pages have summaries
- [ ] Summaries concise and accurate
- [ ] Key topics relevant
- [ ] Background job processes pages in batches
- [ ] Summaries stored correctly
- [ ] Can regenerate summaries

**Summarization Prompt**:
```
Analyze this page and provide:
1. A 2-3 sentence summary
2. 3-5 key topics covered
3. Primary content type (blog, product, about, etc.)

Page content: {markdown}
```

---

### Sprint 4.3.2: Link Suggestion Engine
**Issue**: #14
**Complexity**: L
**Duration**: 2.5 days
**Dependencies**: 4.3.1

**Tasks**:
- [ ] Create `/src/lib/ai/prompts/cross-linking.ts`
- [ ] Implement `buildCrossLinkingPrompt()` function
- [ ] Create API endpoint `/api/content/suggest-links`
- [ ] Analyze article content against crawled pages
- [ ] Use AI to suggest relevant links
- [ ] Generate natural anchor text
- [ ] Score link relevance
- [ ] Return top N suggestions

**Acceptance Criteria**:
- [ ] Returns relevant link suggestions
- [ ] Anchor text natural and contextual
- [ ] Relevance scores accurate
- [ ] Max N links configurable (default 10)
- [ ] No duplicate suggestions
- [ ] Links distributed throughout content

**Implementation Reference**: `/docs/AI-PIPELINE.md` lines 459-511

**Link Suggestion Criteria**:
- Topical relevance to current article
- Natural anchor text opportunities
- Avoid linking same page twice
- Distribute links throughout content
- Prefer informational phrases (not CTAs)

---

### Sprint 4.3.3: Cross-Linking UI
**Issue**: #14
**Complexity**: M
**Duration**: 2 days
**Dependencies**: 4.3.2

**Tasks**:
- [ ] Update links page (`/articles/[id]/links`)
- [ ] Fetch link suggestions for article
- [ ] Display suggestions with context
- [ ] Show where link would be inserted
- [ ] Implement one-click insert
- [ ] Track applied links in `applied_links` JSON
- [ ] Show current links list
- [ ] Test link insertion

**Acceptance Criteria**:
- [ ] Link suggestions displayed
- [ ] Each suggestion shows: target URL, anchor text, context
- [ ] Relevance score visible
- [ ] Can click to insert link
- [ ] Link inserted at optimal position in editor
- [ ] Applied links tracked
- [ ] Can remove applied links

**UI Components**:
- Suggestion cards (URL, anchor, relevance, context)
- Insert button
- Applied links list
- Link removal option
- Page search for manual linking

---

## Milestone 4.4: Rate Limiting & Quotas (Week 10)

**Objective**: Prevent API abuse and track usage limits

### Sprint 4.4.1: Rate Limiter Implementation
**Issue**: #10
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: Phase 2 complete

**Tasks**:
- [ ] Install: `npm install @upstash/ratelimit`
- [ ] Create `/src/lib/services/rate-limiter.ts`
- [ ] Implement rate limits for Firecrawl (10/sec)
- [ ] Implement rate limits for DataForSEO (60/min)
- [ ] Create `checkRateLimit()` utility
- [ ] Handle rate limit errors
- [ ] Test rate limiting

**Acceptance Criteria**:
- [ ] Firecrawl limited to 10 requests/second
- [ ] DataForSEO limited to 60 requests/minute
- [ ] Rate limit errors return 429 with retry-after
- [ ] Rate limits per team
- [ ] Analytics tracked in Upstash

**Implementation Reference**: `/docs/INTEGRATIONS.md` lines 680-726

---

### Sprint 4.4.2: Quota Management
**Issue**: #10
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: 4.4.1

**Tasks**:
- [ ] Create `/src/lib/services/quota.ts`
- [ ] Define quota limits per plan (free/pro/enterprise)
- [ ] Implement `checkQuota()` function
- [ ] Display quota usage in settings
- [ ] Show warnings at 80% usage
- [ ] Prevent operations when quota exceeded
- [ ] Test quota enforcement

**Acceptance Criteria**:
- [ ] Quota limits respected per plan
- [ ] Free tier: 50/day, 500/month
- [ ] Pro tier: 500/day, 10000/month
- [ ] Usage displayed in dashboard
- [ ] Warnings shown at 80% usage
- [ ] Operations blocked when quota exceeded
- [ ] Clear error messages

**Implementation Reference**: `/docs/INTEGRATIONS.md` lines 729-771

---

## Phase 4 Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| External API downtime | High | Low | Implement retries, graceful degradation, cache aggressively |
| Crawling costs too high | High | Medium | Incremental crawling, smart URL filtering, user quotas |
| SEO API costs too high | Medium | Medium | 30-day caching, batch requests, Standard over Live endpoints |
| Link suggestions low quality | Medium | Medium | Tune AI prompts, allow manual selection, user feedback |
| Rate limits hit frequently | Low | Medium | Implement backoff, queue requests, user notifications |

---

## Phase 4 Completion Checklist

- [ ] Firecrawl integration working
- [ ] Can crawl brand websites
- [ ] Incremental crawling reduces costs
- [ ] DataForSEO integration working
- [ ] Keyword opportunities displayed
- [ ] SEO optimization functional
- [ ] Cross-linking suggestions quality
- [ ] Link insertion working
- [ ] Caching reduces API calls by >70%
- [ ] Rate limiting enforced
- [ ] Quotas tracked and enforced
- [ ] Usage dashboard accurate

**Estimated Completion**: End of Week 10

---

# PHASE 5: Polish & Production

**Goal**: Production-ready application with monitoring and optimization
**Duration**: 2-3 weeks
**Existing Issues**: #15, #16, #17, #18
**Blockers**: Phases 2-4 complete
**Enables**: Public launch

## Milestone 5.1: Rich Text Editor Integration (Week 11)

**Objective**: Replace textarea with Tiptap rich text editor

### Sprint 5.1.1: Tiptap Setup & Basic Editor
**Issue**: #15
**Complexity**: M
**Duration**: 2 days
**Dependencies**: Phase 2 complete

**Tasks**:
- [ ] Install Tiptap packages
  - `npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder`
- [ ] Create `/src/components/features/articles/rich-text-editor.tsx`
- [ ] Configure Tiptap with StarterKit
- [ ] Add Markdown support
- [ ] Implement toolbar (bold, italic, headings, lists, links)
- [ ] Connect to article state
- [ ] Test basic editing

**Acceptance Criteria**:
- [ ] Editor renders with content
- [ ] Toolbar fully functional
- [ ] Markdown shortcuts work (e.g., `# ` for heading)
- [ ] Content syncs with article state
- [ ] Auto-save triggers on content change
- [ ] Performance acceptable

**Tiptap Extensions**:
- StarterKit (core functionality)
- Link (URL insertion)
- Placeholder (empty state)
- CodeBlock (code snippets)
- BulletList, OrderedList
- Heading (H1-H6)

---

### Sprint 5.1.2: Advanced Editor Features
**Issue**: #15
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: 5.1.1

**Tasks**:
- [ ] Add word count display
- [ ] Add reading time calculation
- [ ] Implement keyboard shortcuts
- [ ] Add focus mode (distraction-free)
- [ ] Implement text highlighting for patterns
- [ ] Add link preview on hover
- [ ] Test all features

**Acceptance Criteria**:
- [ ] Word count live updates
- [ ] Reading time accurate
- [ ] Keyboard shortcuts documented and working
- [ ] Focus mode hides sidebar/toolbar
- [ ] AI patterns highlighted in editor
- [ ] Link previews show on hover
- [ ] Editor responsive on mobile

---

## Milestone 5.2: Error Handling & Resilience (Week 11)

**Objective**: Comprehensive error handling and recovery

### Sprint 5.2.1: Error Handling Framework
**Issue**: #16
**Complexity**: L
**Duration**: 2 days
**Dependencies**: All features implemented

**Tasks**:
- [ ] Create `/src/lib/errors/` directory
- [ ] Define custom error classes
- [ ] Implement global error boundary
- [ ] Add error logging (console + database)
- [ ] Implement retry logic for API calls
- [ ] Add user-friendly error messages
- [ ] Test error scenarios

**Acceptance Criteria**:
- [ ] All errors caught and logged
- [ ] Custom error types for different scenarios
- [ ] Error boundary prevents app crashes
- [ ] Retry logic on transient failures
- [ ] User sees clear error messages
- [ ] Errors logged to database for monitoring

**Error Types**:
- `AuthenticationError` - Auth failures
- `AuthorizationError` - Permission denied
- `ValidationError` - Input validation failures
- `ExternalAPIError` - Third-party API failures
- `DatabaseError` - Database operation failures
- `RateLimitError` - Rate limit exceeded
- `QuotaExceededError` - Quota limit reached

---

### Sprint 5.2.2: Retry & Fallback Logic
**Issue**: #16
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: 5.2.1

**Tasks**:
- [ ] Create `/src/lib/services/retry.ts`
- [ ] Implement exponential backoff
- [ ] Add retry logic to AI calls
- [ ] Add retry logic to external APIs
- [ ] Implement fallback strategies
- [ ] Test retry scenarios
- [ ] Document retry configuration

**Acceptance Criteria**:
- [ ] Retries transient failures (429, 5xx)
- [ ] Exponential backoff: 1s, 2s, 4s, 8s
- [ ] Max 3 retries per call
- [ ] Non-retryable errors fail immediately
- [ ] Fallback to cached data when available
- [ ] User notified of retry attempts

**Implementation Reference**: `/docs/INTEGRATIONS.md` lines 777-842

---

## Milestone 5.3: Performance Optimization (Week 11-12)

**Objective**: Optimize database queries and UI rendering

### Sprint 5.3.1: Database Query Optimization
**Issue**: #17
**Complexity**: L
**Duration**: 2.5 days
**Dependencies**: All database queries implemented

**Tasks**:
- [ ] Audit all database queries with EXPLAIN ANALYZE
- [ ] Identify N+1 query problems
- [ ] Add missing indexes
- [ ] Implement query result caching
- [ ] Optimize RLS policy performance
- [ ] Batch database operations
- [ ] Test query performance

**Acceptance Criteria**:
- [ ] All queries <100ms (simple) / <500ms (complex)
- [ ] No N+1 query issues
- [ ] All foreign keys indexed
- [ ] RLS policies use indexes
- [ ] Query results cached where appropriate
- [ ] Database connection pooling configured

**Optimization Techniques**:
- Add composite indexes for common filters
- Use `select()` to limit returned columns
- Batch related queries with joins
- Cache frequently accessed data
- Use materialized views for complex aggregations

---

### Sprint 5.3.2: Frontend Performance
**Issue**: #17
**Complexity**: M
**Duration**: 2 days
**Dependencies**: 5.3.1

**Tasks**:
- [ ] Audit bundle size with `@next/bundle-analyzer`
- [ ] Implement code splitting on routes
- [ ] Optimize images with `next/image`
- [ ] Implement virtual scrolling for long lists
- [ ] Add React Suspense for loading states
- [ ] Optimize re-renders with React.memo
- [ ] Test Lighthouse scores

**Acceptance Criteria**:
- [ ] Initial bundle <200KB gzipped
- [ ] Lighthouse Performance score >90
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s
- [ ] No unnecessary re-renders
- [ ] Long lists virtualized (100+ items)
- [ ] Images lazy loaded

**Optimization Techniques**:
- Dynamic imports for heavy components
- React.memo for expensive renders
- useMemo/useCallback for computed values
- Virtual scrolling with react-window
- Image optimization with next/image

---

## Milestone 5.4: Security Audit (Week 12)

**Objective**: Validate security posture before launch

### Sprint 5.4.1: Security Review
**Issue**: #15
**Complexity**: M
**Duration**: 2 days
**Dependencies**: All features complete

**Tasks**:
- [ ] Audit RLS policies for leaks
- [ ] Test API key encryption/decryption
- [ ] Validate input sanitization
- [ ] Check for XSS vulnerabilities
- [ ] Test CSRF protection
- [ ] Audit authentication flows
- [ ] Review environment variable security
- [ ] Test rate limiting effectiveness

**Acceptance Criteria**:
- [ ] No data leakage between teams
- [ ] API keys never exposed to client
- [ ] All user input sanitized
- [ ] XSS attacks prevented
- [ ] CSRF tokens working
- [ ] Auth flows secure
- [ ] Secrets not in source code
- [ ] Rate limiting prevents abuse

**Security Checklist**:
- [ ] RLS policies prevent cross-team access
- [ ] API keys stored in Vault only
- [ ] User input validated with Zod
- [ ] HTML sanitized in rich text editor
- [ ] Auth middleware protects routes
- [ ] Environment variables prefixed correctly
- [ ] HTTPS enforced
- [ ] SQL injection prevented (ORM)

---

### Sprint 5.4.2: Penetration Testing
**Issue**: #15
**Complexity**: L
**Duration**: 2 days
**Dependencies**: 5.4.1

**Tasks**:
- [ ] Attempt unauthorized team access
- [ ] Test API endpoint authorization
- [ ] Try to extract API keys
- [ ] Test SQL injection vectors
- [ ] Test XSS with malicious content
- [ ] Attempt rate limit bypass
- [ ] Test session hijacking prevention
- [ ] Document findings and fix

**Acceptance Criteria**:
- [ ] Cannot access other teams' data
- [ ] Cannot call APIs without auth
- [ ] Cannot extract API keys
- [ ] SQL injection attempts fail
- [ ] XSS attempts sanitized
- [ ] Rate limits cannot be bypassed
- [ ] Session tokens secure
- [ ] All vulnerabilities fixed

---

## Milestone 5.5: Production Deployment (Week 12-13)

**Objective**: Deploy to Vercel with monitoring

### Sprint 5.5.1: Environment Setup
**Issue**: #18
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: All features complete, security audited

**Tasks**:
- [ ] Create production Supabase project
- [ ] Run migrations on production database
- [ ] Configure production environment variables
- [ ] Set up custom domain (if available)
- [ ] Configure CORS policies
- [ ] Set up Vercel project
- [ ] Configure build settings
- [ ] Test production build locally

**Acceptance Criteria**:
- [ ] Production Supabase project configured
- [ ] All tables and RLS policies deployed
- [ ] Environment variables set in Vercel
- [ ] Custom domain configured (optional)
- [ ] CORS allows production domain
- [ ] Build succeeds without errors
- [ ] Production build tested locally

---

### Sprint 5.5.2: Monitoring & Analytics
**Issue**: #18
**Complexity**: M
**Duration**: 1.5 days
**Dependencies**: 5.5.1

**Tasks**:
- [ ] Set up Vercel Analytics
- [ ] Configure error tracking (Sentry or similar)
- [ ] Set up database monitoring (Supabase dashboard)
- [ ] Create usage dashboard
- [ ] Set up uptime monitoring (UptimeRobot, etc.)
- [ ] Configure alerts for errors
- [ ] Test monitoring in staging

**Acceptance Criteria**:
- [ ] Vercel Analytics tracking visits
- [ ] Error tracking captures exceptions
- [ ] Database metrics visible
- [ ] Usage dashboard shows key metrics
- [ ] Uptime monitor checks every 5min
- [ ] Alerts sent on errors/downtime
- [ ] All monitoring tested

**Metrics to Track**:
- Page views and user sessions
- Error rates by type
- API response times
- Database query performance
- AI token usage
- External API usage
- User signups and retention

---

### Sprint 5.5.3: Deployment & Launch
**Issue**: #18
**Complexity**: M
**Duration**: 1 day
**Dependencies**: 5.5.2

**Tasks**:
- [ ] Deploy to Vercel production
- [ ] Verify deployment successful
- [ ] Test all features in production
- [ ] Smoke test critical user flows
- [ ] Monitor for errors
- [ ] Document rollback procedure
- [ ] Announce launch

**Acceptance Criteria**:
- [ ] Production deployment live
- [ ] All features functional
- [ ] Auth flows working
- [ ] AI generation working
- [ ] External APIs working
- [ ] No critical errors
- [ ] Performance acceptable
- [ ] Rollback procedure documented

**Critical User Flows to Test**:
1. Signup → Create team → Create brand
2. Brand discovery with URL crawl
3. Create article → Generate content → SEO optimize → Publish
4. Add API keys → Usage tracking
5. Invite team member → Role assignment

---

### Sprint 5.5.4: Post-Launch Monitoring
**Issue**: #18
**Complexity**: S
**Duration**: Ongoing (first week)
**Dependencies**: 5.5.3

**Tasks**:
- [ ] Monitor error rates (target <1%)
- [ ] Monitor performance (Lighthouse scores)
- [ ] Track user signups
- [ ] Monitor API usage
- [ ] Check database performance
- [ ] Review user feedback
- [ ] Address critical issues
- [ ] Plan next iterations

**Acceptance Criteria**:
- [ ] Error rate <1%
- [ ] Uptime >99.5%
- [ ] Performance scores maintained
- [ ] User feedback collected
- [ ] Critical issues resolved within 24h
- [ ] Roadmap updated with learnings

---

## Phase 5 Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Production bugs not caught | High | Medium | Comprehensive testing, staged rollout, monitoring |
| Performance degrades at scale | High | Medium | Load testing, caching, database optimization |
| Security vulnerability discovered | Critical | Low | Security audit, penetration testing, bug bounty |
| Deployment fails | High | Low | Test production build locally, rollback plan |
| User onboarding friction | Medium | Medium | Improve documentation, in-app guidance |

---

## Phase 5 Completion Checklist

- [ ] Tiptap editor fully functional
- [ ] Error handling comprehensive
- [ ] Retry logic on all external calls
- [ ] Database queries optimized
- [ ] Frontend performance optimized
- [ ] Security audit passed
- [ ] Penetration testing complete
- [ ] Production environment configured
- [ ] Monitoring and alerts set up
- [ ] Deployed to production
- [ ] Launch announcement sent
- [ ] Post-launch monitoring active

**Estimated Completion**: End of Week 13

---

# Cross-Cutting Concerns

## Testing Strategy

### Unit Tests (Throughout Development)
**Tools**: Jest, React Testing Library

**Coverage Targets**:
- Utilities: 90%+
- Business logic: 80%+
- Components: 70%+

**Priority Areas**:
- RLS helper functions
- AI prompt builders
- Token estimation
- Pattern detection
- Query builders

### Integration Tests (Phase 3-5)
**Tools**: Playwright, Supabase Test Helpers

**Critical Paths**:
- Auth flows (signup, login, OAuth)
- Article workflow (create → generate → optimize → publish)
- Brand discovery (crawl → analyze → save)
- Team management (create → invite → roles)

### E2E Tests (Phase 5)
**Tools**: Playwright

**Smoke Tests** (run before each deployment):
1. Complete user onboarding
2. Create brand with discovery
3. Generate and publish article
4. Add API key
5. Invite team member

---

## Documentation Requirements

### Developer Documentation
- [ ] API documentation (all endpoints)
- [ ] Database schema documentation
- [ ] Architecture decision records (ADRs)
- [ ] Deployment guide
- [ ] Local development setup
- [ ] Troubleshooting guide

### User Documentation (Post-Launch)
- [ ] Getting started guide
- [ ] Brand discovery tutorial
- [ ] Article creation tutorial
- [ ] SEO optimization guide
- [ ] API key setup (BYOK)
- [ ] Team management guide
- [ ] FAQs

---

## Performance Benchmarks

### Target Metrics
- Page load: <2s
- API response (non-AI): <1s
- AI generation start: <3s
- Database queries: <100ms (simple), <500ms (complex)
- Lighthouse Performance: >90
- Lighthouse Accessibility: >95

### Load Testing (Phase 5)
- 100 concurrent users
- 1000 articles per team
- 10,000 crawled pages per brand
- Sustained load for 10 minutes

---

## Dependency Map

### Phase Dependencies
```
Phase 1 (COMPLETE)
    ↓
Phase 2 (Supabase)
    ↓
    ├─→ Phase 3 (AI) ─┐
    │                 │
    └─→ Phase 4 (APIs)┴─→ Phase 5 (Production)
```

### Feature Dependencies
```
Auth (2.3) → Protected Routes (2.3.4)
Database (2.1) → Data Migration (2.4)
API Keys (2.4.5) → AI Generation (3.2)
Crawling (4.1) → Brand Discovery (4.1.3)
Brand Discovery (4.1.3) → Cross-Linking (4.3)
SEO API (4.2) → SEO Optimization (4.2.3)
All Features → Production Deploy (5.5)
```

---

## Resource Requirements

### Team Composition (Recommended)
- 1 Full-stack developer (all phases)
- 1 Frontend specialist (Phase 1-2, 5)
- 1 Backend/AI specialist (Phase 3-4)
- 1 DevOps/QA (Phase 5)

### External Services (MVP)
- Supabase: Free tier (upgrade to Pro at scale)
- Vercel: Hobby/Pro tier
- Upstash Redis: Pay-per-request
- Firecrawl: User-provided (BYOK)
- DataForSEO: User-provided (BYOK)

### Estimated Costs (Month 1, Low Usage)
- Supabase: $0 (free tier)
- Vercel: $0-20 (hobby/pro)
- Upstash: $0-10 (low traffic)
- Monitoring: $0 (free tiers)
- **Total**: $0-30/month

---

# Sprint Backlog Template

## Sprint Planning Checklist

Before starting each sprint:
- [ ] Review dependencies completed
- [ ] Assign complexity estimate
- [ ] Break into 1-day tasks
- [ ] Define acceptance criteria
- [ ] Identify blockers
- [ ] Set up test scenarios
- [ ] Review technical references

## Daily Sprint Format

### Morning
- Review yesterday's progress
- Identify today's focus tasks
- Check for blockers

### Afternoon
- Code/implement
- Write tests
- Update documentation

### Evening
- Commit progress
- Update sprint status
- Document learnings

---

# Appendix: Issue-to-Sprint Mapping

## Phase 2 Issues
- **#1**: Phase 2 umbrella (all sprints)
- **#2**: Sprints 2.1.1 - 2.1.5, 2.4.1 - 2.4.6
- **#3**: Sprints 2.2.1 - 2.2.4
- **#4**: Sprints 2.3.1 - 2.3.4

## Phase 3 Issues
- **#6**: Phase 3 umbrella (all sprints)
- **#7**: Sprints 3.1.1 - 3.1.3
- **#8**: Sprints 3.2.1 - 3.2.4
- **#9**: Sprints 3.3.1 - 3.3.4

## Phase 4 Issues
- **#10**: Phase 4 umbrella, Sprints 4.4.1 - 4.4.2
- **#11**: Sprints 4.1.1 - 4.1.4
- **#12**: Sprints 3.4.1 - 3.4.2, 4.1.3
- **#13**: Sprints 4.2.1 - 4.2.4
- **#14**: Sprints 4.3.1 - 4.3.3

## Phase 5 Issues
- **#15**: Phase 5 umbrella, Sprints 5.1.1 - 5.1.2, 5.4.1 - 5.4.2
- **#16**: Sprints 5.2.1 - 5.2.2
- **#17**: Sprints 5.3.1 - 5.3.2
- **#18**: Sprints 5.5.1 - 5.5.4

---

# Quick Reference: Complexity Estimates

## Legend
- **XS**: <0.5 day (4 hours)
- **S**: 0.5-1 day
- **M**: 1-2 days
- **L**: 2-3 days
- **XL**: 3+ days (should be broken down)

## Phase 2 Summary
- Total Sprints: 18
- Complexity: 2 XS, 6 S, 10 M, 6 L, 1 XL
- Estimated Duration: 3-4 weeks

## Phase 3 Summary
- Total Sprints: 13
- Complexity: 0 XS, 1 S, 7 M, 5 L, 0 XL
- Estimated Duration: 3-4 weeks

## Phase 4 Summary
- Total Sprints: 14
- Complexity: 0 XS, 1 S, 9 M, 4 L, 0 XL
- Estimated Duration: 3-4 weeks

## Phase 5 Summary
- Total Sprints: 12
- Complexity: 1 XS, 1 S, 8 M, 2 L, 0 XL
- Estimated Duration: 2-3 weeks

**Total Project Duration**: 12-16 weeks (3-4 months)

---

*Document Version: 1.0*
*Last Updated: 2025-01-10*
*Next Review: After Phase 2 completion*
