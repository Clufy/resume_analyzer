-- ============================================================
-- Resume Analyzer — Supabase Migration (corrected)
-- Creates tables, indexes, RLS policies, and storage bucket
-- Run this in the Supabase SQL Editor (or via `supabase db push`)
-- ============================================================

-- Enable UUID extension (usually already enabled on Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. RESUMES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS resumes (
    id          BIGSERIAL PRIMARY KEY,
    filename    TEXT        NOT NULL,
    text        TEXT        NOT NULL DEFAULT '',
    skills      TEXT[]      NOT NULL DEFAULT '{}',
    education   TEXT[]      NOT NULL DEFAULT '{}',
    experience  TEXT[]      NOT NULL DEFAULT '{}',
    embeddings  FLOAT8[]    DEFAULT '{}',
    file_url    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON resumes (created_at DESC);

-- ============================================================
-- 2. JOB DESCRIPTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS job_descriptions (
    id          BIGSERIAL PRIMARY KEY,
    description TEXT        NOT NULL,
    skills      TEXT[]      NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. MATCHES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
    id              BIGSERIAL PRIMARY KEY,
    resume_id       BIGINT REFERENCES resumes(id) ON DELETE SET NULL,
    jd_id           BIGINT REFERENCES job_descriptions(id) ON DELETE SET NULL,
    match_score     FLOAT8       NOT NULL DEFAULT 0,
    missing_skills  TEXT[]       NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matches_resume_id ON matches (resume_id);
CREATE INDEX IF NOT EXISTS idx_matches_jd_id     ON matches (jd_id);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Enable RLS on all tables
ALTER TABLE resumes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_descriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches           ENABLE ROW LEVEL SECURITY;

-- Note:
-- The Supabase "service role" key bypasses RLS automatically; it is not a database role you name in CREATE POLICY.
-- To give anonymous frontend read access, we create policies for the anon/authenticated roles.
-- Below we drop existing policies if present and then create the intended policy definitions.

-- -----------------------
-- Resumes policies
-- -----------------------
DROP POLICY IF EXISTS "service_role_resumes" ON public.resumes;
CREATE POLICY "service_role_resumes"
  ON public.resumes
  FOR ALL
  -- Keep permissive so service requests (which bypass RLS) are covered if you want DB role-level grants.
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_resumes" ON public.resumes;
CREATE POLICY "anon_read_resumes"
  ON public.resumes
  FOR SELECT
  TO anon
  USING (true);

-- -----------------------
-- Job descriptions policies
-- -----------------------
DROP POLICY IF EXISTS "service_role_job_descriptions" ON public.job_descriptions;
CREATE POLICY "service_role_job_descriptions"
  ON public.job_descriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_job_descriptions" ON public.job_descriptions;
CREATE POLICY "anon_read_job_descriptions"
  ON public.job_descriptions
  FOR SELECT
  TO anon
  USING (true);

-- -----------------------
-- Matches policies
-- -----------------------
DROP POLICY IF EXISTS "service_role_matches" ON public.matches;
CREATE POLICY "service_role_matches"
  ON public.matches
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_matches" ON public.matches;
CREATE POLICY "anon_read_matches"
  ON public.matches
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================
-- 5. SUPABASE STORAGE BUCKET
-- ============================================================
-- Create a public bucket for resume files (storage schema provided by Supabase)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies operate on storage.objects; ensure RLS is enabled for storage if required by your project.
-- Allow uploads into the 'resumes' bucket (restrict inserts to the bucket)
DROP POLICY IF EXISTS "service_upload_resumes" ON storage.objects;
CREATE POLICY "service_upload_resumes"
  ON storage.objects
  FOR INSERT
  -- Restrict to objects being inserted into the 'resumes' bucket
  WITH CHECK (bucket_id = 'resumes');

-- Allow public read access to resume files (SELECT) filtered by bucket_id
DROP POLICY IF EXISTS "public_read_resumes" ON storage.objects;
CREATE POLICY "public_read_resumes"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'resumes');

-- ============================================================
-- Done! Tables, indexes, RLS policies, and storage bucket created.
-- ============================================================
