-- IRONMAN strength-training schema proposal.
-- Requires PostgreSQL 15+ for column-specific ON DELETE SET NULL.

create table public.profiles (
  id uuid primary key default auth.uid()
    references auth.users (id) on delete cascade,
  display_name text
    check (
      display_name is null
      or char_length(btrim(display_name)) between 1 and 80
    ),
  created_at timestamptz not null default now()
);

create table public.training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  name text not null
    check (char_length(btrim(name)) between 1 and 120),
  starts_on date not null,
  ends_on date,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  check (ends_on is null or ends_on >= starts_on)
);

create index training_plans_user_idx
  on public.training_plans (user_id);

create unique index training_plans_one_active_per_user_idx
  on public.training_plans (user_id)
  where is_active;

create table public.planned_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  training_plan_id uuid not null,
  scheduled_for date not null,
  week_number integer not null check (week_number > 0),
  day_number smallint not null check (day_number between 1 and 7),
  title text not null
    check (char_length(btrim(title)) between 1 and 120),
  notes text check (notes is null or char_length(notes) <= 5000),
  target_duration_seconds integer
    check (
      target_duration_seconds is null
      or target_duration_seconds > 0
    ),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (training_plan_id, user_id)
    references public.training_plans (id, user_id)
    on delete cascade
);

create index planned_workouts_plan_owner_idx
  on public.planned_workouts (training_plan_id, user_id);

create index planned_workouts_user_date_idx
  on public.planned_workouts (user_id, scheduled_for);

create table public.planned_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  planned_workout_id uuid not null,
  name text not null
    check (char_length(btrim(name)) between 1 and 120),
  position integer not null check (position > 0),
  target_sets integer check (target_sets is null or target_sets > 0),
  target_reps integer check (target_reps is null or target_reps > 0),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (planned_workout_id, position),
  foreign key (planned_workout_id, user_id)
    references public.planned_workouts (id, user_id)
    on delete cascade
);

create index planned_exercises_user_workout_idx
  on public.planned_exercises (user_id, planned_workout_id);

create unique index planned_exercises_name_per_workout_ci_idx
  on public.planned_exercises (
    planned_workout_id,
    lower(btrim(name))
  );

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  planned_workout_id uuid,
  title text not null
    check (char_length(btrim(title)) between 1 and 120),
  notes text check (notes is null or char_length(notes) <= 5000),
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (planned_workout_id, user_id)
    references public.planned_workouts (id, user_id)
    on delete set null (planned_workout_id)
    deferrable initially deferred,
  check (
    (status = 'in_progress' and completed_at is null)
    or (
      status = 'completed'
      and completed_at is not null
      and completed_at >= started_at
    )
  )
);

create index workouts_user_started_idx
  on public.workouts (user_id, started_at desc);

create index workouts_user_completed_idx
  on public.workouts (user_id, completed_at desc)
  where status = 'completed';

create index workouts_planned_workout_idx
  on public.workouts (planned_workout_id, user_id)
  where planned_workout_id is not null;

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  workout_id uuid not null,
  name text not null
    check (char_length(btrim(name)) between 1 and 120),
  position integer not null check (position > 0),
  target_sets integer check (target_sets is null or target_sets > 0),
  target_reps integer check (target_reps is null or target_reps > 0),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (workout_id, position),
  foreign key (workout_id, user_id)
    references public.workouts (id, user_id)
    on delete cascade
);

create index exercises_user_workout_idx
  on public.exercises (user_id, workout_id);

create unique index exercises_name_per_workout_ci_idx
  on public.exercises (workout_id, lower(btrim(name)));

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  exercise_id uuid not null,
  set_number integer not null check (set_number > 0),
  reps integer not null check (reps > 0),
  weight_kg numeric(7, 2) not null
    check (weight_kg >= 0 and weight_kg <= 99999.99),
  completed_at timestamptz not null,
  unique (id, user_id),
  unique (exercise_id, set_number),
  foreign key (exercise_id, user_id)
    references public.exercises (id, user_id)
    on delete cascade
);

create or replace function public.set_workout_set_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.completed_at := clock_timestamp();
  elsif new.completed_at is distinct from old.completed_at then
    raise exception 'Workout set completion timestamps cannot be changed.';
  end if;

  return new;
end;
$$;

create trigger workout_sets_completed_at_guard
  before insert or update on public.workout_sets
  for each row
  execute function public.set_workout_set_completed_at();

revoke all on function public.set_workout_set_completed_at()
  from public, anon, authenticated;

