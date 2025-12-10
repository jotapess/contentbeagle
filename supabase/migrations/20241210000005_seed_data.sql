-- =============================================
-- Migration 05: Seed Data
-- API Providers and Global AI Pattern Rules
-- =============================================

-- API Providers
INSERT INTO api_providers (id, name, base_url, docs_url) VALUES
('openai', 'OpenAI', 'https://api.openai.com/v1', 'https://platform.openai.com/docs'),
('anthropic', 'Anthropic', 'https://api.anthropic.com/v1', 'https://docs.anthropic.com'),
('google', 'Google AI', 'https://generativelanguage.googleapis.com/v1', 'https://ai.google.dev/docs'),
('firecrawl', 'Firecrawl', 'https://api.firecrawl.dev/v1', 'https://docs.firecrawl.dev'),
('dataforseo', 'DataForSEO', 'https://api.dataforseo.com/v3', 'https://docs.dataforseo.com');

-- Global AI Pattern Rules (humanization rules)
INSERT INTO ai_pattern_rules_global (name, description, category, pattern_type, pattern, replacement_options, severity) VALUES
-- Word variety rules
('Delve', 'Overused AI word "delve"', 'word_variety', 'regex', '\bdelve(s|d)?\b', ARRAY['explore', 'examine', 'look at', 'investigate'], 'medium'),
('Robust', 'Overused AI adjective', 'word_variety', 'regex', '\brobust\b', ARRAY['strong', 'reliable', 'solid', 'powerful'], 'low'),
('Leverage', 'Corporate AI verb', 'word_variety', 'regex', '\bleverage(s|d)?\b', ARRAY['use', 'apply', 'employ', 'take advantage of'], 'low'),
('Streamline', 'AI verb cliche', 'word_variety', 'regex', '\bstreamline(s|d)?\b', ARRAY['simplify', 'improve', 'speed up', 'make easier'], 'low'),
('Tapestry', 'AI metaphor cliche', 'word_variety', 'exact', 'tapestry', ARRAY['mix', 'collection', 'variety'], 'medium'),
('Realm', 'AI word cliche', 'word_variety', 'regex', '\brealm\b', ARRAY['area', 'field', 'domain', 'space'], 'low'),
('Landscape', 'Overused AI metaphor', 'word_variety', 'regex', '\blandscape\b', ARRAY['environment', 'situation', 'field', 'market'], 'low'),

-- Transition words
('In Conclusion', 'Explicit conclusion marker', 'transition_words', 'regex', '\bin\s+conclusion\b', ARRAY['to wrap up', 'finally', 'all in all', ''], 'medium'),
('Crucially', 'Overused transition', 'transition_words', 'exact', 'crucially', ARRAY['importantly', 'notably', 'significantly'], 'low'),
('Moreover', 'Formal transition', 'transition_words', 'exact', 'moreover', ARRAY['also', 'additionally', 'plus', 'and'], 'low'),
('Furthermore', 'Formal transition', 'transition_words', 'exact', 'furthermore', ARRAY['also', 'and', 'plus', 'in addition'], 'low'),

-- Phrase replacements
('Important to Note', 'Filler phrase', 'phrase_replacement', 'exact', 'it''s important to note that', ARRAY['', 'notably', 'note that'], 'medium'),
('In Today''s X', 'Generic opener', 'phrase_replacement', 'regex', '\bin today''s \w+\b', ARRAY['currently', 'now', ''], 'low'),
('Let''s Dive In', 'AI opener cliche', 'phrase_replacement', 'exact', 'let''s dive in', ARRAY['here''s what you need to know', 'let''s get started', ''], 'medium'),
('At the End of the Day', 'Cliche phrase', 'phrase_replacement', 'exact', 'at the end of the day', ARRAY['ultimately', 'in the end', ''], 'low'),
('It Goes Without Saying', 'Filler phrase', 'phrase_replacement', 'exact', 'it goes without saying', ARRAY['obviously', 'clearly', ''], 'low'),

-- Sentence structure
('Repetitive Sentence Starts', 'Multiple sentences starting with "This"', 'sentence_structure', 'ai_detection', NULL, ARRAY[], 'medium');
