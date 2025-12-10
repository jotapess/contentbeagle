import type {
  User,
  Team,
  TeamMember,
  Brand,
  BrandProfile,
  Article,
  CrawledPage,
  AIPatternRule,
  UserAPIKey,
  AIUsageLog,
  KeywordData,
} from '@/types';

// ============================================
// Users
// ============================================

export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'john@example.com',
    fullName: 'John Doe',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    defaultTeamId: 'team-1',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'user-2',
    email: 'jane@example.com',
    fullName: 'Jane Smith',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
    defaultTeamId: 'team-1',
    createdAt: '2024-02-01T14:30:00Z',
  },
  {
    id: 'user-3',
    email: 'mike@example.com',
    fullName: 'Mike Johnson',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    defaultTeamId: 'team-1',
    createdAt: '2024-02-15T09:00:00Z',
  },
];

export const currentUser = mockUsers[0];

// ============================================
// Teams
// ============================================

export const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Acme Content Team',
    slug: 'acme-content',
    ownerId: 'user-1',
    plan: 'pro',
    settings: {},
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'team-2',
    name: 'Personal Workspace',
    slug: 'personal',
    ownerId: 'user-1',
    plan: 'free',
    settings: {},
    createdAt: '2024-01-15T10:00:00Z',
  },
];

export const currentTeam = mockTeams[0];

// ============================================
// Team Members
// ============================================

export const mockTeamMembers: TeamMember[] = [
  {
    id: 'member-1',
    teamId: 'team-1',
    userId: 'user-1',
    role: 'owner',
    joinedAt: '2024-01-15T10:00:00Z',
    user: mockUsers[0],
  },
  {
    id: 'member-2',
    teamId: 'team-1',
    userId: 'user-2',
    role: 'editor',
    joinedAt: '2024-02-01T14:30:00Z',
    user: mockUsers[1],
  },
  {
    id: 'member-3',
    teamId: 'team-1',
    userId: 'user-3',
    role: 'viewer',
    joinedAt: '2024-02-15T09:00:00Z',
    user: mockUsers[2],
  },
];

// ============================================
// Brands
// ============================================

export const mockBrands: Brand[] = [
  {
    id: 'brand-1',
    teamId: 'team-1',
    name: 'TechFlow SaaS',
    websiteUrl: 'https://techflow.example.com',
    logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=techflow',
    description: 'B2B SaaS platform for workflow automation',
    industry: 'Technology',
    targetAudience: 'Small to medium business owners',
    status: 'ready',
    createdBy: 'user-1',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-25T14:00:00Z',
  },
  {
    id: 'brand-2',
    teamId: 'team-1',
    name: 'GreenLeaf Wellness',
    websiteUrl: 'https://greenleaf.example.com',
    logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=greenleaf',
    description: 'Natural health and wellness products',
    industry: 'Health & Wellness',
    targetAudience: 'Health-conscious consumers aged 25-45',
    status: 'ready',
    createdBy: 'user-1',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-05T11:00:00Z',
  },
  {
    id: 'brand-3',
    teamId: 'team-1',
    name: 'FinanceFirst',
    websiteUrl: 'https://financefirst.example.com',
    logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=financefirst',
    description: 'Personal finance advisory platform',
    industry: 'Finance',
    targetAudience: 'Young professionals seeking financial guidance',
    status: 'analyzing',
    createdBy: 'user-2',
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
  },
];

// ============================================
// Brand Profiles
// ============================================

