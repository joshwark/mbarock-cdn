-- MBA Rock — Tier-1 Tools Migration (2026-05-19)
-- Adds 5 tables for: Adytum Pipeline submissions · Dossier shares · What's New posts · Referrals · Member Directory
-- Run once in Supabase project ciloqphtencjthkedanw.

-- ════════════════════════════════════════════════════════════════════
-- 1. pipeline_submissions  —  Adytum Operator Pipeline review queue
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pipeline_submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_email    text NOT NULL,
  member_user_id  uuid,                              -- auth.users id if available
  doors           text[] NOT NULL,                   -- {'investment'} | {'brand'} | {'investment','brand'}
  notes           text,                              -- up to 15 lines / ~1500 chars
  capstone_link   text,                              -- optional URL to their public dossier share
  status          text NOT NULL DEFAULT 'submitted'
                  CHECK (status IN ('submitted','review','bring-more','move-forward','passed','engaged')),
  reviewer_notes  text,                              -- Josh adds here
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz
);
CREATE INDEX IF NOT EXISTS pipeline_submissions_status_idx ON pipeline_submissions(status);
CREATE INDEX IF NOT EXISTS pipeline_submissions_email_idx ON pipeline_submissions(member_email);
CREATE INDEX IF NOT EXISTS pipeline_submissions_created_idx ON pipeline_submissions(created_at DESC);

-- ════════════════════════════════════════════════════════════════════
-- 2. dossier_shares  —  public read-only share links for Operator's Dossier
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS dossier_shares (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,              -- short random slug used in /d/<slug>
  member_email    text NOT NULL,
  member_user_id  uuid,
  dossier_data    jsonb NOT NULL,                    -- snapshot of capstone/dossier at share time
  view_count      int NOT NULL DEFAULT 0,
  revoked         boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_viewed_at  timestamptz
);
CREATE INDEX IF NOT EXISTS dossier_shares_slug_idx ON dossier_shares(slug);
CREATE INDEX IF NOT EXISTS dossier_shares_email_idx ON dossier_shares(member_email);

-- ════════════════════════════════════════════════════════════════════
-- 3. whats_new_posts  —  quarterly "what's new" announcements
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS whats_new_posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,                -- e.g. 2026-q2
  title         text NOT NULL,
  body_md       text NOT NULL,                       -- markdown body
  hero_stats    jsonb,                               -- {lessons:74, songs:65, videos:74, ...}
  published     boolean NOT NULL DEFAULT false,
  published_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS whats_new_published_idx ON whats_new_posts(published_at DESC) WHERE published = true;

-- ════════════════════════════════════════════════════════════════════
-- 4. referrals  —  per-member referral codes + tracking
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS referral_codes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text UNIQUE NOT NULL,              -- e.g. JESS-A4F2K
  member_email    text NOT NULL UNIQUE,              -- owner of the code
  member_user_id  uuid,
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS referral_codes_member_idx ON referral_codes(member_email);

CREATE TABLE IF NOT EXISTS referral_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text NOT NULL REFERENCES referral_codes(code) ON DELETE CASCADE,
  event_type      text NOT NULL CHECK (event_type IN ('visit','signup','purchase')),
  ip_hash         text,                              -- hashed for de-dup
  user_agent      text,
  referrer_url    text,
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS referral_events_code_idx ON referral_events(code);
CREATE INDEX IF NOT EXISTS referral_events_type_idx ON referral_events(event_type);

-- ════════════════════════════════════════════════════════════════════
-- 5. directory_profiles  —  opt-in searchable member directory
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS directory_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_email    text NOT NULL UNIQUE,
  member_user_id  uuid,
  display_name    text NOT NULL,
  role            text,                              -- self-described: "Founder", "Operator", etc.
  industry        text,
  business_name   text,
  business_url    text,
  one_liner       text,                              -- pitch in 1-2 sentences
  city            text,
  linkedin_url    text,
  twitter_handle  text,
  open_to         text[],                            -- {'collab','hiring','advising','investing'}
  capstone_topic  text,                              -- their capstone focus
  opted_in        boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS directory_profiles_industry_idx ON directory_profiles(industry) WHERE opted_in = true;
CREATE INDEX IF NOT EXISTS directory_profiles_optedin_idx ON directory_profiles(opted_in);

-- ════════════════════════════════════════════════════════════════════
-- 6. Helper functions
-- ════════════════════════════════════════════════════════════════════
-- Generates a short, urlsafe slug
CREATE OR REPLACE FUNCTION public.gen_short_slug(len int DEFAULT 8) RETURNS text LANGUAGE sql VOLATILE AS $$
  SELECT lower(translate(encode(gen_random_bytes(len), 'base64'), '+/=', ''))
  ;
$$;

-- Get current user's email from JWT
CREATE OR REPLACE FUNCTION public.jwt_email() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT auth.jwt() ->> 'email';
$$;

-- ════════════════════════════════════════════════════════════════════
-- 7. RLS — Row Level Security
-- ════════════════════════════════════════════════════════════════════
ALTER TABLE pipeline_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dossier_shares       ENABLE ROW LEVEL SECURITY;
ALTER TABLE whats_new_posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_profiles   ENABLE ROW LEVEL SECURITY;

