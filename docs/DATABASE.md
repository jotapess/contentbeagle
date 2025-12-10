# ContentBeagle - Database Schema

## Overview

ContentBeagle uses Supabase (PostgreSQL) for data persistence with Row Level Security (RLS) for multi-tenant isolation. This document contains the complete database schema, RLS policies, and helper functions.

---

## Entity Relationship Diagram

```
                                    ┌──────────────┐
                                    │   auth.users │
                                    └──────┬───────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
             ┌──────────┐           ┌──────────────┐        ┌──────────┐
             │ profiles │           │ team_members │───────▶│  teams   │
             └──────────┘           └──────────────┘        └────┬─────┘
                                                                 │
                    ┌────────────────────────┬───────────────────┼───────────────────┐
                    │                        │                   │                   │
                    ▼                        ▼                   ▼                   ▼
             ┌──────────┐           ┌────────────────┐   ┌──────────────┐   ┌──────────────────┐
             │  brands  │           │ user_api_keys  │   │ai_pattern_   │   │   ai_usage_log   │
             └────┬─────┘           └────────────────┘   │   rules      │   └──────────────────┘
                  │                                      └──────────────┘
       ┌──────────┼──────────┐
       │          │          │
       ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│  brand_  │ │  crawl_  │ │ articles │
│ profiles │ │   jobs   │ └────┬─────┘
└──────────┘ └────┬─────┘      │
                  │      ┌─────┼─────┐
                  ▼      │     │     │
            ┌──────────┐ │     │     │
            │ crawled_ │ │     ▼     ▼
            │  pages   │ │ ┌────────┐ ┌─────────────┐
            └──────────┘ │ │article_│ │article_     │
                         │ │versions│ │workflow_log │
                         │ └────────┘ └─────────────┘
                         │
                         ▼
                    ┌────────────────┐
                    │article_comments│
                    └────────────────┘
```

---

## Complete SQL Schema

### Core Multi-Tenancy Tables

```sql
-- =============================================
-- USERS & TEAMS (Multi-Tenancy Foundation)
-- =============================================

-- Teams/Organizations (the tenant entity)
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members (junction table for users <-> teams)
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- User profiles (extended user data)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    default_team_id UUID REFERENCES teams(id),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Brand & Brand Profile Tables

```sql
-- =============================================
-- BRANDS & BRAND PROFILES
-- =============================================

-- Brands created by users
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    website_url TEXT,
    logo_url TEXT,
    description TEXT,
    industry TEXT,
    target_audience TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'crawling', 'analyzing', 'ready', 'error')),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand profiles (extracted voice/tone/style)
CREATE TABLE brand_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Voice characteristics
    voice_adjectives TEXT[] DEFAULT '{}',  -- e.g., ['warm', 'professional', 'witty']
    voice_description TEXT,                 -- Detailed voice description

    -- Tone settings (scales 1-10)
    tone_formality INTEGER CHECK (tone_formality BETWEEN 1 AND 10),      -- 1=casual, 10=formal
    tone_enthusiasm INTEGER CHECK (tone_enthusiasm BETWEEN 1 AND 10),    -- 1=reserved, 10=enthusiastic
    tone_humor INTEGER CHECK (tone_humor BETWEEN 1 AND 10),              -- 1=serious, 10=playful
    tone_confidence INTEGER CHECK (tone_confidence BETWEEN 1 AND 10),    -- 1=humble, 10=bold
    tone_empathy INTEGER CHECK (tone_empathy BETWEEN 1 AND 10),          -- 1=detached, 10=empathetic

    -- Style guidelines
    sentence_structure TEXT CHECK (sentence_structure IN ('short', 'mixed', 'long')),
    vocabulary_level TEXT CHECK (vocabulary_level IN ('simple', 'moderate', 'advanced', 'technical')),
    paragraph_length TEXT CHECK (paragraph_length IN ('short', 'medium', 'long')),
    preferred_pov TEXT CHECK (preferred_pov IN ('first_person', 'second_person', 'third_person', 'mixed')),

    -- Terminology and phrases
    key_terminology JSONB DEFAULT '[]',     -- [{term, definition, context}]
    power_words TEXT[] DEFAULT '{}',        -- Words to use frequently
    avoid_words TEXT[] DEFAULT '{}',        -- Words/phrases to never use
    branded_phrases JSONB DEFAULT '[]',     -- [{phrase, usage_context}]

    -- Content themes
    core_themes TEXT[] DEFAULT '{}',        -- Main topic areas
    value_propositions TEXT[] DEFAULT '{}', -- Key selling points
    pain_points_addressed TEXT[] DEFAULT '{}',

    -- Writing rules
    do_list TEXT[] DEFAULT '{}',           -- Things to always do
    dont_list TEXT[] DEFAULT '{}',         -- Things to never do

    -- Sample content for reference
    sample_sentences JSONB DEFAULT '[]',    -- [{original, context, why_effective}]

    -- Metadata
    confidence_score FLOAT,                 -- AI confidence in extraction (0-1)
    source_pages_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(brand_id, version)
);

