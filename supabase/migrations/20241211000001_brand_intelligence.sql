-- ============================================
-- Brand Intelligence Table
-- ============================================
-- Stores extracted intelligence from crawled brand content:
-- - Keywords extracted from pages
-- - Topics/themes identified
-- - Keyword opportunities from DataForSEO
-- - Content gaps analysis
-- ============================================

-- Create brand_intelligence table
CREATE TABLE IF NOT EXISTS brand_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

    -- Extracted Keywords (from crawled content)
    -- Format: [{keyword: string, frequency: number, relevance_score: number, source_pages: string[]}]
    extracted_keywords JSONB DEFAULT '[]'::jsonb,

    -- Topics/Themes identified across brand content
    -- Format: [{topic: string, frequency: number, related_keywords: string[], source_pages: string[]}]
    extracted_topics JSONB DEFAULT '[]'::jsonb,

    -- Keyword Opportunities (enriched with DataForSEO data)
    -- Format: [{keyword: string, search_volume: number, competition: number, cpc: number, opportunity_score: number}]
    keyword_opportunities JSONB DEFAULT '[]'::jsonb,

    -- Content Gaps (topics to potentially cover)
    -- Format: [{topic: string, reason: string, search_volume: number, suggested_keywords: string[]}]
    content_gaps JSONB DEFAULT '[]'::jsonb,

    -- Brand Voice Summary (extracted characteristics)
    -- Format: {tone: string, style: string, vocabulary_level: string, key_phrases: string[]}
    voice_summary JSONB DEFAULT '{}'::jsonb,

    -- Metadata
    last_extraction_at TIMESTAMPTZ,
    last_keyword_research_at TIMESTAMPTZ,
    extraction_model TEXT,                  -- AI model used for extraction (e.g., 'gpt-4o-mini')
    pages_analyzed INTEGER DEFAULT 0,
    extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'extracting', 'researching', 'completed', 'failed')),
    extraction_error TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- One intelligence record per brand
    UNIQUE(brand_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_brand_intelligence_brand_id ON brand_intelligence(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_intelligence_status ON brand_intelligence(extraction_status);

-- ============================================
-- Enhance crawled_pages table
-- ============================================

-- Add columns for page-level extracted data
ALTER TABLE crawled_pages
ADD COLUMN IF NOT EXISTS extracted_keywords TEXT[] DEFAULT '{}';

ALTER TABLE crawled_pages
ADD COLUMN IF NOT EXISTS content_category TEXT;

ALTER TABLE crawled_pages
ADD COLUMN IF NOT EXISTS primary_topic TEXT;

-- Add index for keyword searches
CREATE INDEX IF NOT EXISTS idx_crawled_pages_keywords ON crawled_pages USING GIN(extracted_keywords);
CREATE INDEX IF NOT EXISTS idx_crawled_pages_category ON crawled_pages(content_category);

-- ============================================
-- RLS Policies for brand_intelligence
-- ============================================

-- Enable RLS
ALTER TABLE brand_intelligence ENABLE ROW LEVEL SECURITY;

-- Select: Team members can view their brand's intelligence
CREATE POLICY "Team members can view brand intelligence"
ON brand_intelligence FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM brands b
        WHERE b.id = brand_intelligence.brand_id
        AND is_team_member(b.team_id)
    )
);

-- Insert: Team members can create intelligence records
CREATE POLICY "Team members can create brand intelligence"
ON brand_intelligence FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM brands b
        WHERE b.id = brand_intelligence.brand_id
        AND is_team_member(b.team_id)
    )
);

-- Update: Team members can update intelligence records
CREATE POLICY "Team members can update brand intelligence"
ON brand_intelligence FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM brands b
        WHERE b.id = brand_intelligence.brand_id
        AND is_team_member(b.team_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM brands b
        WHERE b.id = brand_intelligence.brand_id
        AND is_team_member(b.team_id)
    )
);

-- Delete: Team admins/owners can delete intelligence records
CREATE POLICY "Team admins can delete brand intelligence"
ON brand_intelligence FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM brands b
        WHERE b.id = brand_intelligence.brand_id
        AND has_team_role(b.team_id, ARRAY['owner', 'admin'])
    )
);

-- ============================================
-- Updated_at trigger for brand_intelligence
-- ============================================

CREATE OR REPLACE FUNCTION update_brand_intelligence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_brand_intelligence_updated_at
    BEFORE UPDATE ON brand_intelligence
    FOR EACH ROW
    EXECUTE FUNCTION update_brand_intelligence_updated_at();

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON TABLE brand_intelligence IS 'Stores extracted intelligence from crawled brand content including keywords, topics, and opportunities';
COMMENT ON COLUMN brand_intelligence.extracted_keywords IS 'Keywords extracted from crawled pages with frequency and relevance scores';
COMMENT ON COLUMN brand_intelligence.extracted_topics IS 'Topics/themes identified across brand content';
COMMENT ON COLUMN brand_intelligence.keyword_opportunities IS 'Keywords enriched with DataForSEO search volume and competition data';
COMMENT ON COLUMN brand_intelligence.content_gaps IS 'Suggested topics the brand could cover based on keyword opportunities';
COMMENT ON COLUMN brand_intelligence.voice_summary IS 'Summarized brand voice characteristics extracted from content';
