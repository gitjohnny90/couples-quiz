-- ===========================================
-- "Do We Even Know Each Other?" Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ===========================================

-- 1. SESSIONS TABLE
-- Stores each quiz session (one per couple)
create table sessions (
  id uuid default gen_random_uuid() primary key,
  player1_name text not null,
  player2_name text,
  created_at timestamp with time zone default now()
);

-- 2. RESPONSES TABLE
-- Stores each player's answers for a specific quiz pack
create table responses (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade not null,
  pack_id text not null,
  player_id text not null,         -- 'player1' or 'player2'
  player_name text not null,
  answers jsonb not null default '{}',
  created_at timestamp with time zone default now(),
  -- Each player can only answer each pack once per session
  unique(session_id, pack_id, player_id)
);

-- 3. PROFILES TABLE
-- Stores personality test results for each player
create table profiles (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade not null,
  player_id text not null,         -- 'player1' or 'player2'
  player_name text not null,
  profile_data jsonb not null default '{}',
  updated_at timestamp with time zone default now(),
  -- Each player has one profile per session
  unique(session_id, player_id)
);

-- 4. ENABLE ROW LEVEL SECURITY
-- (Required by Supabase, but we'll allow all access since there's no auth)
alter table sessions enable row level security;
alter table responses enable row level security;
alter table profiles enable row level security;

-- 5. POLICIES (allow all operations for anonymous users)
-- Sessions
create policy "Allow all access to sessions" on sessions
  for all using (true) with check (true);

-- Responses
create policy "Allow all access to responses" on responses
  for all using (true) with check (true);

-- Profiles
create policy "Allow all access to profiles" on profiles
  for all using (true) with check (true);

-- 6. ENABLE REALTIME (so the waiting screen auto-updates)
alter publication supabase_realtime add table responses;
alter publication supabase_realtime add table profiles;