export const mockBrandProfiles: BrandProfile[] = [
  {
    id: 'profile-1',
    brandId: 'brand-1',
    version: 1,
    isActive: true,
    voiceAdjectives: ['Professional', 'Innovative', 'Approachable', 'Confident'],
    voiceDescription: 'TechFlow speaks with the confidence of an industry expert while remaining accessible to business owners who may not be tech-savvy. We balance technical authority with practical, jargon-free explanations.',
    toneFormality: 7,
    toneEnthusiasm: 6,
    toneHumor: 3,
    toneConfidence: 8,
    toneEmpathy: 6,
    sentenceStructure: 'mixed',
    vocabularyLevel: 'moderate',
    paragraphLength: 'medium',
    preferredPov: 'second_person',
    keyTerminology: [
      { term: 'workflow automation', definition: 'Automated business processes', context: 'Core product feature' },
      { term: 'integration', definition: 'Connecting different software tools', context: 'Product capability' },
    ],
    powerWords: ['streamline', 'efficient', 'powerful', 'seamless', 'transform'],
    avoidWords: ['cheap', 'simple', 'basic', 'just'],
    brandedPhrases: [
      { phrase: 'Work smarter, not harder', usageContext: 'Tagline and CTAs' },
      { phrase: 'Automate the mundane', usageContext: 'Feature descriptions' },
    ],
    coreThemes: ['Productivity', 'Automation', 'Business Growth', 'Time Savings'],
    valuePropositions: ['Save 10+ hours per week', 'No coding required', '200+ integrations'],
    painPointsAddressed: ['Manual data entry', 'Disconnected tools', 'Time wasted on repetitive tasks'],
    doList: [
      'Use concrete examples and numbers',
      'Address specific pain points',
      'Include clear CTAs',
      'Reference customer success stories',
    ],
    dontList: [
      'Use excessive jargon',
      'Make unsubstantiated claims',
      'Be overly casual',
      'Ignore the business impact',
    ],
    sampleSentences: [
      {
        original: 'TechFlow connects your favorite tools so you can focus on what matters most—growing your business.',
        context: 'Homepage hero',
        whyEffective: 'Addresses pain point while highlighting benefit',
      },
    ],
    confidenceScore: 0.85,
    sourcePagesCount: 12,
    createdAt: '2024-01-25T14:00:00Z',
  },
  {
    id: 'profile-2',
    brandId: 'brand-2',
    version: 1,
    isActive: true,
    voiceAdjectives: ['Warm', 'Nurturing', 'Knowledgeable', 'Authentic'],
    voiceDescription: 'GreenLeaf communicates like a trusted friend who happens to be a wellness expert. We are warm and supportive while backing up our advice with science.',
    toneFormality: 4,
    toneEnthusiasm: 8,
    toneHumor: 5,
    toneConfidence: 7,
    toneEmpathy: 9,
    sentenceStructure: 'mixed',
    vocabularyLevel: 'simple',
    paragraphLength: 'short',
    preferredPov: 'first_person',
    keyTerminology: [
      { term: 'plant-based', definition: 'Derived from natural plant sources' },
      { term: 'holistic wellness', definition: 'Whole-body approach to health' },
    ],
    powerWords: ['natural', 'nourish', 'vibrant', 'pure', 'balance'],
    avoidWords: ['chemical', 'artificial', 'processed', 'quick fix'],
    brandedPhrases: [
      { phrase: 'Nature knows best', usageContext: 'Product philosophy' },
    ],
    coreThemes: ['Natural Health', 'Sustainable Living', 'Self-Care', 'Mindfulness'],
    valuePropositions: ['100% natural ingredients', 'Sustainably sourced', 'Science-backed formulas'],
    painPointsAddressed: ['Overwhelming health advice', 'Synthetic products', 'Lack of transparency'],
    doList: [
      'Share personal wellness journeys',
      'Cite scientific research when possible',
      'Use sensory language',
      'Encourage small, sustainable changes',
    ],
    dontList: [
      'Make medical claims',
      'Shame unhealthy habits',
      'Use fear-based messaging',
      'Oversimplify complex health topics',
    ],
    sampleSentences: [],
    confidenceScore: 0.82,
    sourcePagesCount: 8,
    createdAt: '2024-02-05T11:00:00Z',
  },
];

// ============================================
// Articles
// ============================================

