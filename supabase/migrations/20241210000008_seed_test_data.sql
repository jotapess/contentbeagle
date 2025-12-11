-- =============================================
-- Migration 08: Seed Test Data
-- Test data for development and testing environments
-- =============================================
--
-- IMPORTANT: This script requires test users to be created first in Supabase Auth.
-- See /docs/SEEDING.md for instructions on creating test users.
--
-- Test Users (must exist in auth.users before running this):
-- - john@test.contentbeagle.com (user-1)
-- - jane@test.contentbeagle.com (user-2)
-- - mike@test.contentbeagle.com (user-3)
--
-- The UUIDs below are placeholders that will be updated after creating auth users.
-- =============================================

-- Use a DO block to make the script idempotent and use variables
DO $$
DECLARE
    -- User IDs (will be set from auth.users)
    user_john UUID;
    user_jane UUID;
    user_mike UUID;

    -- Team IDs (fixed for reproducibility)
    team_acme UUID := '11111111-1111-1111-1111-111111111111';
    team_personal UUID := '22222222-2222-2222-2222-222222222222';

    -- Brand IDs
    brand_techflow UUID := '33333333-3333-3333-3333-333333333333';
    brand_greenleaf UUID := '44444444-4444-4444-4444-444444444444';
    brand_financefirst UUID := '55555555-5555-5555-5555-555555555555';

    -- Article IDs
    article_1 UUID := '66666666-6666-6666-6666-666666666666';
    article_2 UUID := '77777777-7777-7777-7777-777777777777';
    article_3 UUID := '88888888-8888-8888-8888-888888888888';

    -- Crawl Job ID
    crawl_job_1 UUID := '99999999-9999-9999-9999-999999999999';

