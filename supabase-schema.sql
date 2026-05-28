-- =============================================
-- QUINIELA MUNDIAL 2026 - Schema de Supabase
-- Ejecuta esto en el SQL Editor de Supabase
-- =============================================

-- 1. Tabla de perfiles (extiende auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  is_admin boolean default false,
  quota_amount decimal(10,2) default 0,
  quota_paid boolean default false,
  created_at timestamptz default now()
);

-- 2. Partidos
create table if not exists public.matches (
  id serial primary key,
  home_team text not null,
  away_team text not null,
  phase text not null default 'groups',
  match_date timestamptz,
  home_score integer,
  away_score integer,
  status text default 'pending',
  group_name text,
  created_at timestamptz default now()
);

-- 3. Pronósticos por partido
create table if not exists public.predictions (
  id serial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  match_id integer references public.matches(id) on delete cascade,
  predicted_home integer not null,
  predicted_away integer not null,
  points_earned integer default 0,
  created_at timestamptz default now(),
  unique(user_id, match_id)
);

-- 4. Pronósticos especiales (uno por usuario)
create table if not exists public.special_predictions (
  id serial primary key,
  user_id uuid references public.profiles(id) on delete cascade unique,
  champion text,
  runner_up text,
  top_scorer text,
  revelation_player text,
  revelation_team text,
  champion_points integer default 0,
  runner_up_points integer default 0,
  top_scorer_points integer default 0,
  revelation_player_points integer default 0,
  revelation_team_points integer default 0,
  created_at timestamptz default now()
);

-- 5. Resultados reales especiales
create table if not exists public.special_results (
  id integer primary key default 1,
  champion text,
  runner_up text,
  top_scorer text,
  revelation_player text,
  revelation_team text,
  updated_at timestamptz default now()
);
insert into public.special_results (id) values (1) on conflict do nothing;

-- 6. Configuración de puntuación
create table if not exists public.scoring_config (
  id integer primary key default 1,
  exact_score_points integer default 2,
  correct_winner_points integer default 1,
  champion_points integer default 10,
  runner_up_points integer default 5,
  top_scorer_points integer default 5,
  revelation_player_points integer default 5,
  revelation_team_points integer default 5
);
insert into public.scoring_config (id) values (1) on conflict do nothing;

-- 7. Fechas límite por fase
create table if not exists public.phase_deadlines (
  phase text primary key,
  deadline timestamptz,
  is_locked boolean default false
);
insert into public.phase_deadlines (phase, is_locked) values
  ('groups', false),
  ('round_of_16', false),
  ('quarterfinals', false),
  ('semifinals', false),
  ('final', false)
on conflict do nothing;

-- =============================================
-- Row Level Security (RLS)
-- =============================================

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.special_predictions enable row level security;
alter table public.special_results enable row level security;
alter table public.scoring_config enable row level security;
alter table public.phase_deadlines enable row level security;

-- Profiles
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;
drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select using (auth.role() = 'authenticated');
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Admins can update any profile"
  on public.profiles for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
create policy "Admins can delete profiles"
  on public.profiles for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Matches
drop policy if exists "Matches viewable by authenticated" on public.matches;
drop policy if exists "Admins manage matches" on public.matches;
create policy "Matches viewable by authenticated"
  on public.matches for select using (auth.role() = 'authenticated');
create policy "Admins manage matches"
  on public.matches for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Predictions
drop policy if exists "Predictions viewable by authenticated" on public.predictions;
drop policy if exists "Users manage their own predictions" on public.predictions;
drop policy if exists "Users update their own predictions" on public.predictions;
drop policy if exists "Admins update prediction points" on public.predictions;
create policy "Predictions viewable by authenticated"
  on public.predictions for select using (auth.role() = 'authenticated');
create policy "Users manage their own predictions"
  on public.predictions for insert with check (auth.uid() = user_id);
create policy "Users update their own predictions"
  on public.predictions for update using (auth.uid() = user_id);
create policy "Admins update prediction points"
  on public.predictions for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Special predictions
drop policy if exists "Special predictions viewable by authenticated" on public.special_predictions;
drop policy if exists "Users manage their special predictions" on public.special_predictions;
drop policy if exists "Users update their special predictions" on public.special_predictions;
drop policy if exists "Admins update special prediction points" on public.special_predictions;
create policy "Special predictions viewable by authenticated"
  on public.special_predictions for select using (auth.role() = 'authenticated');
create policy "Users manage their special predictions"
  on public.special_predictions for insert with check (auth.uid() = user_id);
create policy "Users update their special predictions"
  on public.special_predictions for update using (auth.uid() = user_id);
create policy "Admins update special prediction points"
  on public.special_predictions for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Special results
drop policy if exists "Special results viewable by authenticated" on public.special_results;
drop policy if exists "Admins manage special results" on public.special_results;
create policy "Special results viewable by authenticated"
  on public.special_results for select using (auth.role() = 'authenticated');
create policy "Admins manage special results"
  on public.special_results for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Scoring config
drop policy if exists "Scoring config viewable by authenticated" on public.scoring_config;
drop policy if exists "Admins manage scoring config" on public.scoring_config;
create policy "Scoring config viewable by authenticated"
  on public.scoring_config for select using (auth.role() = 'authenticated');
create policy "Admins manage scoring config"
  on public.scoring_config for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Phase deadlines
drop policy if exists "Phase deadlines viewable by authenticated" on public.phase_deadlines;
drop policy if exists "Admins manage phase deadlines" on public.phase_deadlines;
create policy "Phase deadlines viewable by authenticated"
  on public.phase_deadlines for select using (auth.role() = 'authenticated');
create policy "Admins manage phase deadlines"
  on public.phase_deadlines for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
