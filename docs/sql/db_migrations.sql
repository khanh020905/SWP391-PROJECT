-- 1. Create speaking_topics table
CREATE TABLE IF NOT EXISTS public.speaking_topics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part        INTEGER NOT NULL CHECK (part IN (1, 2, 3)),
  topic       TEXT NOT NULL,
  questions   JSONB NOT NULL,
  band_target NUMERIC(2,1),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for speaking_topics
ALTER TABLE public.speaking_topics ENABLE ROW LEVEL SECURITY;

-- Allow public read access to speaking_topics
CREATE POLICY "Allow public read access to speaking_topics" 
  ON public.speaking_topics FOR SELECT 
  USING (true);

-- Insert sample speaking data matching the existing hardcoded data
INSERT INTO public.speaking_topics (part, topic, questions, band_target) VALUES
(1, 'Daily Life', '["Do you enjoy studying English? Why or why not?", "What do you usually do in your free time?", "How important is English in your daily life or work?"]', 5.0),
(2, 'Places', '{"cue_card": "Describe a place you have always wanted to visit.", "bullet_points": ["Where it is", "Why you want to go there", "What you would do there", "How you feel about visiting this place"]}', 5.5),
(3, 'Education', '["How has education changed in recent years?", "What role should technology play in education?"]', 6.0);

-- 2. Create diagnostic_questions table
CREATE TABLE IF NOT EXISTS public.diagnostic_questions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill            TEXT NOT NULL CHECK (skill IN ('listening', 'reading', 'writing', 'speaking')),
  question_order   INTEGER NOT NULL,
  source_table     TEXT NOT NULL,
  source_id        UUID NOT NULL,
  section_index    INTEGER,
  question_indices JSONB,
  extra_data       JSONB,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for diagnostic_questions
ALTER TABLE public.diagnostic_questions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to diagnostic_questions
CREATE POLICY "Allow public read access to diagnostic_questions" 
  ON public.diagnostic_questions FOR SELECT 
  USING (true);

-- 3. Create speaking_sessions table if not exists (checked in existing tables or dynamic test results schema)
CREATE TABLE IF NOT EXISTS public.speaking_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mode          TEXT NOT NULL,
  topic_id      UUID,
  transcript    TEXT,
  fc_score      NUMERIC(3,1),
  lr_score      NUMERIC(3,1),
  gra_score     NUMERIC(3,1),
  p_score       NUMERIC(3,1),
  overall_band  NUMERIC(3,1),
  wpm           INTEGER,
  filler_count  INTEGER,
  feedback_json JSONB,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for speaking_sessions
ALTER TABLE public.speaking_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own speaking sessions
CREATE POLICY "Users can manage their own speaking sessions"
  ON public.speaking_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
