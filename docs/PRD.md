# ContentBeagle - Product Requirements Document

## Product Vision

ContentBeagle is a multi-tenant SaaS platform that enables businesses and content creators to produce high-quality, brand-aligned long-form content at scale. The platform combines AI-powered content generation with intelligent brand discovery, SEO optimization, and content humanization to deliver authentic, on-brand articles that resonate with target audiences.

### Core Value Proposition

1. **Brand Intelligence**: Automatically extract voice, tone, and style guidelines from existing content
2. **AI-Powered Writing**: Generate comprehensive long-form content aligned with brand standards
3. **Content Humanization**: Remove AI patterns to produce authentic, human-sounding content
4. **SEO Optimization**: Integrate real-time keyword opportunities from DataForSEO
5. **Cross-Linking Intelligence**: Suggest and insert relevant internal links automatically

---

## User Personas

### Persona 1: Solo Content Creator
- **Name**: Sarah, Freelance Writer
- **Goals**: Produce high-quality content faster while maintaining client brand voices
- **Pain Points**: Manually maintaining style guides, inconsistent voice across articles
- **Use Case**: Creates content for multiple clients, needs brand switching

### Persona 2: Marketing Team Lead
- **Name**: Mike, Content Marketing Manager
- **Goals**: Scale content production while maintaining quality and brand consistency
- **Pain Points**: Onboarding new writers, ensuring brand compliance, SEO optimization
- **Use Case**: Team of 5 writers producing content for company blog

### Persona 3: Agency Owner
- **Name**: Lisa, Digital Agency Founder
- **Goals**: Deliver more content to clients without increasing headcount
- **Pain Points**: Managing multiple brand voices, client revisions, AI-sounding content
- **Use Case**: Manages 20+ client brands with different voice requirements

---

## Feature Specifications

### F1: User & Team Management

#### F1.1: Authentication
- **Acceptance Criteria**:
  - Users can sign up with email/password
  - Users can sign up/in with Google OAuth
  - Users can sign up/in with GitHub OAuth
  - Password reset via email link
  - Session management with secure tokens

#### F1.2: Team Creation
- **Acceptance Criteria**:
  - Users can create a team during signup or later
  - Teams have a name, slug (URL-friendly identifier), and owner
  - Individual users operate as a "personal" team
  - Teams can upgrade/downgrade plans

#### F1.3: Team Member Management
- **Acceptance Criteria**:
  - Owners can invite members via email
  - Roles: Owner, Admin, Editor, Viewer
  - Owners/Admins can change member roles
  - Members can leave teams voluntarily
  - Owners can remove members

#### F1.4: Role Permissions
| Permission | Owner | Admin | Editor | Viewer |
|------------|-------|-------|--------|--------|
| Manage team settings | Yes | Yes | No | No |
| Manage members | Yes | Yes | No | No |
| Manage API keys | Yes | Yes | No | No |
| Create/edit brands | Yes | Yes | Yes | No |
| Delete brands | Yes | Yes | No | No |
| Create/edit articles | Yes | Yes | Yes | No |
| Delete articles | Yes | Yes | No | No |
| View all content | Yes | Yes | Yes | Yes |

---

### F2: Brand Management

#### F2.1: Brand Creation
- **Acceptance Criteria**:
  - Users can create a brand with: name, website URL (optional), industry, description
  - Brand is associated with the current team
  - Brand has a status: pending, crawling, analyzing, ready, error

#### F2.2: Brand Discovery via URL Crawling
- **Acceptance Criteria**:
  - Users can input 1+ URLs to crawl for brand discovery
  - System crawls pages using Firecrawl API
  - Progress indicator shows crawl status
  - Crawled content is stored for analysis

#### F2.3: Brand Profile Extraction
- **Acceptance Criteria**:
  - AI analyzes crawled content to extract:
    - Voice characteristics (formal/casual, tone adjectives)
    - Tone scales (formality, enthusiasm, humor, confidence, empathy: 1-10)
    - Writing style (sentence structure, vocabulary level, POV)
    - Key terminology (industry terms, brand-specific terms, words to avoid)
    - Content themes and value propositions
    - Do's and don'ts lists
  - Users can review and edit extracted profile
  - Profile versioning (keep history of changes)

#### F2.4: Brand Voice Editor
- **Acceptance Criteria**:
  - Sliders for tone characteristics (1-10 scales)
  - Text fields for voice description
  - List editors for terminology (preferred terms, avoid terms)
  - Sample phrase management
  - Do's and don'ts list editors
  - Save creates new version, previous versions accessible

