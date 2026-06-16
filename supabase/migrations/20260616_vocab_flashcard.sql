-- Migration for Flashcard and Vocabulary Notebook feature
-- Copied from bo-tu-feature-docs.md

-- 1. notebook_folders
CREATE TABLE IF NOT EXISTS notebook_folders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notebook_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_notebook_folders" ON notebook_folders USING (auth.uid() = user_id);

-- 2. user_notebook
CREATE TABLE IF NOT EXISTS user_notebook (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word             TEXT NOT NULL,                          -- always lowercased
  definition       TEXT,
  example          TEXT,
  source           TEXT DEFAULT 'flashcard',              -- 'flashcard' | 'import' | 'notebook'
  pos              TEXT,                                  -- part of speech
  category         TEXT,
  frequency        INTEGER,
  folder_id        UUID REFERENCES notebook_folders(id) ON DELETE SET NULL,

  -- SRS columns
  ease_factor      NUMERIC DEFAULT 2.5,
  interval_days    INTEGER DEFAULT 0,
  review_count     INTEGER DEFAULT 0,
  next_review_at   TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,

  created_at       TIMESTAMPTZ DEFAULT now(),

  UNIQUE (user_id, word)
);

ALTER TABLE user_notebook ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_user_notebook" ON user_notebook USING (auth.uid() = user_id);

-- 3. topic_word_reviews
CREATE TABLE IF NOT EXISTS topic_word_reviews (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  set_ref          TEXT NOT NULL,   -- topic index (string) or folder UUID
  word             TEXT NOT NULL,
  ease_factor      NUMERIC DEFAULT 2.5,
  interval_days    INTEGER DEFAULT 0,
  review_count     INTEGER DEFAULT 0,
  next_review_at   TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,

  UNIQUE (user_id, set_ref, word)
);

ALTER TABLE topic_word_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_topic_word_reviews" ON topic_word_reviews USING (auth.uid() = user_id);

-- 4. vocab_set_reviews
CREATE TABLE IF NOT EXISTS vocab_set_reviews (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  set_type         TEXT NOT NULL CHECK (set_type IN ('topic', 'folder')),
  set_ref          TEXT NOT NULL,   -- topic index or folder UUID
  set_name         TEXT,            -- display name for email
  studied_at       TIMESTAMPTZ DEFAULT now(),
  stage            INTEGER DEFAULT 0,          -- 0, 1, 2
  next_due         TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  dismissed        BOOLEAN DEFAULT false,

  UNIQUE (user_id, set_type, set_ref)
);

ALTER TABLE vocab_set_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_vocab_set_reviews" ON vocab_set_reviews USING (auth.uid() = user_id);

-- 5. reminder_logs
CREATE TABLE IF NOT EXISTS reminder_logs (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at  TIMESTAMPTZ DEFAULT now(),
  reacted  BOOLEAN DEFAULT false
);

-- 6. profiles table updates
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ignored_reminders   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reminder_paused     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_enabled    BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS reactivation_stage  INTEGER DEFAULT 0;
