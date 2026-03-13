-- Waitlist table for App Store email capture
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  source text,
  created_at timestamptz DEFAULT now()
);

-- RLS: insert-only, no read/update/delete from client
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert into waitlist"
  ON waitlist FOR INSERT
  WITH CHECK (true);

-- No SELECT/UPDATE/DELETE policies = no client-side read access
-- Data is only readable from Supabase Dashboard or service role key
