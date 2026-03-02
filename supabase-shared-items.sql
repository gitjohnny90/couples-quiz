-- ===========================================
-- Shared Items Table (Movies & Books lists)
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ===========================================

-- SHARED_ITEMS TABLE
-- Stores movies and books that couples add to their shared lists
create table shared_items (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade not null,
  type text not null,              -- 'movie' or 'book'
  title text not null,
  genre text,                      -- optional genre tag
  status text not null default 'want',  -- 'want', 'current', 'finished', 'abandoned'
  added_by text not null,          -- player_id ('player1' or 'player2')
  source text default 'manual',    -- 'manual', 'wheel', 'pick'
  player1_rating integer,          -- 1 to 5 (null = not rated yet)
  player2_rating integer,          -- 1 to 5 (null = not rated yet)
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table shared_items enable row level security;

-- Allow all access (no auth in this app)
create policy "Allow all access to shared_items" on shared_items
  for all using (true) with check (true);

-- Enable realtime so lists update across devices
alter publication supabase_realtime add table shared_items;
