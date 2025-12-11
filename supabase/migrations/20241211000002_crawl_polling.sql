-- ============================================
-- Add Firecrawl Job ID for Polling Support
-- ============================================
-- Stores the external Firecrawl job ID so we can poll
-- for status when webhooks aren't available (local dev)
-- ============================================

-- Add firecrawl_job_id column
ALTER TABLE crawl_jobs
ADD COLUMN IF NOT EXISTS firecrawl_job_id TEXT;

-- Add index for looking up by firecrawl job ID
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_firecrawl_id ON crawl_jobs(firecrawl_job_id);

-- Update status check constraint to include 'in_progress'
-- (The current constraint uses 'running' but code uses 'in_progress')
ALTER TABLE crawl_jobs DROP CONSTRAINT IF EXISTS crawl_jobs_status_check;
ALTER TABLE crawl_jobs ADD CONSTRAINT crawl_jobs_status_check
  CHECK (status IN ('pending', 'running', 'in_progress', 'completed', 'failed', 'cancelled'));