-- Brand competitors (for differentiation)
CREATE TABLE brand_competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    competitor_name TEXT NOT NULL,
    competitor_url TEXT,
    differentiation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Crawled Content Tables

```sql
-- =============================================
-- CRAWLED PAGES & CONTENT
-- =============================================

-- Crawl jobs (tracks crawl operations)
CREATE TABLE crawl_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    started_by UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    seed_urls TEXT[] NOT NULL,
    max_pages INTEGER DEFAULT 50,
    pages_crawled INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual crawled pages
CREATE TABLE crawled_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    crawl_job_id UUID REFERENCES crawl_jobs(id) ON DELETE SET NULL,

    url TEXT NOT NULL,
    canonical_url TEXT,
    title TEXT,
    meta_description TEXT,

    -- Content storage
    markdown_content TEXT,                  -- Cleaned markdown version
    plain_text TEXT,                        -- Plain text for analysis
    content_hash TEXT,                      -- For change detection

    -- AI-generated summaries for cross-linking
    summary TEXT,                           -- 2-3 sentence summary
    key_topics TEXT[] DEFAULT '{}',         -- Main topics covered
    target_keywords TEXT[] DEFAULT '{}',    -- SEO keywords
    content_type TEXT,                      -- blog, product, about, faq, etc.

    -- Metadata
    word_count INTEGER,
    reading_time_minutes INTEGER,
    published_date TIMESTAMPTZ,
    last_modified TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN DEFAULT true,
    crawled_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(brand_id, url)
);
```

### Articles & Workflow Tables

```sql
-- =============================================
-- ARTICLES & CONTENT WORKFLOW
-- =============================================

-- Articles (the main content entity)
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

    -- Basic info
    title TEXT NOT NULL,
    slug TEXT,
    excerpt TEXT,

    -- Current content
    content TEXT,                           -- Current markdown content
    content_html TEXT,                      -- Rendered HTML

    -- Workflow state
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft',           -- Initial writing
        'editing',         -- Content review/editing
        'seo_review',      -- SEO optimization phase
        'cross_linking',   -- Adding internal links
        'humanizing',      -- AI pattern removal
        'polished',        -- Ready for final review
        'approved',        -- Approved by editor
        'published',       -- Live/published
        'archived'         -- No longer active
    )),

    -- Input metadata
    input_type TEXT CHECK (input_type IN ('bullets', 'draft', 'research', 'topic_only')),
    original_input TEXT,                    -- User's original input
    target_audience TEXT,
    target_length TEXT,                     -- 'short', 'medium', 'long', or word count
    call_to_action TEXT,

    -- SEO metadata
    seo_title TEXT,
    seo_description TEXT,
    focus_keyword TEXT,
    secondary_keywords TEXT[] DEFAULT '{}',
    seo_score INTEGER,                      -- 0-100

    -- Cross-linking data
    suggested_links JSONB DEFAULT '[]',     -- [{url, anchor_text, context, relevance_score}]
    applied_links JSONB DEFAULT '[]',       -- Links actually added

    -- AI humanization tracking
    humanization_applied BOOLEAN DEFAULT false,
    humanization_rules_used UUID[] DEFAULT '{}',
    ai_patterns_found JSONB DEFAULT '[]',   -- [{pattern_id, count, locations}]

    -- Metadata
    word_count INTEGER,
    reading_time_minutes INTEGER,
    featured_image_url TEXT,

    -- Publishing
    published_url TEXT,
    published_at TIMESTAMPTZ,

    -- Authorship
    created_by UUID NOT NULL REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article versions (for history/rollback)
CREATE TABLE article_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,

    title TEXT NOT NULL,
    content TEXT,
    content_html TEXT,

    -- Snapshot of status at this version
    status TEXT NOT NULL,

    -- What changed
    change_summary TEXT,
    changed_by UUID NOT NULL REFERENCES auth.users(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(article_id, version_number)
);

-- Article workflow transitions (audit log)
CREATE TABLE article_workflow_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    transitioned_by UUID NOT NULL REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article comments (for collaboration)
CREATE TABLE article_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES article_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,

    -- Optional: highlight specific text
    highlighted_text TEXT,
    text_position_start INTEGER,
    text_position_end INTEGER,

    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### AI Pattern Rules Tables

```sql
-- =============================================
-- AI PATTERN RULES (HUMANIZATION)
-- =============================================

