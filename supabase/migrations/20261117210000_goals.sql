create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  goal_type text not null
    check (goal_type in ('exercise_target', 'weekly_workouts')),
  title text not null
    check (char_length(btrim(title)) between 1 and 120),
  exercise_name text
    check (
      exercise_name is null
      or char_length(btrim(exercise_name)) between 1 and 120
    ),
  target_weight_kg numeric(7, 2)
    check (target_weight_kg is null or target_weight_kg between 0.01 and 99999.99),
  target_reps integer
    check (target_reps is null or target_reps > 0),
  target_workouts integer
    check (target_workouts is null or target_workouts > 0),
  target_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (
      goal_type = 'exercise_target'
      and exercise_name is not null
      and (target_weight_kg is not null or target_reps is not null)
      and target_workouts is null
    )
    or (
      goal_type = 'weekly_workouts'
      and target_workouts is not null
      and exercise_name is null
      and target_weight_kg is null
      and target_reps is null
    )
  )
);

create index goals_user_created_idx
  on public.goals (user_id, created_at desc);

create index goals_weekly_target_idx
  on public.goals (user_id, target_date)
  where goal_type = 'weekly_workouts' and completed_at is null;

revoke all on table public.goals from public, anon, authenticated;
grant select, insert, update, delete on public.goals to authenticated;

alter table public.goals enable row level security;

create policy goals_owner_access
  on public.goals for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
