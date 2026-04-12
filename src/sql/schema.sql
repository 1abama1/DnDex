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
--   Включи Realtime для: participants, campaigns, reviews

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
-- 8. STORAGE BUCKET (для обложек кампаний)
-- Выполни отдельно или через UI → Storage
-- =============================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-covers', 'campaign-covers', true);

-- CREATE POLICY "Anyone can view campaign covers"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'campaign-covers');

-- CREATE POLICY "Authenticated users can upload covers"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'campaign-covers' AND auth.role() = 'authenticated');

-- CREATE POLICY "DM can update own campaign cover"
--   ON storage.objects FOR UPDATE
--   USING (bucket_id = 'campaign-covers');

-- CREATE POLICY "DM can delete own campaign cover"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'campaign-covers');