export const mockArticles: Article[] = [
  {
    id: 'article-1',
    teamId: 'team-1',
    brandId: 'brand-1',
    title: '10 Ways to Automate Your Business Workflows in 2024',
    slug: '10-ways-automate-business-workflows-2024',
    excerpt: 'Discover the top automation strategies that are helping businesses save time and increase productivity.',
    content: `# 10 Ways to Automate Your Business Workflows in 2024

Running a business means juggling countless tasks every day. But what if you could hand off the repetitive stuff to technology? Here are ten proven ways to automate your workflows and reclaim your time.

## 1. Email Marketing Automation

Stop manually sending every email...`,
    contentHtml: null,
    status: 'published',
    inputType: 'bullets',
    originalInput: '- Email automation\n- CRM sync\n- Invoice generation',
    targetAudience: 'Small business owners',
    targetLength: 'medium',
    callToAction: 'Start your free trial',
    seoTitle: '10 Business Workflow Automation Strategies for 2024 | TechFlow',
    seoDescription: 'Learn the top 10 ways to automate your business workflows in 2024. Save time, reduce errors, and boost productivity with these proven strategies.',
    focusKeyword: 'business workflow automation',
    secondaryKeywords: ['automation tools', 'workflow efficiency', 'business productivity'],
    seoScore: 85,
    suggestedLinks: [],
    appliedLinks: [
      { url: '/features/integrations', anchorText: 'integration capabilities', context: '', relevanceScore: 0.9 },
    ],
    humanizationApplied: true,
    aiPatternsFound: [],
    wordCount: 2150,
    readingTimeMinutes: 9,
    featuredImageUrl: null,
    publishedUrl: 'https://techflow.example.com/blog/10-ways-automate-workflows',
    publishedAt: '2024-02-15T10:00:00Z',
    createdBy: 'user-1',
    assignedTo: null,
    createdAt: '2024-02-10T10:00:00Z',
    updatedAt: '2024-02-15T10:00:00Z',
    brand: mockBrands[0],
  },
  {
    id: 'article-2',
    teamId: 'team-1',
    brandId: 'brand-1',
    title: 'The Complete Guide to No-Code Automation',
    slug: 'complete-guide-no-code-automation',
    excerpt: 'Everything you need to know about building powerful automations without writing a single line of code.',
    content: `# The Complete Guide to No-Code Automation

You don't need to be a developer to automate your business processes...`,
    contentHtml: null,
    status: 'seo_review',
    inputType: 'topic_only',
    originalInput: null,
    targetAudience: 'Non-technical business users',
    targetLength: 'long',
    callToAction: 'Try TechFlow free for 14 days',
    seoTitle: null,
    seoDescription: null,
    focusKeyword: 'no-code automation',
    secondaryKeywords: [],
    seoScore: null,
    suggestedLinks: [
      { url: '/pricing', anchorText: 'pricing plans', context: 'Compare our plans', relevanceScore: 0.85 },
      { url: '/templates', anchorText: 'automation templates', context: 'Browse templates', relevanceScore: 0.92 },
    ],
    appliedLinks: [],
    humanizationApplied: false,
    aiPatternsFound: [
      { patternId: 'delve', patternName: 'Overused "Delve"', count: 3, examples: ['delve into', 'delving deeper'], locations: [] },
      { patternId: 'robust', patternName: 'Overused "Robust"', count: 2, examples: ['robust solution'], locations: [] },
    ],
    wordCount: 3200,
    readingTimeMinutes: 14,
    featuredImageUrl: null,
    publishedUrl: null,
    publishedAt: null,
    createdBy: 'user-1',
    assignedTo: 'user-2',
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-05T14:00:00Z',
    brand: mockBrands[0],
  },
  {
    id: 'article-3',
    teamId: 'team-1',
    brandId: 'brand-2',
    title: '5 Morning Rituals for a Healthier You',
    slug: '5-morning-rituals-healthier-you',
    excerpt: 'Start your day right with these simple wellness practices.',
    content: `# 5 Morning Rituals for a Healthier You

How you start your morning sets the tone for your entire day...`,
    contentHtml: null,
    status: 'draft',
    inputType: 'bullets',
    originalInput: '- Hydration\n- Movement\n- Mindfulness\n- Nutrition\n- Gratitude',
    targetAudience: 'Health-conscious adults',
    targetLength: 'short',
    callToAction: 'Shop our morning wellness collection',
    seoTitle: null,
    seoDescription: null,
    focusKeyword: 'morning wellness rituals',
    secondaryKeywords: [],
    seoScore: null,
    suggestedLinks: [],
    appliedLinks: [],
    humanizationApplied: false,
    aiPatternsFound: [],
    wordCount: 850,
    readingTimeMinutes: 4,
    featuredImageUrl: null,
    publishedUrl: null,
    publishedAt: null,
    createdBy: 'user-2',
    assignedTo: 'user-2',
    createdAt: '2024-03-10T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
    brand: mockBrands[1],
  },
];

// ============================================
// Crawled Pages
// ============================================

