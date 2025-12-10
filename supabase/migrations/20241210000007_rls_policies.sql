-- =============================================
-- Migration 07: Row Level Security Policies
-- Complete RLS policies for all tables
-- =============================================

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_workflow_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawled_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_pattern_rules_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_pattern_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_usage_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TEAMS POLICIES
-- =============================================

CREATE POLICY "Users can view teams they belong to"
    ON teams FOR SELECT
    USING (is_team_member(id));

CREATE POLICY "Users can create teams"
    ON teams FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners and admins can update teams"
    ON teams FOR UPDATE
    USING (has_team_role(id, ARRAY['owner', 'admin']));

CREATE POLICY "Only owners can delete teams"
    ON teams FOR DELETE
    USING (owner_id = auth.uid());

-- =============================================
-- TEAM_MEMBERS POLICIES
-- =============================================

CREATE POLICY "Team members can view other members"
    ON team_members FOR SELECT
    USING (is_team_member(team_id));

CREATE POLICY "Owners and admins can add members"
    ON team_members FOR INSERT
    WITH CHECK (has_team_role(team_id, ARRAY['owner', 'admin']));

CREATE POLICY "Owners and admins can update members"
    ON team_members FOR UPDATE
    USING (has_team_role(team_id, ARRAY['owner', 'admin']));

CREATE POLICY "Owners and admins can remove members or self-remove"
    ON team_members FOR DELETE
    USING (has_team_role(team_id, ARRAY['owner', 'admin']) OR user_id = auth.uid());

-- =============================================
-- PROFILES POLICIES
-- =============================================

CREATE POLICY "Users can view profiles of teammates"
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

CREATE POLICY "Profiles created via trigger"
    ON profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- =============================================
-- BRANDS POLICIES
-- =============================================

CREATE POLICY "Team members can view brands"
    ON brands FOR SELECT
    USING (is_team_member(team_id));

CREATE POLICY "Editors and above can create brands"
    ON brands FOR INSERT
    WITH CHECK (has_team_role(team_id, ARRAY['owner', 'admin', 'editor']));

CREATE POLICY "Editors and above can update brands"
    ON brands FOR UPDATE
    USING (has_team_role(team_id, ARRAY['owner', 'admin', 'editor']));

CREATE POLICY "Admins and above can delete brands"
    ON brands FOR DELETE
    USING (has_team_role(team_id, ARRAY['owner', 'admin']));

-- =============================================
-- BRAND_PROFILES POLICIES
-- =============================================

CREATE POLICY "Team members can view brand profiles"
    ON brand_profiles FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM brands
        WHERE brands.id = brand_profiles.brand_id
        AND is_team_member(brands.team_id)
    ));

CREATE POLICY "Editors and above can create brand profiles"
    ON brand_profiles FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM brands
        WHERE brands.id = brand_profiles.brand_id
        AND has_team_role(brands.team_id, ARRAY['owner', 'admin', 'editor'])
    ));

CREATE POLICY "Editors and above can update brand profiles"
    ON brand_profiles FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM brands
        WHERE brands.id = brand_profiles.brand_id
        AND has_team_role(brands.team_id, ARRAY['owner', 'admin', 'editor'])
    ));

CREATE POLICY "Admins and above can delete brand profiles"
    ON brand_profiles FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM brands
        WHERE brands.id = brand_profiles.brand_id
        AND has_team_role(brands.team_id, ARRAY['owner', 'admin'])
    ));

-- =============================================
-- BRAND_COMPETITORS POLICIES
-- =============================================

CREATE POLICY "Team members can view competitors"
    ON brand_competitors FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM brands
        WHERE brands.id = brand_competitors.brand_id
        AND is_team_member(brands.team_id)
    ));

CREATE POLICY "Editors and above can manage competitors"
    ON brand_competitors FOR ALL
    USING (EXISTS (
        SELECT 1 FROM brands
        WHERE brands.id = brand_competitors.brand_id
        AND has_team_role(brands.team_id, ARRAY['owner', 'admin', 'editor'])
    ));

-- =============================================
-- ARTICLES POLICIES
-- =============================================

CREATE POLICY "Team members can view articles"
    ON articles FOR SELECT
    USING (is_team_member(team_id));