-- Global AI pattern rules (system-provided defaults)
CREATE TABLE ai_pattern_rules_global (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'phrase_replacement',    -- Replace specific AI-like phrases
        'sentence_structure',    -- Fix repetitive structures
        'word_variety',          -- Add vocabulary diversity
        'transition_words',      -- Reduce overused transitions
        'punctuation',           -- Fix punctuation patterns
        'paragraph_flow',        -- Improve paragraph transitions
        'tone_adjustment',       -- Adjust overly neutral tone
        'custom'                 -- User-defined
    )),

    -- Rule definition
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('regex', 'exact', 'semantic', 'ai_detection')),
    pattern TEXT,                           -- The pattern to match
    replacement TEXT,                       -- Replacement (if applicable)
    replacement_options TEXT[] DEFAULT '{}', -- Multiple replacement options

    -- Metadata
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team-specific AI pattern rules
CREATE TABLE ai_pattern_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    -- Can inherit from global
    global_rule_id UUID REFERENCES ai_pattern_rules_global(id),

    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,

    -- Rule definition
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('regex', 'exact', 'semantic', 'ai_detection')),
    pattern TEXT,
    replacement TEXT,
    replacement_options TEXT[] DEFAULT '{}',

    -- Override global settings
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    is_active BOOLEAN DEFAULT true,

    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Keys & Usage Tables

```sql
-- =============================================
-- API KEYS (BYOK - Bring Your Own Key)
-- =============================================

-- API key providers
CREATE TABLE api_providers (
    id TEXT PRIMARY KEY,                    -- 'openai', 'anthropic', 'google', 'firecrawl', 'dataforseo'
    name TEXT NOT NULL,
    base_url TEXT,
    docs_url TEXT,
    required_fields JSONB DEFAULT '["api_key"]',
    is_active BOOLEAN DEFAULT true
);

-- User API keys (encrypted via Vault)
CREATE TABLE user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    provider_id TEXT NOT NULL REFERENCES api_providers(id),

    -- Key stored in vault, this is just metadata
    vault_secret_id UUID NOT NULL,          -- Reference to vault.secrets.id

    -- Additional config (non-sensitive)
    config JSONB DEFAULT '{}',              -- e.g., preferred model, org_id

    -- Usage tracking
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    last_error TEXT,

    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(team_id, provider_id)
);

-- AI usage tracking
CREATE TABLE ai_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),

    provider TEXT NOT NULL,                 -- openai, anthropic, etc.
    model TEXT NOT NULL,                    -- gpt-4, claude-3, etc.

    -- Usage metrics
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,

    -- Request context
    feature TEXT NOT NULL,                  -- brand_analysis, content_generation, humanization, etc.
    article_id UUID REFERENCES articles(id),
    brand_id UUID REFERENCES brands(id),

    -- Cost estimation
    estimated_cost DECIMAL(10, 6),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crawl usage tracking
CREATE TABLE crawl_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    crawl_job_id UUID REFERENCES crawl_jobs(id),

    pages_crawled INTEGER NOT NULL,
    credits_used INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### SEO Data Tables

```sql
-- =============================================
-- SEO DATA (DataForSEO Integration)
-- =============================================

-- Keyword research results
CREATE TABLE keyword_research (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE SET NULL,

    keyword TEXT NOT NULL,

    -- Search metrics
    search_volume INTEGER,
    cpc DECIMAL(10, 2),
    competition DECIMAL(5, 4),              -- 0.0000 to 1.0000
    competition_level TEXT,                 -- low, medium, high

    -- SERP data
    serp_features TEXT[] DEFAULT '{}',      -- featured_snippet, people_also_ask, etc.
    top_domains TEXT[] DEFAULT '{}',        -- Top ranking domains

    -- Related keywords
    related_keywords JSONB DEFAULT '[]',    -- [{keyword, search_volume, relevance}]

    -- Metadata
    location_code INTEGER,                  -- DataForSEO location code
    language_code TEXT DEFAULT 'en',
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keyword cache for cost optimization
CREATE TABLE keyword_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL,
    location_code INTEGER DEFAULT 2840,     -- US

    data JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(keyword, location_code)
);