export const mockCrawledPages: CrawledPage[] = [
  {
    id: 'page-1',
    brandId: 'brand-1',
    crawlJobId: 'job-1',
    url: 'https://techflow.example.com/',
    canonicalUrl: 'https://techflow.example.com/',
    title: 'TechFlow - Workflow Automation Made Simple',
    metaDescription: 'Automate your business workflows with TechFlow. No coding required.',
    markdownContent: '# TechFlow\n\nWorkflow automation made simple...',
    plainText: 'TechFlow Workflow automation made simple...',
    contentHash: 'abc123',
    summary: 'Homepage for TechFlow, a B2B SaaS workflow automation platform targeting small businesses.',
    keyTopics: ['workflow automation', 'business productivity', 'no-code'],
    targetKeywords: ['workflow automation', 'business automation'],
    contentType: 'homepage',
    wordCount: 450,
    readingTimeMinutes: 2,
    isActive: true,
    crawledAt: '2024-01-25T12:00:00Z',
  },
  {
    id: 'page-2',
    brandId: 'brand-1',
    crawlJobId: 'job-1',
    url: 'https://techflow.example.com/features',
    canonicalUrl: 'https://techflow.example.com/features',
    title: 'Features - TechFlow',
    metaDescription: 'Explore TechFlow features including 200+ integrations, visual workflow builder, and more.',
    markdownContent: '# Features\n\n## Visual Workflow Builder...',
    plainText: 'Features Visual Workflow Builder...',
    contentHash: 'def456',
    summary: 'Features page describing TechFlow capabilities including integrations, workflow builder, and automation templates.',
    keyTopics: ['integrations', 'workflow builder', 'templates'],
    targetKeywords: ['automation features', 'workflow builder'],
    contentType: 'product',
    wordCount: 820,
    readingTimeMinutes: 4,
    isActive: true,
    crawledAt: '2024-01-25T12:05:00Z',
  },
  {
    id: 'page-3',
    brandId: 'brand-1',
    crawlJobId: 'job-1',
    url: 'https://techflow.example.com/pricing',
    canonicalUrl: 'https://techflow.example.com/pricing',
    title: 'Pricing - TechFlow',
    metaDescription: 'Simple, transparent pricing. Start free and scale as you grow.',
    markdownContent: '# Pricing\n\n## Free Plan...',
    plainText: 'Pricing Free Plan...',
    contentHash: 'ghi789',
    summary: 'Pricing page showing three tiers: Free, Pro ($29/mo), and Enterprise (custom).',
    keyTopics: ['pricing', 'plans', 'free trial'],
    targetKeywords: ['automation pricing', 'workflow tool cost'],
    contentType: 'product',
    wordCount: 350,
    readingTimeMinutes: 2,
    isActive: true,
    crawledAt: '2024-01-25T12:10:00Z',
  },
];

// ============================================
// AI Pattern Rules
// ============================================

export const mockAIPatternRules: AIPatternRule[] = [
  {
    id: 'rule-1',
    name: 'Overused "Delve"',
    description: 'AI-typical word that should be replaced with more natural alternatives',
    category: 'word_variety',
    patternType: 'regex',
    pattern: '\\bdelve(s|d)?\\b',
    replacement: null,
    replacementOptions: ['explore', 'examine', 'look at', 'investigate'],
    severity: 'medium',
    isActive: true,
    isGlobal: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'rule-2',
    name: 'In Conclusion',
    description: 'Obvious conclusion marker that sounds artificial',
    category: 'transition_words',
    patternType: 'regex',
    pattern: '\\bin\\s+conclusion\\b',
    replacement: null,
    replacementOptions: ['to wrap up', 'finally', 'all in all', ''],
    severity: 'medium',
    isActive: true,
    isGlobal: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'rule-3',
    name: 'Important to Note',
    description: 'Filler phrase that adds no value',
    category: 'phrase_replacement',
    patternType: 'exact',
    pattern: "it's important to note that",
    replacement: '',
    replacementOptions: ['', 'notably'],
    severity: 'medium',
    isActive: true,
    isGlobal: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'rule-4',
    name: 'Leverage (verb)',
    description: 'Corporate buzzword often overused by AI',
    category: 'word_variety',
    patternType: 'regex',
    pattern: '\\bleverage(s|d)?\\b',
    replacement: null,
    replacementOptions: ['use', 'apply', 'employ', 'take advantage of'],
    severity: 'low',
    isActive: true,
    isGlobal: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'rule-5',
    name: 'Robust',
    description: 'AI-typical adjective',
    category: 'word_variety',
    patternType: 'regex',
    pattern: '\\brobust\\b',
    replacement: null,
    replacementOptions: ['strong', 'reliable', 'solid', 'powerful'],
    severity: 'low',
    isActive: true,
    isGlobal: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'rule-6',
    teamId: 'team-1',
    name: 'Avoid "Simple" for TechFlow',
    description: 'Brand guideline: avoid calling things simple or easy',
    category: 'word_variety',
    patternType: 'regex',
    pattern: '\\b(simple|easy|basic)\\b',
    replacement: null,
    replacementOptions: ['straightforward', 'intuitive', 'streamlined'],
    severity: 'low',
    isActive: true,
    isGlobal: false,
    createdBy: 'user-1',
    createdAt: '2024-02-01T00:00:00Z',
  },
];

