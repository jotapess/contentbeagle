-- =============================================
-- Migration 02: Brand and Content Tables
-- Brands, Brand Profiles, Articles, Versions, Comments
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
    voice_adjectives TEXT[] DEFAULT '{}',
    voice_description TEXT,

    -- Tone settings (scales 1-10)
    tone_formality INTEGER CHECK (tone_formality BETWEEN 1 AND 10),
    tone_enthusiasm INTEGER CHECK (tone_enthusiasm BETWEEN 1 AND 10),
    tone_humor INTEGER CHECK (tone_humor BETWEEN 1 AND 10),
    tone_confidence INTEGER CHECK (tone_confidence BETWEEN 1 AND 10),
    tone_empathy INTEGER CHECK (tone_empathy BETWEEN 1 AND 10),

    -- Style guidelines
    sentence_structure TEXT CHECK (sentence_structure IN ('short', 'mixed', 'long')),
    vocabulary_level TEXT CHECK (vocabulary_level IN ('simple', 'moderate', 'advanced', 'technical')),
    paragraph_length TEXT CHECK (paragraph_length IN ('short', 'medium', 'long')),
    preferred_pov TEXT CHECK (preferred_pov IN ('first_person', 'second_person', 'third_person', 'mixed')),

    -- Terminology and phrases
    key_terminology JSONB DEFAULT '[]',
    power_words TEXT[] DEFAULT '{}',
    avoid_words TEXT[] DEFAULT '{}',
    branded_phrases JSONB DEFAULT '[]',

    -- Content themes
    core_themes TEXT[] DEFAULT '{}',
    value_propositions TEXT[] DEFAULT '{}',
    pain_points_addressed TEXT[] DEFAULT '{}',

    -- Writing rules
    do_list TEXT[] DEFAULT '{}',
    dont_list TEXT[] DEFAULT '{}',

    -- Sample content for reference
    sample_sentences JSONB DEFAULT '[]',

    -- Metadata
    confidence_score FLOAT,
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
    content TEXT,
    content_html TEXT,

    -- Workflow state
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft',
        'editing',
        'seo_review',
        'cross_linking',
        'humanizing',
        'polished',
        'approved',
        'published',
        'archived'
    )),

    -- Input metadata
    input_type TEXT CHECK (input_type IN ('bullets', 'draft', 'research', 'topic_only')),
    original_input TEXT,
    target_audience TEXT,
    target_length TEXT,
    call_to_action TEXT,

    -- SEO metadata
    seo_title TEXT,
    seo_description TEXT,
    focus_keyword TEXT,
    secondary_keywords TEXT[] DEFAULT '{}',
    seo_score INTEGER,

    -- Cross-linking data
    suggested_links JSONB DEFAULT '[]',
    applied_links JSONB DEFAULT '[]',

    -- AI humanization tracking
    humanization_applied BOOLEAN DEFAULT false,
    humanization_rules_used UUID[] DEFAULT '{}',
    ai_patterns_found JSONB DEFAULT '[]',

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

-- Updated_at triggers
CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_profiles_updated_at
    BEFORE UPDATE ON brand_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_article_comments_updated_at
    BEFORE UPDATE ON article_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for brand and content tables
CREATE INDEX idx_brands_team_id ON brands(team_id);
CREATE INDEX idx_brands_status ON brands(status);
CREATE INDEX idx_brands_created_by ON brands(created_by);

CREATE INDEX idx_brand_profiles_brand_id ON brand_profiles(brand_id);
CREATE INDEX idx_brand_profiles_is_active ON brand_profiles(is_active);

CREATE INDEX idx_brand_competitors_brand_id ON brand_competitors(brand_id);

CREATE INDEX idx_articles_team_id ON articles(team_id);
CREATE INDEX idx_articles_brand_id ON articles(brand_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_created_by ON articles(created_by);
CREATE INDEX idx_articles_assigned_to ON articles(assigned_to);

CREATE INDEX idx_article_versions_article_id ON article_versions(article_id);
CREATE INDEX idx_article_workflow_log_article_id ON article_workflow_log(article_id);
CREATE INDEX idx_article_comments_article_id ON article_comments(article_id);
CREATE INDEX idx_article_comments_parent_id ON article_comments(parent_id);
