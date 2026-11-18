-- =============================================
-- DnDex — Полная схема БД для Supabase
-- Выполни весь этот файл в SQL Editor
-- =============================================

-- =============================================
-- 0. РАСШИРЕНИЯ
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Включи Realtime для таблиц (нужен для подписок на изменения)
-- Выполни в Dashboard → Database → Replication:
--   Включи Realtime для: campaign_activity, campaigns, reviews

-- =============================================
-- 1. ENUMS
-- =============================================
DO $$ BEGIN
  CREATE TYPE campaign_type AS ENUM ('campaign', 'one_shot');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE participant_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 2. PROFILES (расширение auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Авто-создание профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS: Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================
-- 3. CAMPAIGNS
-- =============================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type campaign_type NOT NULL DEFAULT 'campaign',
  system TEXT NOT NULL DEFAULT 'D&D 5e',
  max_players INT NOT NULL DEFAULT 4 CHECK (max_players > 0 AND max_players <= 12),
  dm_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status campaign_status NOT NULL DEFAULT 'open',
  cover_url TEXT,
  discord_url TEXT,
  schedule TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Авто-обновление updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaigns_updated_at ON public.campaigns;
CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: Campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Campaigns are publicly readable" ON public.campaigns;
CREATE POLICY "Campaigns are publicly readable"
  ON public.campaigns FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create campaigns" ON public.campaigns;
CREATE POLICY "Authenticated users can create campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (auth.uid() = dm_id);

DROP POLICY IF EXISTS "DM can update own campaigns" ON public.campaigns;
CREATE POLICY "DM can update own campaigns"
  ON public.campaigns FOR UPDATE
  USING (auth.uid() = dm_id)
  WITH CHECK (auth.uid() = dm_id);

DROP POLICY IF EXISTS "DM can delete own campaigns" ON public.campaigns;
CREATE POLICY "DM can delete own campaigns"
  ON public.campaigns FOR DELETE
  USING (auth.uid() = dm_id);

-- =============================================
-- 4. PARTICIPANTS (M:M users <-> campaigns)
-- =============================================
CREATE TABLE IF NOT EXISTS public.participants (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  status participant_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, campaign_id)
);

-- RLS: Participants
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants are publicly readable" ON public.participants;
CREATE POLICY "Participants are publicly readable"
  ON public.participants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can request to join" ON public.participants;
CREATE POLICY "Authenticated users can request to join"
  ON public.participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "DM can update participant status" ON public.participants;
CREATE POLICY "DM can update participant status"
  ON public.participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can withdraw or DM can remove" ON public.participants;
CREATE POLICY "Users can withdraw or DM can remove"
  ON public.participants FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

-- =============================================
-- 5. REVIEWS
-- =============================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL DEFAULT '',
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (author_id, campaign_id)
);

-- RLS: Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.reviews;
CREATE POLICY "Reviews are publicly readable"
  ON public.reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reviews (not own campaign)" ON public.reviews;
CREATE POLICY "Authenticated users can create reviews (not own campaign)"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND NOT EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authors can update own reviews" ON public.reviews;
CREATE POLICY "Authors can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete own reviews" ON public.reviews;
CREATE POLICY "Authors can delete own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = author_id);

-- =============================================
-- 6. VIEW: campaigns_with_stats
-- =============================================
CREATE OR REPLACE VIEW public.campaigns_with_stats AS
SELECT
  c.*,
  COALESCE(AVG(r.rating), 0)::NUMERIC(3,1) AS avg_rating,
  COALESCE(COUNT(DISTINCT r.id), 0)::INT AS review_count,
  COALESCE(COUNT(DISTINCT CASE WHEN p.status = 'accepted' THEN p.user_id END), 0)::INT AS player_count
FROM public.campaigns c
LEFT JOIN public.reviews r ON r.campaign_id = c.id
LEFT JOIN public.participants p ON p.campaign_id = c.id
GROUP BY c.id;

-- =============================================
-- 7. ИНДЕКСЫ (для производительности)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_campaigns_dm_id ON public.campaigns(dm_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_system ON public.campaigns(system);
CREATE INDEX IF NOT EXISTS idx_participants_campaign_id ON public.participants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON public.participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON public.participants(status);
CREATE INDEX IF NOT EXISTS idx_reviews_campaign_id ON public.reviews(campaign_id);
CREATE INDEX IF NOT EXISTS idx_reviews_author_id ON public.reviews(author_id);

-- =============================================
-- Optional cover/avatar URLs do not require a Storage bucket.
-- Configure owner-scoped Storage policies separately if adding uploads.

-- DNDEX_VERSIONED_MIGRATIONS
-- DnDex 2.0: additive, data-preserving migration. Apply BEFORE the new frontend.
-- Existing records are not deleted or rewritten. PostgreSQL 15+ is required.
BEGIN;

-- Pending/rejected applications are personal data. Accepted party members stay public.
DROP POLICY IF EXISTS "Participants are publicly readable" ON public.participants;
DROP POLICY IF EXISTS "Visible participants" ON public.participants;
CREATE POLICY "Visible participants" ON public.participants FOR SELECT USING (
  status = 'accepted' OR user_id = (SELECT auth.uid()) OR EXISTS (
    SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.dm_id = (SELECT auth.uid())
  )
);
DROP POLICY IF EXISTS "Authenticated users can request to join" ON public.participants;
CREATE POLICY "Authenticated users can request to join" ON public.participants FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND status = 'pending');

