-- =============================================
-- Migration 04: SEO Data Tables
-- Keyword Research, Keyword Cache, SEO Usage Log
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
    competition DECIMAL(5, 4),
    competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high')),

    -- SERP data
    serp_features TEXT[] DEFAULT '{}',
    top_domains TEXT[] DEFAULT '{}',

    -- Related keywords
    related_keywords JSONB DEFAULT '[]',

    -- Metadata
    location_code INTEGER,
    language_code TEXT DEFAULT 'en',
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keyword cache for cost optimization
CREATE TABLE keyword_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL,
    location_code INTEGER DEFAULT 2840,

    data JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(keyword, location_code)
);

-- SEO API usage tracking
CREATE TABLE seo_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    operation TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    estimated_cost DECIMAL(10, 6),

    -- Context
    article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for SEO tables
CREATE INDEX idx_keyword_research_team_id ON keyword_research(team_id);
CREATE INDEX idx_keyword_research_article_id ON keyword_research(article_id);
CREATE INDEX idx_keyword_research_keyword ON keyword_research(keyword);

CREATE INDEX idx_keyword_cache_keyword ON keyword_cache(keyword);
CREATE INDEX idx_keyword_cache_expires_at ON keyword_cache(expires_at);
CREATE INDEX idx_keyword_cache_lookup ON keyword_cache(keyword, location_code, expires_at);

CREATE INDEX idx_seo_usage_log_team_id ON seo_usage_log(team_id);
CREATE INDEX idx_seo_usage_log_created_at ON seo_usage_log(created_at);
