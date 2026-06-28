-- ════════════════════════════════════════════════════════════════
--  KNOCKOUT UPDATE — run this ONCE in Supabase → SQL Editor
--  Safe: adds two optional columns to each table. Touches no existing
--  data. Group-stage predictions, results, players, leaderboard all stay.
-- ════════════════════════════════════════════════════════════════

alter table kkm_predictions add column if not exists ph int;
alter table kkm_predictions add column if not exists pa int;
alter table kkm_results     add column if not exists ph int;
alter table kkm_results     add column if not exists pa int;

-- ph / pa hold the penalty-shootout score (home / away).
-- They stay empty for every group match and for any knockout decided
-- in normal or extra time. They are only filled when a tie goes to a
-- shootout (or when someone predicts a draw and enters the pens).