-- Serialize moderation on the parent campaign row: two GMs/tabs cannot fill the last seat twice.
CREATE OR REPLACE FUNCTION public.enforce_participant_rules()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE adventure public.campaigns%ROWTYPE; occupied integer;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.campaign_id IS DISTINCT FROM OLD.campaign_id
      OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'immutable_participant_identity' USING ERRCODE = '23514';
    END IF;
    IF OLD.status <> 'pending' OR NEW.status NOT IN ('accepted', 'rejected') THEN
      RAISE EXCEPTION 'invalid_participant_transition' USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.status <> 'pending' THEN
    RAISE EXCEPTION 'applications_must_start_pending' USING ERRCODE = '23514';
  END IF;
  SELECT * INTO adventure FROM public.campaigns WHERE id = NEW.campaign_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'campaign_not_found' USING ERRCODE = '23503'; END IF;
  IF NEW.user_id = adventure.dm_id THEN
    RAISE EXCEPTION 'dm_cannot_join_own_campaign' USING ERRCODE = '23514';
  END IF;
  IF NEW.status IN ('pending', 'accepted') THEN
    IF adventure.status <> 'open' THEN RAISE EXCEPTION 'campaign_closed' USING ERRCODE = '23514'; END IF;
    SELECT count(*) INTO occupied FROM public.participants WHERE campaign_id = NEW.campaign_id AND status = 'accepted' AND user_id <> NEW.user_id;
    IF occupied >= adventure.max_players THEN RAISE EXCEPTION 'campaign_full' USING ERRCODE = '23514'; END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS participant_integrity ON public.participants;
CREATE TRIGGER participant_integrity BEFORE INSERT OR UPDATE ON public.participants FOR EACH ROW EXECUTE FUNCTION public.enforce_participant_rules();
REVOKE ALL ON FUNCTION public.enforce_participant_rules() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.enforce_campaign_rules()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.dm_id IS DISTINCT FROM OLD.dm_id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'immutable_campaign_identity' USING ERRCODE = '23514';
  END IF;
  IF NEW.max_players < (SELECT count(*) FROM public.participants WHERE campaign_id = OLD.id AND status = 'accepted') THEN
    RAISE EXCEPTION 'party_size_below_accepted_count' USING ERRCODE = '23514';
  END IF;
  IF OLD.status IN ('completed', 'cancelled') AND NEW.status NOT IN (OLD.status, 'open') THEN
    RAISE EXCEPTION 'reopen_campaign_before_starting' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS campaign_integrity ON public.campaigns;
CREATE TRIGGER campaign_integrity BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.enforce_campaign_rules();
REVOKE ALL ON FUNCTION public.enforce_campaign_rules() FROM PUBLIC, anon, authenticated;

-- New reviews require actual accepted participation; existing authors retain edit/delete rights.
DROP POLICY IF EXISTS "Authenticated users can create reviews (not own campaign)" ON public.reviews;
DROP POLICY IF EXISTS "Accepted players can review" ON public.reviews;
CREATE POLICY "Accepted players can review" ON public.reviews FOR INSERT TO authenticated WITH CHECK (
  author_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.participants p WHERE p.campaign_id = reviews.campaign_id AND p.user_id = (SELECT auth.uid()) AND p.status = 'accepted'
  ) AND EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = reviews.campaign_id AND c.dm_id <> (SELECT auth.uid()))
);
CREATE OR REPLACE FUNCTION public.enforce_review_identity()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.author_id IS DISTINCT FROM OLD.author_id OR NEW.campaign_id IS DISTINCT FROM OLD.campaign_id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'immutable_review_identity' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS review_identity ON public.reviews;
CREATE TRIGGER review_identity BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.enforce_review_identity();
REVOKE ALL ON FUNCTION public.enforce_review_identity() FROM PUBLIC, anon, authenticated;

