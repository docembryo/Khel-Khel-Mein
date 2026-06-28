-- Khel Kel Main — run this once in Supabase → SQL Editor.

create table if not exists kkm_players (
  id text primary key,
  pool text not null,
  name text not null,
  pin_hash text not null,
  created_at timestamptz default now()
);

create table if not exists kkm_predictions (
  pool text not null,
  player_id text not null,
  match_id text not null,
  home int not null,
  away int not null,
  ph int,
  pa int,
  updated_at timestamptz default now(),
  primary key (pool, player_id, match_id)
);

create table if not exists kkm_results (
  pool text not null,
  match_id text not null,
  home int not null,
  away int not null,
  ph int,
  pa int,
  updated_at timestamptz default now(),
  primary key (pool, match_id)
);

create table if not exists kkm_knockouts (
  id text primary key,
  pool text not null,
  round text not null,
  home text not null,
  away text not null,
  ko bigint not null default 0,
  created_at timestamptz default now()
);

alter table kkm_players     enable row level security;
alter table kkm_predictions enable row level security;
alter table kkm_results     enable row level security;
alter table kkm_knockouts   enable row level security;

-- Friends'-pool policies: the anon key may read/write the game tables.
-- (The PIN check + the app UI enforce "edit only your own row" client-side.)
create policy "anon players"     on kkm_players     for all to anon using (true) with check (true);
create policy "anon predictions" on kkm_predictions for all to anon using (true) with check (true);
create policy "anon results"     on kkm_results     for all to anon using (true) with check (true);
create policy "anon knockouts"   on kkm_knockouts   for all to anon using (true) with check (true);

-- Live updates so everyone's leaderboard refreshes in real time.
alter publication supabase_realtime add table kkm_players, kkm_predictions, kkm_results, kkm_knockouts;
