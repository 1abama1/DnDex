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
