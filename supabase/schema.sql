-- ChessPath — initial Supabase schema
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query)

-- Beta testers / users (Supabase auth.users already handles login;
-- this table holds ChessPath-specific profile data)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  created_at timestamptz default now()
);

-- Diagnostic test results
create table if not exists diagnostic_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  tier text not null,               -- e.g. 'Complete Beginner', 'Intermediate'
  score_tactics numeric,
  score_endgames numeric,
  score_positional numeric,
  score_rules numeric,
  raw_answers jsonb,
  created_at timestamptz default now()
);

-- Skill tree progress
create table if not exists progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  node_key text not null,           -- e.g. 'tier1_pin', 'tier1_fork'
  status text not null default 'locked',  -- locked | in_progress | mastered
  updated_at timestamptz default now(),
  unique (user_id, node_key)
);

-- Puzzle attempts (for spaced repetition + puzzle rating later)
create table if not exists puzzle_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  puzzle_id text not null,          -- Lichess puzzle DB id
  motif text,
  correct boolean,
  time_ms integer,
  created_at timestamptz default now()
);

-- Basic row-level security so testers only see their own data
alter table profiles enable row level security;
alter table diagnostic_results enable row level security;
alter table progress enable row level security;
alter table puzzle_attempts enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own diagnostic results" on diagnostic_results for all using (auth.uid() = user_id);
create policy "own progress" on progress for all using (auth.uid() = user_id);
create policy "own puzzle attempts" on puzzle_attempts for all using (auth.uid() = user_id);

-- Added later: feedback + spaced repetition scheduling
create table if not exists feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete set null,
  message text not null,
  page text,
  created_at timestamptz default now()
);
alter table feedback enable row level security;
create policy "anyone signed in can submit feedback" on feedback for insert with check (true);
create policy "own feedback readable" on feedback for select using (auth.uid() = user_id);

alter table puzzle_attempts add column if not exists next_review_at timestamptz default now();
alter table puzzle_attempts add column if not exists interval_days integer default 1;
alter table puzzle_attempts add column if not exists ease numeric default 2.3;

-- Added later: Lichess puzzle import target table
create table if not exists imported_puzzles (
  id text primary key,
  motif text not null,
  fen text not null,
  solution_squares text[] not null,
  rating integer,
  source text default 'lichess',
  created_at timestamptz default now()
);
alter table imported_puzzles enable row level security;
create policy "puzzles readable by all" on imported_puzzles for select using (true);