CREATE POLICY "Editors and above can create articles"
    ON articles FOR INSERT
    WITH CHECK (has_team_role(team_id, ARRAY['owner', 'admin', 'editor']));

CREATE POLICY "Editors and above can update articles"
    ON articles FOR UPDATE
    USING (has_team_role(team_id, ARRAY['owner', 'admin', 'editor']));

CREATE POLICY "Admins and above can delete articles"
    ON articles FOR DELETE
    USING (has_team_role(team_id, ARRAY['owner', 'admin']));

-- =============================================
-- ARTICLE_VERSIONS POLICIES
-- =============================================

CREATE POLICY "Team members can view article versions"
    ON article_versions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM articles
        WHERE articles.id = article_versions.article_id
        AND is_team_member(articles.team_id)
    ));

CREATE POLICY "Editors and above can create versions"
    ON article_versions FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM articles
        WHERE articles.id = article_versions.article_id
        AND has_team_role(articles.team_id, ARRAY['owner', 'admin', 'editor'])
    ));

-- =============================================
-- ARTICLE_WORKFLOW_LOG POLICIES
-- =============================================

CREATE POLICY "Team members can view workflow log"
    ON article_workflow_log FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM articles
        WHERE articles.id = article_workflow_log.article_id
        AND is_team_member(articles.team_id)
    ));

CREATE POLICY "Editors and above can create workflow entries"
    ON article_workflow_log FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM articles
        WHERE articles.id = article_workflow_log.article_id
        AND has_team_role(articles.team_id, ARRAY['owner', 'admin', 'editor'])
    ));

-- =============================================
-- ARTICLE_COMMENTS POLICIES
-- =============================================

CREATE POLICY "Team members can view comments"
    ON article_comments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM articles
        WHERE articles.id = article_comments.article_id
        AND is_team_member(articles.team_id)
    ));

CREATE POLICY "Team members can create comments"
    ON article_comments FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM articles
        WHERE articles.id = article_comments.article_id
        AND is_team_member(articles.team_id)
    ));

CREATE POLICY "Comment authors can update own comments"
    ON article_comments FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Comment authors or admins can delete comments"
    ON article_comments FOR DELETE
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM articles
            WHERE articles.id = article_comments.article_id
            AND has_team_role(articles.team_id, ARRAY['owner', 'admin'])
        )
    );

-- =============================================
-- CRAWL_JOBS POLICIES
-- =============================================

CREATE POLICY "Team members can view crawl jobs"
    ON crawl_jobs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM brands
        WHERE brands.id = crawl_jobs.brand_id
        AND is_team_member(brands.team_id)
    ));

CREATE POLICY "Editors and above can create crawl jobs"
    ON crawl_jobs FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM brands
        WHERE brands.id = crawl_jobs.brand_id
        AND has_team_role(brands.team_id, ARRAY['owner', 'admin', 'editor'])
    ));

CREATE POLICY "Editors and above can update crawl jobs"
    ON crawl_jobs FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM brands
        WHERE brands.id = crawl_jobs.brand_id
        AND has_team_role(brands.team_id, ARRAY['owner', 'admin', 'editor'])
    ));

-- =============================================
-- CRAWLED_PAGES POLICIES
-- =============================================

CREATE POLICY "Team members can view crawled pages"
    ON crawled_pages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM brands
        WHERE brands.id = crawled_pages.brand_id
        AND is_team_member(brands.team_id)
    ));

CREATE POLICY "System can insert crawled pages"
    ON crawled_pages FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM brands
        WHERE brands.id = crawled_pages.brand_id
        AND is_team_member(brands.team_id)
    ));

CREATE POLICY "Editors and above can update crawled pages"
    ON crawled_pages FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM brands
        WHERE brands.id = crawled_pages.brand_id
        AND has_team_role(brands.team_id, ARRAY['owner', 'admin', 'editor'])
    ));

CREATE POLICY "Admins and above can delete crawled pages"
    ON crawled_pages FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM brands
        WHERE brands.id = crawled_pages.brand_id
        AND has_team_role(brands.team_id, ARRAY['owner', 'admin'])
    ));

