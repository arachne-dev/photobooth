-- Create style_analyses table
CREATE TABLE IF NOT EXISTS public.style_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  image_url TEXT NOT NULL,
  tags TEXT[] NOT NULL,
  vogue_description TEXT NOT NULL,
  style_dna JSONB NOT NULL,
  timestamp TEXT NOT NULL,
  tpo TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.style_analyses ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read
CREATE POLICY "Allow public read access" ON public.style_analyses
  FOR SELECT
  USING (true);

-- Create a policy that allows anyone to insert
CREATE POLICY "Allow public insert access" ON public.style_analyses
  FOR INSERT
  WITH CHECK (true);

-- Create an index on created_at for faster queries
CREATE INDEX IF NOT EXISTS style_analyses_created_at_idx ON public.style_analyses(created_at DESC);