-- SEO API usage tracking
CREATE TABLE seo_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    operation TEXT NOT NULL,                -- 'keyword_volume', 'related_keywords', 'serp', etc.
    request_count INTEGER NOT NULL DEFAULT 1,
    estimated_cost DECIMAL(10, 6),          -- Dollar cost estimate

    -- Context
    article_id UUID REFERENCES articles(id),
    brand_id UUID REFERENCES brands(id),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for SEO usage aggregation
CREATE INDEX idx_seo_usage_log_team_id ON seo_usage_log(team_id);
CREATE INDEX idx_seo_usage_log_created_at ON seo_usage_log(created_at);
```

---

## Indexes

```sql
-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Team membership lookups
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);

-- Brand lookups
CREATE INDEX idx_brands_team_id ON brands(team_id);
CREATE INDEX idx_brands_status ON brands(status);

-- Article lookups
CREATE INDEX idx_articles_team_id ON articles(team_id);
CREATE INDEX idx_articles_brand_id ON articles(brand_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_created_by ON articles(created_by);
CREATE INDEX idx_articles_assigned_to ON articles(assigned_to);

-- Crawled pages
CREATE INDEX idx_crawled_pages_brand_id ON crawled_pages(brand_id);
CREATE INDEX idx_crawled_pages_url ON crawled_pages(url);
CREATE INDEX idx_crawled_pages_content_type ON crawled_pages(content_type);

-- Full-text search on crawled pages
CREATE INDEX idx_crawled_pages_fts ON crawled_pages
    USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(plain_text, '')));

-- AI pattern rules
CREATE INDEX idx_ai_pattern_rules_team_id ON ai_pattern_rules(team_id);
CREATE INDEX idx_ai_pattern_rules_category ON ai_pattern_rules(category);

-- Usage tracking
CREATE INDEX idx_ai_usage_log_team_id ON ai_usage_log(team_id);
CREATE INDEX idx_ai_usage_log_created_at ON ai_usage_log(created_at);

-- Keyword cache expiry
CREATE INDEX idx_keyword_cache_expires_at ON keyword_cache(expires_at);
```

---

## RLS Helper Functions

```sql
-- =============================================
-- RLS HELPER FUNCTIONS
-- =============================================

