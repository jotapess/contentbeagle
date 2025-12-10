# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ContentBeagle** is a multi-tenant SaaS platform for brand-aligned long-form content creation. It combines AI-powered content generation with brand discovery, SEO optimization, and content humanization.

### Tech Stack
- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Vault)
- **AI**: Vercel AI SDK with BYOK (Bring Your Own Key) - supports OpenAI, Anthropic, Google
- **External APIs**: Firecrawl (web crawling), DataForSEO (SEO data)
- **Rich Text Editor**: Tiptap (headless, Markdown-based)
- **Caching**: Upstash Redis (serverless)
- **Auth**: Supabase OAuth (Google, GitHub)
- **Deployment**: Vercel

### Key Features
1. Brand discovery via URL crawling (extracts voice, tone, terminology)
2. AI content generation aligned with brand profile
3. AI pattern removal (humanization) with configurable rules
4. SEO optimization with DataForSEO keyword opportunities
5. Cross-linking intelligence from crawled site pages
6. Multi-tenant with team support and role-based access

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Generate Supabase types
npm run db:types

# Run Supabase migrations
npm run db:push
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Public auth pages (login, signup)
│   ├── (dashboard)/       # Protected dashboard pages
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Layout components (sidebar, header)
│   └── features/          # Feature-specific components
├── lib/
│   ├── supabase/          # Supabase client & utilities
│   ├── ai/                # AI service, prompts, provider registry
│   ├── services/          # External service clients (Firecrawl, DataForSEO)
│   ├── cache/             # Caching utilities
│   └── mock-data/         # Mock data for frontend development
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript types
```

## Documentation

Detailed documentation is in `/docs/`:
- `PRD.md` - Product requirements and feature specifications
- `DATABASE.md` - Complete database schema and RLS policies
- `AI-PIPELINE.md` - AI content generation pipeline and prompts
- `INTEGRATIONS.md` - Firecrawl and DataForSEO integration patterns
- `ARCHITECTURE.md` - System architecture and folder structure

## Development Approach

**Frontend-first**: Build all UI screens with mock data before backend integration.

1. **Phase 1**: Complete frontend with mock data
2. **Phase 2**: Integrate Supabase (auth, database)
3. **Phase 3**: Add AI provider integration
4. **Phase 4**: Connect external services

## Key Patterns

### Multi-Tenancy
- All data scoped to teams via `team_id`
- Row Level Security (RLS) on all tables
- Helper functions: `is_team_member()`, `has_team_role()`

### BYOK (Bring Your Own Key)
- Users provide their own AI API keys
- Keys encrypted in Supabase Vault
- Provider abstraction via Vercel AI SDK registry

### Article Workflow
```
draft → editing → seo_review → cross_linking → humanizing → polished → approved → published
```

### Component Conventions
- Use shadcn/ui for base components
- Feature components in `components/features/[feature]/`
- Server components by default, `'use client'` only when needed

## Important Files

- `/src/lib/ai/provider-registry.ts` - BYOK provider setup
- `/src/lib/ai/prompts/` - All AI prompt templates
- `/src/lib/services/firecrawl/client.ts` - Firecrawl API wrapper
- `/src/lib/services/dataforseo/client.ts` - DataForSEO API wrapper
- `/src/components/features/articles/article-editor.tsx` - Main content editor
- `/src/components/features/brands/voice-profile-editor.tsx` - Brand voice UI