BEGIN
    -- =============================================
    -- GET USER IDs FROM AUTH.USERS
    -- =============================================
    -- Try to find users by email pattern
    SELECT id INTO user_john FROM auth.users WHERE email LIKE 'john%' LIMIT 1;
    SELECT id INTO user_jane FROM auth.users WHERE email LIKE 'jane%' LIMIT 1;
    SELECT id INTO user_mike FROM auth.users WHERE email LIKE 'mike%' LIMIT 1;

    -- If users don't exist, use the first 3 users or fail gracefully
    IF user_john IS NULL THEN
        SELECT id INTO user_john FROM auth.users ORDER BY created_at LIMIT 1;
    END IF;

    IF user_john IS NULL THEN
        RAISE NOTICE 'No users found in auth.users. Please create test users first.';
        RAISE NOTICE 'See /docs/SEEDING.md for instructions.';
        RETURN;
    END IF;

    -- Use first user for all if others don't exist
    IF user_jane IS NULL THEN user_jane := user_john; END IF;
    IF user_mike IS NULL THEN user_mike := user_john; END IF;

    RAISE NOTICE 'Using user IDs: john=%, jane=%, mike=%', user_john, user_jane, user_mike;

    -- =============================================
    -- CLEAN UP EXISTING TEST DATA
    -- =============================================
    -- Delete in reverse order of dependencies
    DELETE FROM ai_usage_log WHERE team_id IN (team_acme, team_personal);
    DELETE FROM crawl_usage_log WHERE team_id IN (team_acme, team_personal);
    DELETE FROM article_comments WHERE article_id IN (article_1, article_2, article_3);
    DELETE FROM article_workflow_log WHERE article_id IN (article_1, article_2, article_3);
    DELETE FROM article_versions WHERE article_id IN (article_1, article_2, article_3);
    DELETE FROM articles WHERE id IN (article_1, article_2, article_3);
    DELETE FROM crawled_pages WHERE brand_id IN (brand_techflow, brand_greenleaf, brand_financefirst);
    DELETE FROM crawl_jobs WHERE brand_id IN (brand_techflow, brand_greenleaf, brand_financefirst);
    DELETE FROM brand_profiles WHERE brand_id IN (brand_techflow, brand_greenleaf, brand_financefirst);
    DELETE FROM brand_competitors WHERE brand_id IN (brand_techflow, brand_greenleaf, brand_financefirst);
    DELETE FROM brands WHERE id IN (brand_techflow, brand_greenleaf, brand_financefirst);
    DELETE FROM user_api_keys WHERE team_id IN (team_acme, team_personal);
    DELETE FROM ai_pattern_rules WHERE team_id IN (team_acme, team_personal);
    DELETE FROM team_members WHERE team_id IN (team_acme, team_personal);
    DELETE FROM teams WHERE id IN (team_acme, team_personal);

    -- Update profiles to remove default_team_id references
    UPDATE profiles SET default_team_id = NULL WHERE default_team_id IN (team_acme, team_personal);

    -- =============================================
    -- TEAMS
    -- =============================================
    INSERT INTO teams (id, name, slug, owner_id, plan, settings) VALUES
    (
        team_acme,
        'Acme Content Team',
        'acme-content-test',
        user_john,
        'pro',
        '{"notifications": true, "aiModel": "gpt-4o"}'::jsonb
    ),
    (
        team_personal,
        'Personal Workspace',
        'personal-test',
        user_john,
        'free',
        '{}'::jsonb
    );

    -- =============================================
    -- TEAM MEMBERS
    -- =============================================
    -- Handle case where all users might be the same (single user scenario)
    INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES
    (team_acme, user_john, 'owner', NOW() - INTERVAL '90 days');

    -- Only add additional members if they're different users
    IF user_jane IS DISTINCT FROM user_john THEN
        INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES
        (team_acme, user_jane, 'editor', NOW() - INTERVAL '60 days');
    END IF;

    IF user_mike IS DISTINCT FROM user_john AND user_mike IS DISTINCT FROM user_jane THEN
        INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES
        (team_acme, user_mike, 'viewer', NOW() - INTERVAL '30 days');
    END IF;

    INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES
    (team_personal, user_john, 'owner', NOW() - INTERVAL '90 days');

    -- =============================================
    -- UPDATE PROFILES WITH DEFAULT TEAM
    -- =============================================
    UPDATE profiles SET default_team_id = team_acme WHERE id = user_john;
    UPDATE profiles SET default_team_id = team_acme WHERE id = user_jane;
    UPDATE profiles SET default_team_id = team_acme WHERE id = user_mike;

    -- =============================================
    -- BRANDS
    -- =============================================
    INSERT INTO brands (id, team_id, name, website_url, logo_url, description, industry, target_audience, status, created_by) VALUES
    (
        brand_techflow,
        team_acme,
        'TechFlow SaaS',
        'https://techflow.example.com',
        'https://api.dicebear.com/7.x/shapes/svg?seed=techflow',
        'B2B SaaS platform for workflow automation',
        'Technology',
        'Small to medium business owners',
        'ready',
        user_john
    ),
    (
        brand_greenleaf,
        team_acme,
        'GreenLeaf Wellness',
        'https://greenleaf.example.com',
        'https://api.dicebear.com/7.x/shapes/svg?seed=greenleaf',
        'Natural health and wellness products',
        'Health & Wellness',
        'Health-conscious consumers aged 25-45',
        'ready',
        user_john
    ),
    (
        brand_financefirst,
        team_acme,
        'FinanceFirst',
        'https://financefirst.example.com',
        'https://api.dicebear.com/7.x/shapes/svg?seed=financefirst',
        'Personal finance advisory platform',
        'Finance',
        'Young professionals seeking financial guidance',
        'analyzing',
        user_jane
    );

    -- =============================================
    -- BRAND PROFILES
    -- =============================================
    INSERT INTO brand_profiles (
        brand_id, version, is_active,
        voice_adjectives, voice_description,
        tone_formality, tone_enthusiasm, tone_humor, tone_confidence, tone_empathy,
        sentence_structure, vocabulary_level, paragraph_length, preferred_pov,
        key_terminology, power_words, avoid_words, branded_phrases,
        core_themes, value_propositions, pain_points_addressed,
        do_list, dont_list, sample_sentences,
        confidence_score, source_pages_count
    ) VALUES
    (
        brand_techflow, 1, true,
        ARRAY['Professional', 'Innovative', 'Approachable', 'Confident'],
        'TechFlow speaks with the confidence of an industry expert while remaining accessible to business owners who may not be tech-savvy. We balance technical authority with practical, jargon-free explanations.',
        7, 6, 3, 8, 6,
        'mixed', 'moderate', 'medium', 'second_person',
        '[{"term": "workflow automation", "definition": "Automated business processes", "context": "Core product feature"}, {"term": "integration", "definition": "Connecting different software tools", "context": "Product capability"}]'::jsonb,
        ARRAY['streamline', 'efficient', 'powerful', 'seamless', 'transform'],
        ARRAY['cheap', 'simple', 'basic', 'just'],
        '[{"phrase": "Work smarter, not harder", "usageContext": "Tagline and CTAs"}, {"phrase": "Automate the mundane", "usageContext": "Feature descriptions"}]'::jsonb,
        ARRAY['Productivity', 'Automation', 'Business Growth', 'Time Savings'],
        ARRAY['Save 10+ hours per week', 'No coding required', '200+ integrations'],
        ARRAY['Manual data entry', 'Disconnected tools', 'Time wasted on repetitive tasks'],
        ARRAY['Use concrete examples and numbers', 'Address specific pain points', 'Include clear CTAs', 'Reference customer success stories'],
        ARRAY['Use excessive jargon', 'Make unsubstantiated claims', 'Be overly casual', 'Ignore the business impact'],
        '[{"original": "TechFlow connects your favorite tools so you can focus on what matters most—growing your business.", "context": "Homepage hero", "whyEffective": "Addresses pain point while highlighting benefit"}]'::jsonb,
        0.85, 12
    ),
    (
        brand_greenleaf, 1, true,
        ARRAY['Warm', 'Nurturing', 'Knowledgeable', 'Authentic'],
        'GreenLeaf communicates like a trusted friend who happens to be a wellness expert. We are warm and supportive while backing up our advice with science.',
        4, 8, 5, 7, 9,
        'mixed', 'simple', 'short', 'first_person',
        '[{"term": "plant-based", "definition": "Derived from natural plant sources"}, {"term": "holistic wellness", "definition": "Whole-body approach to health"}]'::jsonb,
        ARRAY['natural', 'nourish', 'vibrant', 'pure', 'balance'],
        ARRAY['chemical', 'artificial', 'processed', 'quick fix'],
        '[{"phrase": "Nature knows best", "usageContext": "Product philosophy"}]'::jsonb,
        ARRAY['Natural Health', 'Sustainable Living', 'Self-Care', 'Mindfulness'],
        ARRAY['100% natural ingredients', 'Sustainably sourced', 'Science-backed formulas'],
        ARRAY['Overwhelming health advice', 'Synthetic products', 'Lack of transparency'],
        ARRAY['Share personal wellness journeys', 'Cite scientific research when possible', 'Use sensory language', 'Encourage small, sustainable changes'],
        ARRAY['Make medical claims', 'Shame unhealthy habits', 'Use fear-based messaging', 'Oversimplify complex health topics'],
        '[]'::jsonb,
        0.82, 8
    );

    -- =============================================
    -- ARTICLES
    -- =============================================
    INSERT INTO articles (
        id, team_id, brand_id, title, slug, excerpt, content, status,
        input_type, original_input, target_audience, target_length, call_to_action,
        seo_title, seo_description, focus_keyword, secondary_keywords, seo_score,
        suggested_links, applied_links, humanization_applied, ai_patterns_found,
        word_count, reading_time_minutes, published_url, published_at,
        created_by, assigned_to
    ) VALUES
    (
        article_1,
        team_acme,
        brand_techflow,
        '10 Ways to Automate Your Business Workflows in 2024',
        '10-ways-automate-business-workflows-2024',
        'Discover the top automation strategies that are helping businesses save time and increase productivity.',
        E'# 10 Ways to Automate Your Business Workflows in 2024\n\nRunning a business means juggling countless tasks every day. But what if you could hand off the repetitive stuff to technology? Here are ten proven ways to automate your workflows and reclaim your time.\n\n## 1. Email Marketing Automation\n\nStop manually sending every email. Set up triggered campaigns that respond to customer actions automatically.\n\n## 2. CRM Data Sync\n\nKeep your customer data consistent across all platforms without manual updates.\n\n## 3. Invoice Generation\n\nAutomate invoice creation and sending based on completed projects or subscriptions.\n\n## 4. Social Media Scheduling\n\nPlan and schedule your social posts weeks in advance.\n\n## 5. Lead Scoring\n\nLet AI evaluate and prioritize your leads based on engagement signals.\n\n## 6. Report Generation\n\nGenerate weekly or monthly reports automatically from your data sources.\n\n## 7. Customer Onboarding\n\nCreate automated welcome sequences for new customers.\n\n## 8. Inventory Management\n\nSet up automatic reorder points and stock alerts.\n\n## 9. Task Assignment\n\nRoute tasks to team members based on workload and expertise.\n\n## 10. Follow-up Reminders\n\nNever miss a follow-up with automated reminder systems.\n\n## Ready to Get Started?\n\nTechFlow makes workflow automation accessible to everyone. Start your free trial today and see how much time you can save.',
        'published',
        'bullets',
        E'- Email automation\n- CRM sync\n- Invoice generation',
        'Small business owners',
        'medium',
        'Start your free trial',
        '10 Business Workflow Automation Strategies for 2024 | TechFlow',
        'Learn the top 10 ways to automate your business workflows in 2024. Save time, reduce errors, and boost productivity with these proven strategies.',
        'business workflow automation',
        ARRAY['automation tools', 'workflow efficiency', 'business productivity'],
        85,
        '[]'::jsonb,
        '[{"url": "/features/integrations", "anchorText": "integration capabilities", "context": "", "relevanceScore": 0.9}]'::jsonb,
        true,
        '[]'::jsonb,
        2150,
        9,
        'https://techflow.example.com/blog/10-ways-automate-workflows',
        NOW() - INTERVAL '30 days',
        user_john,
        NULL
    ),
    (
        article_2,
        team_acme,
        brand_techflow,
        'The Complete Guide to No-Code Automation',
        'complete-guide-no-code-automation',
        'Everything you need to know about building powerful automations without writing a single line of code.',
        E'# The Complete Guide to No-Code Automation\n\nYou don''t need to be a developer to automate your business processes. No-code tools have democratized automation, putting powerful capabilities in the hands of anyone who can think logically about their workflows.\n\n## What is No-Code Automation?\n\nNo-code automation refers to building automated workflows using visual interfaces rather than programming languages. You drag and drop components, set up triggers, and connect apps without writing code.\n\n## Why No-Code Matters\n\n1. **Speed**: Build automations in hours, not weeks\n2. **Cost**: No need to hire developers for basic workflows\n3. **Flexibility**: Business users can iterate quickly\n4. **Maintenance**: Updates are simple and intuitive\n\n## Getting Started\n\nThe key to successful no-code automation is starting small. Pick one repetitive task that frustrates you and automate it first.',
        'seo_review',
        'topic_only',
        NULL,
        'Non-technical business users',
        'long',
        'Try TechFlow free for 14 days',
        NULL,
        NULL,
        'no-code automation',
        ARRAY[]::TEXT[],
        NULL,
        '[{"url": "/pricing", "anchorText": "pricing plans", "context": "Compare our plans", "relevanceScore": 0.85}, {"url": "/templates", "anchorText": "automation templates", "context": "Browse templates", "relevanceScore": 0.92}]'::jsonb,
        '[]'::jsonb,
        false,
        '[{"patternId": "delve", "patternName": "Overused Delve", "count": 3, "examples": ["delve into", "delving deeper"]}, {"patternId": "robust", "patternName": "Overused Robust", "count": 2, "examples": ["robust solution"]}]'::jsonb,
        3200,
        14,
        NULL,
        NULL,
        user_john,
        user_jane
    ),
    (
        article_3,
        team_acme,
        brand_greenleaf,
        '5 Morning Rituals for a Healthier You',
        '5-morning-rituals-healthier-you',
        'Start your day right with these simple wellness practices.',
        E'# 5 Morning Rituals for a Healthier You\n\nHow you start your morning sets the tone for your entire day. We''ve gathered five simple rituals that can transform your mornings from chaotic to calm.\n\n## 1. Hydrate First Thing\n\nBefore reaching for coffee, drink a full glass of water. Your body has been fasting for 7-8 hours and needs hydration.\n\n## 2. Move Your Body\n\nEven 10 minutes of stretching or a short walk can energize you for hours.\n\n## 3. Practice Mindfulness\n\nTake 5 minutes to breathe deeply and set your intentions for the day.\n\n## 4. Nourish with Whole Foods\n\nChoose a breakfast rich in protein and fiber to sustain your energy.\n\n## 5. Express Gratitude\n\nWrite down three things you''re grateful for. It shifts your mindset toward positivity.',
        'draft',
        'bullets',
        E'- Hydration\n- Movement\n- Mindfulness\n- Nutrition\n- Gratitude',
        'Health-conscious adults',
        'short',
        'Shop our morning wellness collection',
        NULL,
        NULL,
        'morning wellness rituals',
        ARRAY[]::TEXT[],
        NULL,
        '[]'::jsonb,
        '[]'::jsonb,
        false,
        '[]'::jsonb,
        850,
        4,
        NULL,
        NULL,
        user_jane,
        user_jane
    );

    -- =============================================
    -- ARTICLE VERSIONS
    -- =============================================
    INSERT INTO article_versions (article_id, version_number, title, content, status, change_summary, changed_by) VALUES
    (article_1, 1, '10 Ways to Automate Your Business Workflows in 2024', 'Initial draft content...', 'draft', 'Initial creation', user_john),
    (article_1, 2, '10 Ways to Automate Your Business Workflows in 2024', 'Edited content with SEO improvements...', 'seo_review', 'SEO optimization pass', user_john),
    (article_2, 1, 'The Complete Guide to No-Code Automation', 'Initial draft...', 'draft', 'Initial creation', user_john);

    -- =============================================
    -- ARTICLE WORKFLOW LOG
    -- =============================================
    INSERT INTO article_workflow_log (article_id, from_status, to_status, transitioned_by, notes) VALUES
    (article_1, NULL, 'draft', user_john, 'Article created'),
    (article_1, 'draft', 'editing', user_john, 'Started editing'),
    (article_1, 'editing', 'seo_review', user_john, 'Ready for SEO review'),
    (article_1, 'seo_review', 'published', user_john, 'Published to website'),
    (article_2, NULL, 'draft', user_john, 'Article created'),
    (article_2, 'draft', 'seo_review', user_john, 'Moved to SEO review'),
    (article_3, NULL, 'draft', user_jane, 'Article created');

    -- =============================================
    -- CRAWL JOBS
    -- =============================================
    INSERT INTO crawl_jobs (id, brand_id, started_by, status, seed_urls, max_pages, pages_crawled, started_at, completed_at) VALUES
    (
        crawl_job_1,
        brand_techflow,
        user_john,
        'completed',
        ARRAY['https://techflow.example.com'],
        50,
        3,
        NOW() - INTERVAL '60 days',
        NOW() - INTERVAL '60 days' + INTERVAL '5 minutes'
    );

    -- =============================================
    -- CRAWLED PAGES
    -- =============================================
    INSERT INTO crawled_pages (
        brand_id, crawl_job_id, url, canonical_url, title, meta_description,
        markdown_content, plain_text, content_hash, summary, key_topics, target_keywords,
        content_type, word_count, reading_time_minutes, is_active
    ) VALUES
    (
        brand_techflow,
        crawl_job_1,
        'https://techflow.example.com/',
        'https://techflow.example.com/',
        'TechFlow - Workflow Automation Made Simple',
        'Automate your business workflows with TechFlow. No coding required.',
        E'# TechFlow\n\nWorkflow automation made simple. Connect your apps, automate your workflows, and grow your business.',
        'TechFlow Workflow automation made simple. Connect your apps, automate your workflows, and grow your business.',
        'abc123hash',
        'Homepage for TechFlow, a B2B SaaS workflow automation platform targeting small businesses.',
        ARRAY['workflow automation', 'business productivity', 'no-code'],
        ARRAY['workflow automation', 'business automation'],
        'homepage',
        450,
        2,
        true
    ),
    (
        brand_techflow,
        crawl_job_1,
        'https://techflow.example.com/features',
        'https://techflow.example.com/features',
        'Features - TechFlow',
        'Explore TechFlow features including 200+ integrations, visual workflow builder, and more.',
        E'# Features\n\n## Visual Workflow Builder\n\nBuild automations with drag-and-drop simplicity.\n\n## 200+ Integrations\n\nConnect all your favorite tools.',
        'Features Visual Workflow Builder Build automations with drag-and-drop simplicity. 200+ Integrations Connect all your favorite tools.',
        'def456hash',
        'Features page describing TechFlow capabilities including integrations, workflow builder, and automation templates.',
        ARRAY['integrations', 'workflow builder', 'templates'],
        ARRAY['automation features', 'workflow builder'],
        'product',
        820,
        4,
        true
    ),
    (
        brand_techflow,
        crawl_job_1,
        'https://techflow.example.com/pricing',
        'https://techflow.example.com/pricing',
        'Pricing - TechFlow',
        'Simple, transparent pricing. Start free and scale as you grow.',
        E'# Pricing\n\n## Free Plan\n\nPerfect for getting started.\n\n## Pro Plan - $29/mo\n\nFor growing teams.\n\n## Enterprise\n\nCustom solutions for large organizations.',
        'Pricing Free Plan Perfect for getting started. Pro Plan $29/mo For growing teams. Enterprise Custom solutions for large organizations.',
        'ghi789hash',
        'Pricing page showing three tiers: Free, Pro ($29/mo), and Enterprise (custom).',
        ARRAY['pricing', 'plans', 'free trial'],
        ARRAY['automation pricing', 'workflow tool cost'],
        'product',
        350,
        2,
        true
    );

    -- =============================================
    -- TEAM-SPECIFIC AI PATTERN RULES
    -- =============================================
    INSERT INTO ai_pattern_rules (
        team_id, name, description, category, pattern_type, pattern, replacement_options, severity, is_active, created_by
    ) VALUES
    (
        team_acme,
        'Avoid "Simple" for TechFlow',
        'Brand guideline: avoid calling things simple or easy',
        'word_variety',
        'regex',
        '\b(simple|easy|basic)\b',
        ARRAY['straightforward', 'intuitive', 'streamlined'],
        'low',
        true,
        user_john
    );

    -- =============================================
    -- AI USAGE LOG
    -- =============================================
    INSERT INTO ai_usage_log (team_id, user_id, provider, model, input_tokens, output_tokens, total_tokens, feature, article_id, brand_id, estimated_cost) VALUES
    (team_acme, user_john, 'openai', 'gpt-4o', 2500, 3200, 5700, 'content_generation', article_1, brand_techflow, 0.0285),
    (team_acme, user_john, 'openai', 'gpt-4o', 3800, 4100, 7900, 'content_generation', article_2, brand_techflow, 0.0395),
    (team_acme, user_jane, 'anthropic', 'claude-sonnet-4-20250514', 1200, 1800, 3000, 'humanization', article_1, brand_techflow, 0.009);

    -- =============================================
    -- KEYWORD RESEARCH DATA
    -- =============================================
    INSERT INTO keyword_research (
        team_id, article_id, keyword, search_volume, cpc, competition, competition_level
    ) VALUES
    (team_acme, article_1, 'workflow automation', 12100, 15.50, 0.65, 'medium'),
    (team_acme, article_1, 'business automation tools', 8100, 18.20, 0.72, 'high'),
    (team_acme, article_2, 'no-code automation', 4400, 12.80, 0.45, 'medium'),
    (team_acme, article_2, 'automate business processes', 2900, 14.30, 0.58, 'medium'),
    (team_acme, NULL, 'workflow management software', 6600, 22.50, 0.78, 'high');

    RAISE NOTICE 'Seed data inserted successfully!';
    RAISE NOTICE 'Teams created: Acme Content Team (%), Personal Workspace (%)', team_acme, team_personal;
    RAISE NOTICE 'Brands created: TechFlow (%), GreenLeaf (%), FinanceFirst (%)', brand_techflow, brand_greenleaf, brand_financefirst;
    RAISE NOTICE 'Articles created: 3 articles across 2 brands';

END $$;

-- =============================================
-- VERIFY SEED DATA
-- =============================================
-- Run these queries to verify the data was inserted correctly:
--
-- SELECT * FROM teams WHERE slug LIKE '%test%';
-- SELECT * FROM brands WHERE team_id IN (SELECT id FROM teams WHERE slug LIKE '%test%');
-- SELECT * FROM articles WHERE team_id IN (SELECT id FROM teams WHERE slug LIKE '%test%');
-- SELECT * FROM crawled_pages WHERE brand_id IN (SELECT id FROM brands WHERE team_id IN (SELECT id FROM teams WHERE slug LIKE '%test%'));
