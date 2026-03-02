-- ===========================================
-- Deep Dive Responses Table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ===========================================

create table deep_dive_responses (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade not null,
  deck_id text not null,
  question_id text not null,
  player_id text not null,
  player_name text not null,
  answer text not null,
  is_fired boolean not null default false,
  created_at timestamp with time zone default now(),
  unique(session_id, deck_id, question_id, player_id)
);

-- Enable RLS
alter table deep_dive_responses enable row level security;

-- Allow all access (no auth in this app)
create policy "Allow all access to deep_dive_responses" on deep_dive_responses
  for all using (true) with check (true);

-- Enable realtime for per-question reveal
alter publication supabase_realtime add table deep_dive_responses;
