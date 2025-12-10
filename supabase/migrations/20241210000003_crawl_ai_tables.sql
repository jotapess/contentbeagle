-- =============================================
-- Migration 03: Crawling and AI Tables
-- Crawl Jobs, Crawled Pages, AI Pattern Rules, API Keys, Usage Logs
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
    markdown_content TEXT,
    plain_text TEXT,
    content_hash TEXT,

    -- AI-generated summaries for cross-linking
    summary TEXT,
    key_topics TEXT[] DEFAULT '{}',
    target_keywords TEXT[] DEFAULT '{}',
    content_type TEXT,

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

-- Global AI pattern rules (system-provided defaults)
CREATE TABLE ai_pattern_rules_global (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'phrase_replacement',
        'sentence_structure',
        'word_variety',
        'transition_words',
        'punctuation',
        'paragraph_flow',
        'tone_adjustment',
        'custom'
    )),

    -- Rule definition
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('regex', 'exact', 'semantic', 'ai_detection')),
    pattern TEXT,
    replacement TEXT,
    replacement_options TEXT[] DEFAULT '{}',

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
    category TEXT NOT NULL CHECK (category IN (
        'phrase_replacement',
        'sentence_structure',
        'word_variety',
        'transition_words',
        'punctuation',
        'paragraph_flow',
        'tone_adjustment',
        'custom'
    )),

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

-- API key providers
CREATE TABLE api_providers (
    id TEXT PRIMARY KEY,
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
    vault_secret_id UUID,

    -- Additional config (non-sensitive)
    config JSONB DEFAULT '{}',

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

    provider TEXT NOT NULL,
    model TEXT NOT NULL,

    -- Usage metrics
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,

    -- Request context
    feature TEXT NOT NULL,
    article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,

    -- Cost estimation
    estimated_cost DECIMAL(10, 6),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crawl usage tracking
CREATE TABLE crawl_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    crawl_job_id UUID REFERENCES crawl_jobs(id) ON DELETE SET NULL,

    pages_crawled INTEGER NOT NULL,
    credits_used INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated_at trigger for ai_pattern_rules
CREATE TRIGGER update_ai_pattern_rules_updated_at
    BEFORE UPDATE ON ai_pattern_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at
    BEFORE UPDATE ON user_api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for crawl and AI tables
CREATE INDEX idx_crawl_jobs_brand_id ON crawl_jobs(brand_id);
CREATE INDEX idx_crawl_jobs_status ON crawl_jobs(status);

CREATE INDEX idx_crawled_pages_brand_id ON crawled_pages(brand_id);
CREATE INDEX idx_crawled_pages_url ON crawled_pages(url);
CREATE INDEX idx_crawled_pages_content_type ON crawled_pages(content_type);
CREATE INDEX idx_crawled_pages_crawl_job_id ON crawled_pages(crawl_job_id);

-- Full-text search on crawled pages
CREATE INDEX idx_crawled_pages_fts ON crawled_pages
    USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(plain_text, '')));

CREATE INDEX idx_ai_pattern_rules_global_category ON ai_pattern_rules_global(category);
CREATE INDEX idx_ai_pattern_rules_global_is_active ON ai_pattern_rules_global(is_active);

CREATE INDEX idx_ai_pattern_rules_team_id ON ai_pattern_rules(team_id);
CREATE INDEX idx_ai_pattern_rules_category ON ai_pattern_rules(category);

CREATE INDEX idx_user_api_keys_team_id ON user_api_keys(team_id);
CREATE INDEX idx_user_api_keys_provider_id ON user_api_keys(provider_id);

CREATE INDEX idx_ai_usage_log_team_id ON ai_usage_log(team_id);
CREATE INDEX idx_ai_usage_log_created_at ON ai_usage_log(created_at);
CREATE INDEX idx_ai_usage_log_feature ON ai_usage_log(feature);

CREATE INDEX idx_crawl_usage_log_team_id ON crawl_usage_log(team_id);
CREATE INDEX idx_crawl_usage_log_created_at ON crawl_usage_log(created_at);