#### F2.5: Site Crawling for Cross-Links
- **Acceptance Criteria**:
  - Users can initiate full site crawl
  - Users can specify URL patterns to include/exclude
  - Crawled pages show: URL, title, summary, key topics
  - Incremental crawling (skip unchanged pages)
  - Manual re-crawl trigger per page

---

### F3: Article Creation & Workflow

#### F3.1: Article Creation
- **Acceptance Criteria**:
  - Select brand for the article
  - Choose input type: bullets, draft, research, topic-only
  - Rich text input area for content
  - Settings: target audience, length (short/medium/long or word count), CTA
  - "Generate" initiates AI content generation

#### F3.2: Content Generation
- **Acceptance Criteria**:
  - AI generates content based on input + brand profile
  - Streaming output shows content as it generates
  - Progress indicator for multi-step pipeline
  - Generated content appears in editor

#### F3.3: Article Editor
- **Acceptance Criteria**:
  - Rich text editor (Markdown-based, WYSIWYG optional)
  - Toolbar with formatting options
  - Auto-save every 30 seconds
  - Manual save button
  - Word count and reading time display
  - Workflow status indicator

#### F3.4: Article Workflow States
```
draft → editing → seo_review → cross_linking → humanizing → polished → approved → published
```
- **Acceptance Criteria**:
  - Clear visual indicator of current state
  - Transition buttons to move between states
  - Workflow log tracks all transitions with timestamps
  - States can be skipped by Admins

#### F3.5: Version History
- **Acceptance Criteria**:
  - Every save creates a version snapshot
  - Version list shows: version number, timestamp, author, change summary
  - Side-by-side diff view between versions
  - Restore to any previous version

---

### F4: SEO Optimization

#### F4.1: Keyword Opportunities
- **Acceptance Criteria**:
  - Fetch keywords from DataForSEO based on brand domain + article topic
  - Display: keyword, search volume, competition level, current rank
  - Categorize as primary vs secondary keywords
  - Show related/LSI keywords

#### F4.2: SEO Analysis Panel
- **Acceptance Criteria**:
  - Current keyword usage count in article
  - Keyword density indicators
  - Suggestions for keyword placement
  - Meta title editor (with character count)
  - Meta description editor (with character count)
  - SEO score (0-100)

#### F4.3: SEO Enhancement
- **Acceptance Criteria**:
  - AI suggests where to naturally insert keywords
  - One-click apply suggestions
  - Preview changes before applying

---

### F5: Cross-Linking

#### F5.1: Link Suggestions
- **Acceptance Criteria**:
  - Analyze article content against crawled pages
  - Suggest internal links with: target URL, suggested anchor text, relevance score
  - Show context snippet from article where link fits
  - Max configurable suggestions (default: 10)

#### F5.2: Link Management
- **Acceptance Criteria**:
  - One-click insert suggested link at optimal position
  - Manual link insertion with page search
  - Current links list with edit/remove options
  - Warning if linking same page multiple times

---

### F6: AI Pattern Removal (Humanization)

#### F6.1: Pattern Detection
- **Acceptance Criteria**:
  - Scan article for AI-typical patterns
  - Highlight detected patterns in editor
  - Show pattern category and severity
  - Display replacement suggestions

#### F6.2: Pattern Rules Management
- **Acceptance Criteria**:
  - View global (built-in) rules
  - Enable/disable individual rules
  - Create custom team rules
  - Rule fields: name, category, pattern (regex/exact), replacement options, severity
  - Test rule against sample text

#### F6.3: Built-in Pattern Rules (Examples)
| Pattern | Category | Severity | Replacement |
|---------|----------|----------|-------------|
| "delve into" | word_variety | medium | explore, examine, look at |
| "in conclusion" | transition_words | medium | to wrap up, finally, all in all |
| "it's important to note that" | phrase_replacement | medium | (remove) |
| "in today's [X]" | phrase_replacement | low | (rephrase) |
| "let's dive in" | phrase_replacement | medium | here's what you need to know |
| "robust" | word_variety | low | strong, reliable, solid |
| "leverage" | word_variety | low | use, apply, employ |
| "streamline" | word_variety | low | simplify, improve, speed up |
| "tapestry" | word_variety | medium | (rephrase metaphor) |
| "landscape" (overused) | word_variety | low | (context-dependent) |
| "crucially" | transition_words | low | importantly, notably |
| "moreover" | transition_words | low | also, additionally |
| "furthermore" | transition_words | low | also, and, plus |