-- =============================================
-- AI_PATTERN_RULES_GLOBAL POLICIES
-- Global rules are read-only for authenticated users
-- =============================================

CREATE POLICY "Anyone can read global rules"
    ON ai_pattern_rules_global FOR SELECT
    USING (true);

-- =============================================
-- AI_PATTERN_RULES POLICIES
-- =============================================

CREATE POLICY "Team members can view custom rules"
    ON ai_pattern_rules FOR SELECT
    USING (is_team_member(team_id));

CREATE POLICY "Editors and above can create rules"
    ON ai_pattern_rules FOR INSERT
    WITH CHECK (has_team_role(team_id, ARRAY['owner', 'admin', 'editor']));

CREATE POLICY "Editors and above can update rules"
    ON ai_pattern_rules FOR UPDATE
    USING (has_team_role(team_id, ARRAY['owner', 'admin', 'editor']));

CREATE POLICY "Admins and above can delete rules"
    ON ai_pattern_rules FOR DELETE
    USING (has_team_role(team_id, ARRAY['owner', 'admin']));

-- =============================================
-- USER_API_KEYS POLICIES (Most restrictive)
-- =============================================

CREATE POLICY "Only admins can view API keys"
    ON user_api_keys FOR SELECT
    USING (has_team_role(team_id, ARRAY['owner', 'admin']));

CREATE POLICY "Only admins can create API keys"
    ON user_api_keys FOR INSERT
    WITH CHECK (has_team_role(team_id, ARRAY['owner', 'admin']));

CREATE POLICY "Only admins can update API keys"
    ON user_api_keys FOR UPDATE
    USING (has_team_role(team_id, ARRAY['owner', 'admin']));

CREATE POLICY "Only admins can delete API keys"
    ON user_api_keys FOR DELETE
    USING (has_team_role(team_id, ARRAY['owner', 'admin']));

-- =============================================
-- AI_USAGE_LOG POLICIES
-- =============================================

CREATE POLICY "Team members can view usage logs"
    ON ai_usage_log FOR SELECT
    USING (is_team_member(team_id));

CREATE POLICY "System can insert usage logs"
    ON ai_usage_log FOR INSERT
    WITH CHECK (is_team_member(team_id));

-- =============================================
-- CRAWL_USAGE_LOG POLICIES
-- =============================================

CREATE POLICY "Team members can view crawl usage"
    ON crawl_usage_log FOR SELECT
    USING (is_team_member(team_id));

CREATE POLICY "System can insert crawl usage"
    ON crawl_usage_log FOR INSERT
    WITH CHECK (is_team_member(team_id));

-- =============================================
-- KEYWORD_RESEARCH POLICIES
-- =============================================

CREATE POLICY "Team members can view keyword research"
    ON keyword_research FOR SELECT
    USING (is_team_member(team_id));

CREATE POLICY "Team members can create keyword research"
    ON keyword_research FOR INSERT
    WITH CHECK (is_team_member(team_id));

CREATE POLICY "Editors and above can update keyword research"
    ON keyword_research FOR UPDATE
    USING (has_team_role(team_id, ARRAY['owner', 'admin', 'editor']));

CREATE POLICY "Admins and above can delete keyword research"
    ON keyword_research FOR DELETE
    USING (has_team_role(team_id, ARRAY['owner', 'admin']));

-- =============================================
-- KEYWORD_CACHE POLICIES
-- Global cache readable by all authenticated users
-- =============================================

CREATE POLICY "Anyone can read keyword cache"
    ON keyword_cache FOR SELECT
    USING (true);

CREATE POLICY "System can manage keyword cache"
    ON keyword_cache FOR ALL
    USING (true);

-- =============================================
-- SEO_USAGE_LOG POLICIES
-- =============================================

CREATE POLICY "Team members can view SEO usage"
    ON seo_usage_log FOR SELECT
    USING (is_team_member(team_id));

CREATE POLICY "System can insert SEO usage"
    ON seo_usage_log FOR INSERT
    WITH CHECK (is_team_member(team_id));

-- =============================================
-- API_PROVIDERS POLICIES
-- Read-only reference table
-- =============================================

ALTER TABLE api_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read API providers"
    ON api_providers FOR SELECT
    USING (true);