create index workout_sets_user_exercise_idx
  on public.workout_sets (user_id, exercise_id);

create table public.training_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  week_start date not null
    check (extract(isodow from week_start) = 1),
  target_workouts integer
    check (target_workouts is null or target_workouts > 0),
  target_duration_seconds integer
    check (target_duration_seconds is null or target_duration_seconds > 0),
  target_volume_kg numeric(12, 2)
    check (
      target_volume_kg is null
      or (
        target_volume_kg > 0
        and target_volume_kg <= 9999999999.99
      )
    ),
  created_at timestamptz not null default now(),
  unique (user_id, week_start),
  check (
    target_workouts is not null
    or target_duration_seconds is not null
    or target_volume_kg is not null
  )
);

create table public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  workout_id uuid,
  is_set_verified boolean
    generated always as (workout_id is not null) stored,
  exercise_name text not null
    check (char_length(btrim(exercise_name)) between 1 and 120),
  weight_kg numeric(7, 2) not null
    check (weight_kg > 0 and weight_kg <= 99999.99),
  reps integer not null check (reps > 0),
  estimated_1rm_kg numeric(16, 2)
    generated always as (
      round(weight_kg * (1 + reps::numeric / 30), 2)
    ) stored,
  achieved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  foreign key (workout_id, user_id)
    references public.workouts (id, user_id)
    on delete set null (workout_id)
);

create index personal_records_user_achieved_idx
  on public.personal_records (user_id, achieved_at desc);

create index personal_records_workout_owner_idx
  on public.personal_records (workout_id, user_id)
  where workout_id is not null;

create index personal_records_user_exercise_ci_idx
  on public.personal_records (user_id, lower(btrim(exercise_name)));

comment on column public.personal_records.is_set_verified is
  'Indicates a workout-linked set match, not an all-time personal best.';

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

alter function public.create_profile_for_new_user() owner to postgres;

create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row
  execute function public.create_profile_for_new_user();

revoke all on function public.create_profile_for_new_user()
  from public, anon, authenticated;

create or replace function public.guard_workout_state()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'in_progress' or new.completed_at is not null then
      raise exception 'New workouts must start in progress.';
    end if;

    return new;
  end if;

  if old.status = 'completed' then
    if old.planned_workout_id is not null
      and new.planned_workout_id is null
      and new.id is not distinct from old.id
      and new.user_id is not distinct from old.user_id
      and new.title is not distinct from old.title
      and new.notes is not distinct from old.notes
      and new.status is not distinct from old.status
      and new.started_at is not distinct from old.started_at
      and new.completed_at is not distinct from old.completed_at
      and new.created_at is not distinct from old.created_at
    then
      return new;
    end if;

    raise exception 'Completed workouts cannot be modified.';
  end if;

  if new.id is distinct from old.id then
    raise exception 'Workout IDs cannot be changed.';
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'Workout ownership cannot be changed.';
  end if;

  if new.status = 'completed' then
    new.completed_at := clock_timestamp();
  else
    new.completed_at := null;
  end if;

  return new;
end;
$$;

create trigger workouts_guard_state
  before insert or update on public.workouts
  for each row
  execute function public.guard_workout_state();

revoke all on function public.guard_workout_state()
  from public, anon, authenticated;

revoke all on table
  public.profiles,
  public.training_plans,
  public.planned_workouts,
  public.planned_exercises,
  public.workouts,
  public.exercises,
  public.workout_sets,
  public.training_goals,
  public.personal_records
from public, anon, authenticated;

grant usage on schema public to authenticated;

grant select
  on public.profiles to authenticated;

grant update (display_name)
  on public.profiles to authenticated;

grant select, insert, update, delete
  on public.training_plans,
     public.planned_workouts,
     public.planned_exercises,
     public.workouts,
     public.exercises,
     public.workout_sets,
     public.training_goals,
     public.personal_records
to authenticated;

revoke update on table public.workout_sets from authenticated;

grant update (exercise_id, set_number, reps, weight_kg)
  on table public.workout_sets to authenticated;

alter table public.profiles enable row level security;
alter table public.training_plans enable row level security;
alter table public.planned_workouts enable row level security;
alter table public.planned_exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_sets enable row level security;
alter table public.training_goals enable row level security;
alter table public.personal_records enable row level security;

create policy profiles_select_own
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy training_plans_owner_access
  on public.training_plans for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy planned_workouts_owner_access
  on public.planned_workouts for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy planned_exercises_owner_access
  on public.planned_exercises for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy workouts_select_own
  on public.workouts for select to authenticated
  using (user_id = (select auth.uid()));