// ============================================
// API Keys
// ============================================

export const mockAPIKeys: UserAPIKey[] = [
  {
    id: 'key-1',
    teamId: 'team-1',
    providerId: 'openai',
    config: { defaultModel: 'gpt-4o' },
    isActive: true,
    lastUsedAt: '2024-03-10T14:30:00Z',
    lastError: null,
    createdAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'key-2',
    teamId: 'team-1',
    providerId: 'anthropic',
    config: { defaultModel: 'claude-3-5-sonnet-20241022' },
    isActive: true,
    lastUsedAt: '2024-03-08T09:15:00Z',
    lastError: null,
    createdAt: '2024-02-01T10:00:00Z',
  },
  {
    id: 'key-3',
    teamId: 'team-1',
    providerId: 'firecrawl',
    config: {},
    isActive: true,
    lastUsedAt: '2024-03-05T16:00:00Z',
    lastError: null,
    createdAt: '2024-01-25T10:00:00Z',
  },
];

// ============================================
// Usage Data
// ============================================

export const mockUsageData: AIUsageLog[] = [
  {
    id: 'usage-1',
    teamId: 'team-1',
    userId: 'user-1',
    provider: 'openai',
    model: 'gpt-4o',
    inputTokens: 2500,
    outputTokens: 3200,
    totalTokens: 5700,
    feature: 'content_generation',
    articleId: 'article-1',
    brandId: 'brand-1',
    estimatedCost: 0.0285,
    createdAt: '2024-03-10T10:00:00Z',
  },
  {
    id: 'usage-2',
    teamId: 'team-1',
    userId: 'user-1',
    provider: 'openai',
    model: 'gpt-4o',
    inputTokens: 3800,
    outputTokens: 4100,
    totalTokens: 7900,
    feature: 'content_generation',
    articleId: 'article-2',
    brandId: 'brand-1',
    estimatedCost: 0.0395,
    createdAt: '2024-03-08T14:00:00Z',
  },
  {
    id: 'usage-3',
    teamId: 'team-1',
    userId: 'user-2',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    inputTokens: 1200,
    outputTokens: 1800,
    totalTokens: 3000,
    feature: 'humanization',
    articleId: 'article-1',
    brandId: 'brand-1',
    estimatedCost: 0.009,
    createdAt: '2024-03-07T11:00:00Z',
  },
];

// ============================================
// SEO Data
// ============================================

export const mockKeywordData: KeywordData[] = [
  { keyword: 'workflow automation', searchVolume: 12100, cpc: 15.50, competition: 0.65, competitionLevel: 'medium' },
  { keyword: 'business automation tools', searchVolume: 8100, cpc: 18.20, competition: 0.72, competitionLevel: 'high' },
  { keyword: 'no-code automation', searchVolume: 4400, cpc: 12.80, competition: 0.45, competitionLevel: 'medium' },
  { keyword: 'automate business processes', searchVolume: 2900, cpc: 14.30, competition: 0.58, competitionLevel: 'medium' },
  { keyword: 'workflow management software', searchVolume: 6600, cpc: 22.50, competition: 0.78, competitionLevel: 'high' },
];

// ============================================
// Helper Functions
// ============================================

export function getBrandById(id: string): Brand | undefined {
  return mockBrands.find(b => b.id === id);
}

export function getBrandProfile(brandId: string): BrandProfile | undefined {
  return mockBrandProfiles.find(p => p.brandId === brandId && p.isActive);
}

export function getArticlesByBrand(brandId: string): Article[] {
  return mockArticles.filter(a => a.brandId === brandId);
}

export function getArticleById(id: string): Article | undefined {
  return mockArticles.find(a => a.id === id);
}

export function getCrawledPagesByBrand(brandId: string): CrawledPage[] {
  return mockCrawledPages.filter(p => p.brandId === brandId);
}

export function getActivePatternRules(teamId?: string): AIPatternRule[] {
  return mockAIPatternRules.filter(r =>
    r.isActive && (r.isGlobal || r.teamId === teamId)
  );
}
