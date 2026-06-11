-- Database schema for Bilingual Reader feature

CREATE TABLE IF NOT EXISTS bilingual_articles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id   TEXT NOT NULL,
  title       TEXT NOT NULL,
  title_vi    TEXT DEFAULT '',
  category    TEXT DEFAULT '',
  category_vi TEXT DEFAULT '',
  excerpt     TEXT DEFAULT '',
  excerpt_vi  TEXT DEFAULT '',
  image_url   TEXT DEFAULT '',
  author      TEXT DEFAULT '',
  read_time   TEXT DEFAULT '',
  source_url  TEXT DEFAULT '',
  source_label TEXT DEFAULT '',
  content     JSONB DEFAULT '[]',
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_saved_articles (
  user_id    UUID REFERENCES auth.users(id),
  article_id TEXT NOT NULL,
  source_id  TEXT,
  saved_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, article_id)
);

-- user_notebook already exists in the project
-- notebook_folders already exists in the project