create policy workouts_insert_own_in_progress
  on public.workouts for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'in_progress'
    and completed_at is null
  );

create policy workouts_update_in_progress
  on public.workouts for update to authenticated
  using (
    user_id = (select auth.uid())
    and status = 'in_progress'
  )
  with check (
    user_id = (select auth.uid())
    and status in ('in_progress', 'completed')
  );

create policy workouts_delete_own
  on public.workouts for delete to authenticated
  using (user_id = (select auth.uid()));

create policy exercises_select_own
  on public.exercises for select to authenticated
  using (user_id = (select auth.uid()));

create policy exercises_insert_in_progress
  on public.exercises for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.workouts w
      where w.id = public.exercises.workout_id
        and w.user_id = (select auth.uid())
        and w.status = 'in_progress'
    )
  );

create policy exercises_update_in_progress
  on public.exercises for update to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.workouts w
      where w.id = public.exercises.workout_id
        and w.user_id = (select auth.uid())
        and w.status = 'in_progress'
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.workouts w
      where w.id = public.exercises.workout_id
        and w.user_id = (select auth.uid())
        and w.status = 'in_progress'
    )
  );

create policy exercises_delete_in_progress
  on public.exercises for delete to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.workouts w
      where w.id = public.exercises.workout_id
        and w.user_id = (select auth.uid())
        and w.status = 'in_progress'
    )
  );

create policy workout_sets_select_own
  on public.workout_sets for select to authenticated
  using (user_id = (select auth.uid()));

create policy workout_sets_insert_in_progress
  on public.workout_sets for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.exercises e
      join public.workouts w
        on w.id = e.workout_id
       and w.user_id = e.user_id
      where e.id = public.workout_sets.exercise_id
        and e.user_id = (select auth.uid())
        and w.status = 'in_progress'
    )
  );

create policy workout_sets_update_in_progress
  on public.workout_sets for update to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.exercises e
      join public.workouts w
        on w.id = e.workout_id
       and w.user_id = e.user_id
      where e.id = public.workout_sets.exercise_id
        and e.user_id = (select auth.uid())
        and w.status = 'in_progress'
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.exercises e
      join public.workouts w
        on w.id = e.workout_id
       and w.user_id = e.user_id
      where e.id = public.workout_sets.exercise_id
        and e.user_id = (select auth.uid())
        and w.status = 'in_progress'
    )
  );

create policy workout_sets_delete_in_progress
  on public.workout_sets for delete to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.exercises e
      join public.workouts w
        on w.id = e.workout_id
       and w.user_id = e.user_id
      where e.id = public.workout_sets.exercise_id
        and e.user_id = (select auth.uid())
        and w.status = 'in_progress'
    )
  );

create policy training_goals_owner_access
  on public.training_goals for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy personal_records_select_own
  on public.personal_records for select to authenticated
  using (user_id = (select auth.uid()));

create policy personal_records_insert_own
  on public.personal_records for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      workout_id is null
      or exists (
        select 1
        from public.workouts w
        join public.exercises e
          on e.workout_id = w.id
         and e.user_id = w.user_id
        join public.workout_sets s
          on s.exercise_id = e.id
         and s.user_id = e.user_id
        where w.id = public.personal_records.workout_id
          and w.user_id = (select auth.uid())
          and w.status = 'completed'
          and public.personal_records.achieved_at = s.completed_at
          and lower(btrim(e.name))
            = lower(btrim(public.personal_records.exercise_name))
          and s.weight_kg = public.personal_records.weight_kg
          and s.reps = public.personal_records.reps
      )
    )
  );

create policy personal_records_update_own
  on public.personal_records for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (
      workout_id is null
      or exists (
        select 1
        from public.workouts w
        join public.exercises e
          on e.workout_id = w.id
         and e.user_id = w.user_id
        join public.workout_sets s
          on s.exercise_id = e.id
         and s.user_id = e.user_id
        where w.id = public.personal_records.workout_id
          and w.user_id = (select auth.uid())
          and w.status = 'completed'
          and public.personal_records.achieved_at = s.completed_at
          and lower(btrim(e.name))
            = lower(btrim(public.personal_records.exercise_name))
          and s.weight_kg = public.personal_records.weight_kg
          and s.reps = public.personal_records.reps
      )
    )
  );

create policy personal_records_delete_own
  on public.personal_records for delete to authenticated
  using (user_id = (select auth.uid()));