#### F6.4: Humanization Process
- **Acceptance Criteria**:
  - One-click humanize button
  - AI rewrites flagged sections maintaining meaning
  - Before/after comparison view
  - Accept/reject individual changes
  - Apply all accepted changes

---

### F7: Final Polish

#### F7.1: Brand Verification
- **Acceptance Criteria**:
  - AI checks article against brand profile
  - Highlights any off-brand sections
  - Suggests corrections

#### F7.2: Consistency Check
- **Acceptance Criteria**:
  - Verify terminology consistency
  - Check for tense consistency
  - Validate heading hierarchy
  - Readability score

---

### F8: API Key Management (BYOK)

#### F8.1: Provider Configuration
- **Acceptance Criteria**:
  - Add API keys for: OpenAI, Anthropic, Google AI
  - Keys stored encrypted (Supabase Vault)
  - Connection test on add
  - Masked display (show last 4 chars only)
  - Remove key option

#### F8.2: Provider Selection
- **Acceptance Criteria**:
  - Default provider/model selection
  - Per-article provider override (optional)
  - Fallback provider configuration

#### F8.3: Usage Tracking
- **Acceptance Criteria**:
  - Track tokens used per provider
  - Estimate costs based on token usage
  - Usage dashboard with charts
  - Budget alerts (optional)

---

### F9: Settings

#### F9.1: User Profile
- **Acceptance Criteria**:
  - Edit name, email
  - Upload avatar
  - Change password
  - Delete account

#### F9.2: Team Settings
- **Acceptance Criteria**:
  - Edit team name
  - View current plan
  - Billing management (future)

---

## User Flows

### Flow 1: Brand Creation with Discovery

```
1. User clicks "New Brand"
2. Enter brand name, website URL, industry
3. Click "Discover Brand Voice"
4. System crawls provided URL(s)
   → Progress: "Crawling pages... (3/5)"
5. System analyzes content with AI
   → Progress: "Analyzing brand voice..."
6. Review extracted brand profile
   → Voice: "Professional yet approachable"
   → Tone: Formality 7/10, Enthusiasm 6/10...
   → Terminology: [industry terms...]
7. Edit any fields as needed
8. Click "Save Brand"
9. Brand ready for use in articles
```

### Flow 2: Article Creation

```
1. User clicks "New Article"
2. Select brand from dropdown
3. Choose input type (e.g., "Bullet Points")
4. Enter bullet points:
   • Main benefit of product X
   • How it solves problem Y
   • Customer success story
5. Set target audience: "Small business owners"
6. Set length: "Medium (1500-2500 words)"
7. Set CTA: "Start free trial"
8. Click "Generate Article"
   → Streaming: Content appears progressively
9. Article opens in editor with draft status
```

### Flow 3: Article Optimization

```
1. Open article in editor
2. Move to "SEO Review" status
3. SEO panel shows:
   → Keyword opportunities fetched from DataForSEO
   → Current keyword usage analysis
4. Click "Optimize for SEO"
   → AI suggests keyword insertions
5. Review and accept suggestions
6. Move to "Cross-Linking" status
7. Cross-link panel shows:
   → 8 suggested internal links
8. Click to insert relevant links
9. Move to "Humanizing" status
10. AI pattern panel shows:
    → 12 patterns detected
11. Click "Humanize"
    → AI rewrites flagged sections
12. Review changes, accept/reject
13. Move to "Polished" status
14. Final check passes
15. Move to "Approved" → "Published"
```

---

## Non-Functional Requirements

### Performance
- Page load time: < 2 seconds
- Content generation start: < 3 seconds
- Streaming latency: < 500ms per chunk
- API response time: < 1 second (non-AI)

### Security
- All API keys encrypted at rest (Supabase Vault)
- HTTPS everywhere
- Row-level security for multi-tenancy
- OWASP top 10 compliance

### Scalability
- Support 10,000+ articles per team
- Handle 100+ concurrent users
- Graceful degradation under load

### Reliability
- 99.9% uptime target
- Automatic retry for failed API calls
- Data backups daily

---

## Future Considerations (Out of Scope for MVP)

- Content calendar and scheduling
- WordPress/CMS integrations
- Collaborative editing (real-time)
- Custom AI model fine-tuning
- White-label option
- Mobile app
- Content performance analytics
- A/B testing for content variants