-- pipeline_submissions
DROP POLICY IF EXISTS pls_owner_select ON pipeline_submissions;
CREATE POLICY pls_owner_select ON pipeline_submissions FOR SELECT USING (
  member_email = jwt_email() OR is_admin()
);
DROP POLICY IF EXISTS pls_owner_insert ON pipeline_submissions;
CREATE POLICY pls_owner_insert ON pipeline_submissions FOR INSERT
  WITH CHECK (member_email = jwt_email());
DROP POLICY IF EXISTS pls_admin_update ON pipeline_submissions;
CREATE POLICY pls_admin_update ON pipeline_submissions FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- dossier_shares: owner full CRUD, public read for non-revoked + slug match
DROP POLICY IF EXISTS dsh_owner_all ON dossier_shares;
CREATE POLICY dsh_owner_all ON dossier_shares FOR ALL USING (
  member_email = jwt_email() OR is_admin()
) WITH CHECK (member_email = jwt_email() OR is_admin());
DROP POLICY IF EXISTS dsh_public_read ON dossier_shares;
CREATE POLICY dsh_public_read ON dossier_shares FOR SELECT
  USING (revoked = false);  -- everyone (anon + authed) can read non-revoked rows; clients use slug to find one

-- whats_new_posts: anyone can read published; owners can write
DROP POLICY IF EXISTS wnp_public_select ON whats_new_posts;
CREATE POLICY wnp_public_select ON whats_new_posts FOR SELECT USING (published = true OR is_admin());
DROP POLICY IF EXISTS wnp_admin_write ON whats_new_posts;
CREATE POLICY wnp_admin_write ON whats_new_posts FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- referral_codes: owner full CRUD, public read by code (so anonymous attribution can resolve)
DROP POLICY IF EXISTS rc_owner_all ON referral_codes;
CREATE POLICY rc_owner_all ON referral_codes FOR ALL USING (
  member_email = jwt_email() OR is_admin()
) WITH CHECK (member_email = jwt_email() OR is_admin());
DROP POLICY IF EXISTS rc_public_read ON referral_codes;
CREATE POLICY rc_public_read ON referral_codes FOR SELECT USING (active = true);

-- referral_events: public insert (anon visits get logged), owner read for their code
DROP POLICY IF EXISTS re_public_insert ON referral_events;
CREATE POLICY re_public_insert ON referral_events FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS re_owner_select ON referral_events;
CREATE POLICY re_owner_select ON referral_events FOR SELECT USING (
  is_admin() OR
  code IN (SELECT code FROM referral_codes WHERE member_email = jwt_email())
);

-- directory_profiles: anyone can read opted-in rows; member edits own row
DROP POLICY IF EXISTS dp_public_select ON directory_profiles;
CREATE POLICY dp_public_select ON directory_profiles FOR SELECT USING (opted_in = true OR member_email = jwt_email() OR is_admin());
DROP POLICY IF EXISTS dp_owner_write ON directory_profiles;
CREATE POLICY dp_owner_write ON directory_profiles FOR ALL USING (
  member_email = jwt_email() OR is_admin()
) WITH CHECK (member_email = jwt_email() OR is_admin());

-- ════════════════════════════════════════════════════════════════════
-- 8. Realtime publication for tables admins may watch
-- ════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE pipeline_submissions; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE dossier_shares;       EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE referral_events;      EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ════════════════════════════════════════════════════════════════════
-- 9. Seed the first What's New post (this week's launch)
-- ════════════════════════════════════════════════════════════════════
INSERT INTO whats_new_posts (slug, title, body_md, hero_stats, published, published_at)
VALUES (
  '2026-05-launch',
  'May 2026 — Course complete, Adytum Pipeline open, member tools live',
  E'# This sprint we shipped\n\n## Course\n- **100% complete**: every one of 74 lessons now has an explainer video AND an original song.\n- **65 original songs** across the album catalog (up from 49).\n- Music videos planned for top-engagement tracks in Q3.\n\n## New member benefits\n- **The Adytum Operator Pipeline** — course-only access to Adytum''s investment desk and Better Together Branding''s brand studio. Submit your Dossier; review takes 7–14 days.\n- **Public share links** — generate a /d/ URL for your Operator''s Dossier and send it to advisors or co-founders.\n- **Referral program** — every member gets a personal code. Refer a friend, they get $50 off, you get $100 credit.\n- **Member directory** — opt-in searchable profile so operators can find each other by industry, role, or what they''re open to.\n\n## Behind the scenes\n- Admin console (members-only) deployed for site health + fix-request queue.\n- Full QA sweep: 155 of 155 media URLs verified live.\n- Custom SMTP via Resend — no more email rate limits.',
  '{"lessons":74,"songs":65,"videos":74,"calculators":18}'::jsonb,
  true,
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md,
  hero_stats = EXCLUDED.hero_stats,
  updated_at = now();

-- DONE.
-- Verify with:
--   SELECT count(*) FROM pipeline_submissions; -- 0 expected (no submissions yet)
--   SELECT slug, title FROM whats_new_posts;   -- 1 row: the May launch post