-- NOT VALID preserves historical rows, while all new/updated rows must satisfy these rules.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_content_bounds' AND conrelid = 'public.campaigns'::regclass) THEN
    ALTER TABLE public.campaigns ADD CONSTRAINT campaign_content_bounds CHECK (
      char_length(btrim(title)) BETWEEN 3 AND 100 AND char_length(btrim(description)) BETWEEN 20 AND 20000
      AND char_length(system) BETWEEN 1 AND 80 AND (schedule IS NULL OR char_length(schedule) <= 200)
    ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'review_content_bounds' AND conrelid = 'public.reviews'::regclass) THEN
    ALTER TABLE public.reviews ADD CONSTRAINT review_content_bounds CHECK (char_length(btrim(comment)) BETWEEN 1 AND 2000) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profile_content_bounds' AND conrelid = 'public.profiles'::regclass) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profile_content_bounds CHECK (char_length(btrim(username)) BETWEEN 3 AND 20 AND (bio IS NULL OR char_length(bio) <= 300)) NOT VALID;
  END IF;
END $$;

-- Restrict the private column itself, not just its appearance in the frontend.
-- The NULL view column preserves the original view shape for existing clients, without leaking invites.
REVOKE SELECT ON public.campaigns FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, title, description, type, system, max_players, dm_id, status, cover_url, schedule, created_at, updated_at) ON public.campaigns TO anon, authenticated;
CREATE OR REPLACE VIEW public.campaigns_with_stats WITH (security_invoker = true) AS
SELECT c.id, c.title, c.description, c.type, c.system, c.max_players, c.dm_id, c.status,
  c.cover_url, NULL::text AS discord_url, c.schedule, c.created_at, c.updated_at,
  COALESCE(r.avg_rating, 0)::numeric(3,1) AS avg_rating,
  COALESCE(r.review_count, 0)::integer AS review_count,
  COALESCE(p.player_count, 0)::integer AS player_count,
  GREATEST(0, c.max_players - COALESCE(p.player_count, 0))::integer AS available_seats
FROM public.campaigns c
LEFT JOIN LATERAL (SELECT avg(rating) AS avg_rating, count(*) AS review_count FROM public.reviews WHERE campaign_id = c.id) r ON true
LEFT JOIN LATERAL (SELECT count(*) AS player_count FROM public.participants WHERE campaign_id = c.id AND status = 'accepted') p ON true;
GRANT SELECT ON public.campaigns_with_stats TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_campaign_discord(target_campaign uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.campaigns c WHERE c.id = target_campaign AND (
      c.dm_id = auth.uid() OR EXISTS (SELECT 1 FROM public.participants p WHERE p.campaign_id = c.id AND p.user_id = auth.uid() AND p.status = 'accepted')
    )
  ) THEN RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501'; END IF;
  RETURN (SELECT discord_url FROM public.campaigns WHERE id = target_campaign);
END;
$$;
REVOKE ALL ON FUNCTION public.get_campaign_discord(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_campaign_discord(uuid) TO authenticated;

-- Pin the search path on the existing auth trigger as well.
ALTER FUNCTION public.handle_new_user() SET search_path = public;
CREATE INDEX IF NOT EXISTS idx_campaigns_created_id ON public.campaigns(created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_participants_pending_campaign ON public.participants(campaign_id, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_participants_accepted_campaign ON public.participants(campaign_id) WHERE status = 'accepted';
-- DELETE realtime events carry only primary keys. The client handles these conservatively.
-- Participant DELETE events bypass row visibility checks in hosted Realtime. Their composite
-- key identifies the applicant. Publish an aggregate signal instead of participant rows.
CREATE TABLE IF NOT EXISTS public.campaign_activity (
  campaign_id uuid PRIMARY KEY REFERENCES public.campaigns(id) ON DELETE CASCADE,
  revision bigint NOT NULL DEFAULT 1
);
ALTER TABLE public.campaign_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Campaign activity is public" ON public.campaign_activity;
CREATE POLICY "Campaign activity is public" ON public.campaign_activity FOR SELECT USING (true);
REVOKE ALL ON public.campaign_activity FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.campaign_activity TO anon, authenticated;
CREATE OR REPLACE FUNCTION public.signal_campaign_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE target uuid;
BEGIN
  target := CASE WHEN TG_OP = 'DELETE' THEN OLD.campaign_id ELSE NEW.campaign_id END;
  -- During campaign cascade deletion the parent can already be gone.
  IF EXISTS (SELECT 1 FROM public.campaigns WHERE id = target) THEN
    INSERT INTO public.campaign_activity AS activity (campaign_id) VALUES (target)
      ON CONFLICT (campaign_id) DO UPDATE SET revision = activity.revision + 1;
  END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS participant_activity ON public.participants;
CREATE TRIGGER participant_activity AFTER INSERT OR UPDATE OR DELETE ON public.participants
  FOR EACH ROW EXECUTE FUNCTION public.signal_campaign_activity();
REVOKE ALL ON FUNCTION public.signal_campaign_activity() FROM PUBLIC, anon, authenticated;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'participants') THEN
      ALTER PUBLICATION supabase_realtime DROP TABLE public.participants;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'campaign_activity') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_activity;
    END IF;
  END IF;
END $$;
NOTIFY pgrst, 'reload schema';
COMMIT;
