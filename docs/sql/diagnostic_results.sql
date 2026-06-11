-- Run this SQL in your Supabase SQL Editor to create the diagnostic_results table

CREATE TABLE IF NOT EXISTS public.diagnostic_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  overall_band DECIMAL(2,1),
  listening_band DECIMAL(2,1),
  reading_band DECIMAL(2,1),
  writing_band DECIMAL(2,1),
  speaking_band DECIMAL(2,1),
  full_result JSONB,  -- Detailed JSON from Claude API
  answers JSONB,      -- Student's original answers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.diagnostic_results ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
CREATE POLICY "Users can view their own diagnostic results" 
  ON public.diagnostic_results FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diagnostic results" 
  ON public.diagnostic_results FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