-- Check if user is member of a team
CREATE OR REPLACE FUNCTION is_team_member(p_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = p_team_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has specific role in team
CREATE OR REPLACE FUNCTION has_team_role(p_team_id UUID, p_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = p_team_id
        AND user_id = auth.uid()
        AND role = ANY(p_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get user's teams (for efficient filtering)
CREATE OR REPLACE FUNCTION get_user_teams()
RETURNS SETOF UUID AS $$
    SELECT team_id FROM team_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

---

## RLS Policies

```sql
-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawled_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_workflow_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_pattern_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

-- TEAMS
CREATE POLICY "Users can view teams they belong to"
    ON teams FOR SELECT
    USING ((SELECT is_team_member(id)));

CREATE POLICY "Users can create teams"
    ON teams FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners/admins can update teams"
    ON teams FOR UPDATE
    USING ((SELECT has_team_role(id, ARRAY['owner', 'admin'])));

CREATE POLICY "Only owners can delete teams"
    ON teams FOR DELETE
    USING (owner_id = auth.uid());

-- TEAM_MEMBERS
CREATE POLICY "Team members can view other members"
    ON team_members FOR SELECT
    USING ((SELECT is_team_member(team_id)));

CREATE POLICY "Owners/admins can manage members"
    ON team_members FOR INSERT
    WITH CHECK ((SELECT has_team_role(team_id, ARRAY['owner', 'admin'])));

CREATE POLICY "Owners/admins can update members"
    ON team_members FOR UPDATE
    USING ((SELECT has_team_role(team_id, ARRAY['owner', 'admin'])));

CREATE POLICY "Owners/admins can remove members"
    ON team_members FOR DELETE
    USING ((SELECT has_team_role(team_id, ARRAY['owner', 'admin'])) OR user_id = auth.uid());

-- PROFILES
CREATE POLICY "Users can view all profiles in their teams"
    ON profiles FOR SELECT
    USING (
        id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM team_members tm1
            JOIN team_members tm2 ON tm1.team_id = tm2.team_id
            WHERE tm1.user_id = auth.uid() AND tm2.user_id = profiles.id
        )
    );

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- BRANDS
CREATE POLICY "Team members can view brands"
    ON brands FOR SELECT
    USING ((SELECT is_team_member(team_id)));

CREATE POLICY "Editors+ can create brands"
    ON brands FOR INSERT
    WITH CHECK ((SELECT has_team_role(team_id, ARRAY['owner', 'admin', 'editor'])));

CREATE POLICY "Editors+ can update brands"
    ON brands FOR UPDATE
    USING ((SELECT has_team_role(team_id, ARRAY['owner', 'admin', 'editor'])));

CREATE POLICY "Admins+ can delete brands"
    ON brands FOR DELETE
    USING ((SELECT has_team_role(team_id, ARRAY['owner', 'admin'])));

-- BRAND_PROFILES
CREATE POLICY "Team members can view brand profiles"
    ON brand_profiles FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM brands
        WHERE brands.id = brand_profiles.brand_id
        AND (SELECT is_team_member(brands.team_id))
    ));

CREATE POLICY "Editors+ can manage brand profiles"
    ON brand_profiles FOR ALL
    USING (EXISTS (
        SELECT 1 FROM brands
        WHERE brands.id = brand_profiles.brand_id
        AND (SELECT has_team_role(brands.team_id, ARRAY['owner', 'admin', 'editor']))
    ));

-- ARTICLES
CREATE POLICY "Team members can view articles"
    ON articles FOR SELECT
    USING ((SELECT is_team_member(team_id)));

CREATE POLICY "Editors+ can create articles"
    ON articles FOR INSERT
    WITH CHECK ((SELECT has_team_role(team_id, ARRAY['owner', 'admin', 'editor'])));

CREATE POLICY "Editors+ can update articles"
    ON articles FOR UPDATE
    USING ((SELECT has_team_role(team_id, ARRAY['owner', 'admin', 'editor'])));

CREATE POLICY "Admins+ can delete articles"
    ON articles FOR DELETE
    USING ((SELECT has_team_role(team_id, ARRAY['owner', 'admin'])));

-- CRAWLED_PAGES
CREATE POLICY "Team members can view crawled pages"
    ON crawled_pages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM brands
        WHERE brands.id = crawled_pages.brand_id
        AND (SELECT is_team_member(brands.team_id))
    ));

-- AI_PATTERN_RULES
CREATE POLICY "Team members can view rules"
    ON ai_pattern_rules FOR SELECT
    USING ((SELECT is_team_member(team_id)));

CREATE POLICY "Editors+ can manage rules"
    ON ai_pattern_rules FOR ALL
    USING ((SELECT has_team_role(team_id, ARRAY['owner', 'admin', 'editor'])));

-- USER_API_KEYS (most restrictive)
CREATE POLICY "Only admins+ can view API keys"
    ON user_api_keys FOR SELECT
    USING ((SELECT has_team_role(team_id, ARRAY['owner', 'admin'])));

CREATE POLICY "Only admins+ can manage API keys"
    ON user_api_keys FOR ALL
    USING ((SELECT has_team_role(team_id, ARRAY['owner', 'admin'])));
```

---

## Vault Functions for API Key Storage

```sql
-- =============================================
-- VAULT FUNCTIONS FOR SECURE API KEY STORAGE
-- =============================================

-- First, enable Vault extension (run once in Supabase dashboard)
-- CREATE EXTENSION IF NOT EXISTS vault;

-- Function to securely store API key
CREATE OR REPLACE FUNCTION store_api_key(
    p_team_id UUID,
    p_provider_id TEXT,
    p_api_key TEXT,
    p_config JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_secret_id UUID;
    v_key_id UUID;
BEGIN
    -- Store in vault
    SELECT vault.create_secret(
        p_api_key,
        'api_key_' || p_team_id || '_' || p_provider_id,
        'API key for ' || p_provider_id
    ) INTO v_secret_id;

    -- Upsert the key record
    INSERT INTO user_api_keys (team_id, provider_id, vault_secret_id, config, created_by)
    VALUES (p_team_id, p_provider_id, v_secret_id, p_config, auth.uid())
    ON CONFLICT (team_id, provider_id)
    DO UPDATE SET
        vault_secret_id = v_secret_id,
        config = p_config,
        updated_at = NOW()
    RETURNING id INTO v_key_id;

    RETURN v_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to retrieve decrypted API key (use carefully, server-side only)
CREATE OR REPLACE FUNCTION get_api_key(p_team_id UUID, p_provider_id TEXT)
RETURNS TEXT AS $$
DECLARE
    v_secret_id UUID;
    v_decrypted TEXT;
BEGIN
    SELECT vault_secret_id INTO v_secret_id
    FROM user_api_keys
    WHERE team_id = p_team_id AND provider_id = p_provider_id AND is_active = true;

    IF v_secret_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT decrypted_secret INTO v_decrypted
    FROM vault.decrypted_secrets
    WHERE id = v_secret_id;

    -- Update last used
    UPDATE user_api_keys
    SET last_used_at = NOW()
    WHERE team_id = p_team_id AND provider_id = p_provider_id;

    RETURN v_decrypted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Seed Data

```sql
-- =============================================
-- SEED DATA
-- =============================================

-- API Providers
INSERT INTO api_providers (id, name, base_url, docs_url) VALUES
('openai', 'OpenAI', 'https://api.openai.com/v1', 'https://platform.openai.com/docs'),
('anthropic', 'Anthropic', 'https://api.anthropic.com/v1', 'https://docs.anthropic.com'),
('google', 'Google AI', 'https://generativelanguage.googleapis.com/v1', 'https://ai.google.dev/docs'),
('firecrawl', 'Firecrawl', 'https://api.firecrawl.dev/v1', 'https://docs.firecrawl.dev'),
('dataforseo', 'DataForSEO', 'https://api.dataforseo.com/v3', 'https://docs.dataforseo.com');

-- Global AI Pattern Rules (placeholder examples)
INSERT INTO ai_pattern_rules_global (name, description, category, pattern_type, pattern, replacement_options, severity) VALUES
('Delve', 'Overused AI word "delve"', 'word_variety', 'regex', '\bdelve(s|d)?\b', ARRAY['explore', 'examine', 'look at', 'investigate'], 'medium'),
('In Conclusion', 'Explicit conclusion marker', 'transition_words', 'regex', '\bin\s+conclusion\b', ARRAY['to wrap up', 'finally', 'all in all'], 'medium'),
('Important to Note', 'Filler phrase', 'phrase_replacement', 'exact', 'it''s important to note that', ARRAY['', 'notably'], 'medium'),
('In Today''s X', 'Generic opener', 'phrase_replacement', 'regex', '\bin today''s \w+\b', ARRAY[''], 'low'),
('Let''s Dive In', 'AI opener cliche', 'phrase_replacement', 'exact', 'let''s dive in', ARRAY['here''s what you need to know', ''], 'medium'),
('Robust', 'Overused AI adjective', 'word_variety', 'regex', '\brobust\b', ARRAY['strong', 'reliable', 'solid'], 'low'),
('Leverage', 'Corporate AI verb', 'word_variety', 'regex', '\bleverage(s|d)?\b', ARRAY['use', 'apply', 'employ'], 'low'),
('Streamline', 'AI verb cliche', 'word_variety', 'regex', '\bstreamline(s|d)?\b', ARRAY['simplify', 'improve', 'speed up'], 'low'),
('Tapestry', 'AI metaphor cliche', 'word_variety', 'exact', 'tapestry', ARRAY[''], 'medium'),
('Crucially', 'Overused transition', 'transition_words', 'exact', 'crucially', ARRAY['importantly', 'notably', 'significantly'], 'low'),
('Moreover', 'Formal transition', 'transition_words', 'exact', 'moreover', ARRAY['also', 'additionally', 'plus'], 'low'),
('Furthermore', 'Formal transition', 'transition_words', 'exact', 'furthermore', ARRAY['also', 'and', 'plus'], 'low');
```

---

## Migration Strategy

1. **00001_initial_schema.sql**: Core tables (teams, profiles, brands, articles)
2. **00002_rls_policies.sql**: All RLS policies and helper functions
3. **00003_vault_functions.sql**: Secure API key storage functions
4. **00004_seed_data.sql**: API providers and global AI pattern rules
5. **00005_indexes.sql**: Performance indexes

Run migrations in order using Supabase CLI:
```bash
supabase db push
# or for individual migrations
supabase migration up
```
