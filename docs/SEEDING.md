# Database Seeding Guide

This document explains how to seed the ContentBeagle database with test data for development and testing.

## Overview

The seed script (`/supabase/migrations/20241210000008_seed_test_data.sql`) creates comprehensive test data that mirrors the mock data previously used in the frontend. This enables:

- **Consistent testing environment** across all developers
- **Realistic data** for UI development and debugging
- **Reproducible state** for automated tests
- **Safe development** without affecting production data

## Prerequisites

Before running the seed script, you need:

1. **Supabase project** configured (see Phase 2 setup)
2. **At least one auth user** in your Supabase project
3. **Database migrations** 1-7 already applied

## Test User Setup

The seed script automatically uses existing users from `auth.users`. For a proper test environment, create these users in Supabase:

### Option 1: Use Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Users**
3. Click **Add user** > **Create new user**
4. Create users with these credentials:

| Email | Password | Full Name | Notes |
|-------|----------|-----------|-------|
| `john@test.contentbeagle.com` | `TestPass123!` | John Doe | Primary test user (owner) |
| `jane@test.contentbeagle.com` | `TestPass123!` | Jane Smith | Secondary user (editor) |
| `mike@test.contentbeagle.com` | `TestPass123!` | Mike Johnson | Tertiary user (viewer) |

### Option 2: Use Your Own Email

If you've already signed up with your email:
- The seed script will automatically detect your user
- All test data will be associated with your account
- You'll be the owner of all test teams/brands

### Option 3: Use Supabase CLI

```bash
# Create test users via Supabase CLI (requires service role key)
npx supabase auth admin create-user \
  --project-ref eiowwhicvrtawgotvswt \
  --email john@test.contentbeagle.com \
  --password TestPass123! \
  --user-metadata '{"full_name": "John Doe"}'
```

## Running the Seed Script

### Method 1: Via Supabase CLI (Recommended)

```bash
# Push all migrations including seed data
npx supabase db push --project-ref eiowwhicvrtawgotvswt
```

### Method 2: Via SQL Editor

1. Go to Supabase Dashboard > SQL Editor
2. Copy the contents of `/supabase/migrations/20241210000008_seed_test_data.sql`
3. Run the script

### Method 3: Direct Connection

```bash
# Using psql (replace with your connection string)
psql "postgresql://postgres:[password]@db.eiowwhicvrtawgotvswt.supabase.co:5432/postgres" \
  -f supabase/migrations/20241210000008_seed_test_data.sql
```

## Seed Data Contents

### Teams (2)

| Name | Slug | Plan | Owner |
|------|------|------|-------|
| Acme Content Team | `acme-content-test` | Pro | John |
| Personal Workspace | `personal-test` | Free | John |

### Team Members (4)

| Team | User | Role |
|------|------|------|
| Acme Content Team | John | Owner |
| Acme Content Team | Jane | Editor |
| Acme Content Team | Mike | Viewer |
| Personal Workspace | John | Owner |

### Brands (3)

| Name | Industry | Status |
|------|----------|--------|
| TechFlow SaaS | Technology | Ready |
| GreenLeaf Wellness | Health & Wellness | Ready |
| FinanceFirst | Finance | Analyzing |

### Brand Profiles (2)

Complete voice/tone profiles for:
- **TechFlow**: Professional, innovative, B2B tone
- **GreenLeaf**: Warm, nurturing, wellness-focused

### Articles (3)

| Title | Brand | Status |
|-------|-------|--------|
| 10 Ways to Automate Your Business Workflows | TechFlow | Published |
| The Complete Guide to No-Code Automation | TechFlow | SEO Review |
| 5 Morning Rituals for a Healthier You | GreenLeaf | Draft |

### Crawled Pages (3)

All for TechFlow brand:
- Homepage
- Features page
- Pricing page

### AI Pattern Rules (1 team-specific)

- "Avoid Simple for TechFlow" rule

### AI Usage Logs (3)

Sample token usage records for tracking

### Keyword Research (5)

Sample SEO keyword data

## Resetting Test Data

The seed script is **idempotent** - running it again will:
1. Delete all existing test data
2. Re-insert fresh test data

To manually reset:

```sql
-- Delete test data by team
DELETE FROM teams WHERE slug IN ('acme-content-test', 'personal-test');
```

## Verifying Seed Data

Run these queries to verify data was inserted:

```sql
-- Check teams
SELECT name, slug, plan FROM teams WHERE slug LIKE '%test%';

-- Check brands
SELECT b.name, b.industry, b.status
FROM brands b
JOIN teams t ON b.team_id = t.id
WHERE t.slug LIKE '%test%';

-- Check articles
SELECT a.title, a.status, b.name as brand
FROM articles a
JOIN brands b ON a.brand_id = b.id
JOIN teams t ON a.team_id = t.id
WHERE t.slug LIKE '%test%';

-- Check crawled pages
SELECT cp.url, cp.title
FROM crawled_pages cp
JOIN brands b ON cp.brand_id = b.id
JOIN teams t ON b.team_id = t.id
WHERE t.slug LIKE '%test%';
```

## Environment-Specific Notes

### Development

- Use the full seed script
- Safe to run multiple times
- Test data has `-test` suffix in slugs to distinguish from production

### Staging

- Use the seed script for initial setup
- Consider creating staging-specific users
- May want to reduce data volume

### Production

- **DO NOT run the seed script in production**
- Production data should come from real user activity
- Use database backups for recovery scenarios

## Fixed UUIDs

The seed script uses fixed UUIDs for reproducibility:

| Entity | UUID Pattern |
|--------|--------------|
| Teams | `11111111-...`, `22222222-...` |
| Brands | `33333333-...`, `44444444-...`, `55555555-...` |
| Articles | `66666666-...`, `77777777-...`, `88888888-...` |
| Crawl Jobs | `99999999-...` |

This enables:
- Consistent references in tests
- Predictable foreign key relationships
- Easy debugging

## Troubleshooting

### "No users found in auth.users"

**Problem**: Seed script can't find any users
**Solution**: Create at least one user via Supabase Dashboard or CLI

### "violates foreign key constraint"

**Problem**: Related data exists
**Solution**: Run the DELETE statements at the top of the script first

### "duplicate key value violates unique constraint"

**Problem**: Data already exists with same IDs
**Solution**: The script handles this automatically, but you can manually delete:
```sql
DELETE FROM teams WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);
```

### Profile not created for user

**Problem**: User exists but profile is missing
**Solution**: The `handle_new_user()` trigger should auto-create profiles. If not:
```sql
INSERT INTO profiles (id, email, full_name)
SELECT id, email, raw_user_meta_data->>'full_name'
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
```

## Related Documentation

- [DATABASE.md](/docs/DATABASE.md) - Full schema documentation
- [Phase 2 Setup](/CLAUDE.md#phase-2-supabase-integration) - Database setup instructions
- [Mock Data Migration](/docs/IMPLEMENTATION-ROADMAP.md#phase-6) - Migration plan from mock data
