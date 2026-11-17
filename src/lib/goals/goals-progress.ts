import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type GoalRow = Database["public"]["Tables"]["goals"]["Row"];

type CompletedWorkoutRow = {
  id: string;
  completed_at: string | null;
};

type ExerciseRow = {
  id: string;
  workout_id: string;
  name: string;
};

type SetMetric = {
  reps: number;
  weightKg: number;
};

export type ExerciseGoalProgress = {
  kind: "exercise_target";
  progressPercent: number;
  achieved: boolean;
  bestSet: SetMetric | null;
};

export type WeeklyWorkoutGoalProgress = {
  kind: "weekly_workouts";
  progressPercent: number;
  achieved: boolean;
  completedWorkouts: number;
  targetWorkouts: number;
  weekStart: string;
};

export type ExerciseGoalWithProgress = GoalRow & {
  goal_type: "exercise_target";
  progress: ExerciseGoalProgress;
};

export type WeeklyWorkoutGoalWithProgress = GoalRow & {
  goal_type: "weekly_workouts";
  progress: WeeklyWorkoutGoalProgress;
};

export type GoalWithProgress =
  | ExerciseGoalWithProgress
  | WeeklyWorkoutGoalWithProgress;

export type CurrentWeeklyGoal = {
  title: string;
  targetWorkouts: number;
  completedWorkouts: number;
  progressPercent: number;
};

export type GoalsProgressData = {
  goals: GoalWithProgress[];
  currentWeeklyStreak: number;
  longestWeeklyStreak: number;
  currentActiveDayStreak: number;
  workoutsThisWeek: number;
  currentWeeklyGoal: CurrentWeeklyGoal | null;
};

export type GoalsProgressResult =
  | { data: GoalsProgressData; error?: never }
  | { data: null; error: string };

const PAGE_SIZE = 1000;
const ID_BATCH_SIZE = 100;

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfUtcWeek(date: Date) {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const weekday = start.getUTCDay() || 7;
  start.setUTCDate(start.getUTCDate() - weekday + 1);
  return start;
}

function weekStartForDate(value: string | null, currentWeekStart: Date) {
  return value
    ? startOfUtcWeek(new Date(`${value}T00:00:00Z`))
    : new Date(currentWeekStart);
}

function addDays(date: Date, count: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + count);
  return result;
}

function getWeeklyStreaks(weekKeys: Set<string>, currentWeekStart: Date) {
  const currentWeekKey = dateKey(currentWeekStart);
  const previousWeekKey = dateKey(addDays(currentWeekStart, -7));
  let currentWeeklyStreak = 0;
  let anchor = weekKeys.has(currentWeekKey)
    ? new Date(currentWeekStart)
    : weekKeys.has(previousWeekKey)
      ? addDays(currentWeekStart, -7)
      : null;

  while (anchor && weekKeys.has(dateKey(anchor))) {
    currentWeeklyStreak += 1;
    anchor = addDays(anchor, -7);
  }

  const orderedWeeks = [...weekKeys]
    .map((key) => new Date(`${key}T00:00:00Z`))
    .sort((left, right) => left.getTime() - right.getTime());
  let longestWeeklyStreak = 0;
  let run = 0;
  let previous: Date | null = null;

  for (const week of orderedWeeks) {
    const consecutive =
      previous !== null &&
      week.getTime() - previous.getTime() === 7 * 24 * 60 * 60 * 1000;
    run = consecutive ? run + 1 : 1;
    longestWeeklyStreak = Math.max(longestWeeklyStreak, run);
    previous = week;
  }

  return { currentWeeklyStreak, longestWeeklyStreak };
}

function getCurrentActiveDayStreak(dayKeys: Set<string>, today: Date) {
  const todayKey = dateKey(today);
  const yesterday = addDays(today, -1);
  let anchor = dayKeys.has(todayKey)
    ? new Date(today)
    : dayKeys.has(dateKey(yesterday))
      ? yesterday
      : null;
  let streak = 0;

  while (anchor && dayKeys.has(dateKey(anchor))) {
    streak += 1;
    anchor = addDays(anchor, -1);
  }

  return streak;
}

function calculateExerciseProgress(goal: GoalRow, sets: SetMetric[]): ExerciseGoalProgress {
  let bestSet: SetMetric | null = null;
  let bestProgress = 0;

  for (const set of sets) {
    const ratios = [];
    if (goal.target_weight_kg !== null) {
      ratios.push(set.weightKg / goal.target_weight_kg);
    }
    if (goal.target_reps !== null) {
      ratios.push(set.reps / goal.target_reps);
    }

    const progress = Math.min(...ratios);
    if (progress > bestProgress) {
      bestProgress = progress;
      bestSet = set;
    }
  }

  const progressPercent = Math.min(100, Math.round(bestProgress * 100));
  return {
    kind: "exercise_target",
    progressPercent,
    achieved: progressPercent >= 100,
    bestSet,
  };
}

function calculateWeeklyProgress(
  goal: GoalRow,
  completedWorkouts: number,
  weekStart: string,
): WeeklyWorkoutGoalProgress {
  const targetWorkouts = goal.target_workouts ?? 1;
  return {
    kind: "weekly_workouts",
    progressPercent: Math.min(
      100,
      Math.round((completedWorkouts / targetWorkouts) * 100),
    ),
    achieved: completedWorkouts >= targetWorkouts,
    completedWorkouts,
    targetWorkouts,
    weekStart,
  };
}

export async function getGoalsProgress(
  supabase: SupabaseClient<Database>,
  userId: string,
  now = new Date(),
): Promise<GoalsProgressResult> {
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const currentWeekStart = startOfUtcWeek(today);
  const currentWeekKey = dateKey(currentWeekStart);
  const { data: legacyGoal, error: legacyError } = await supabase
    .from("training_goals")
    .select("week_start, target_workouts")
    .eq("user_id", userId)
    .eq("week_start", currentWeekKey)
    .maybeSingle();
  if (legacyError) {
    return { data: null, error: "Unable to load your weekly workout target." };
  }

  const goals: GoalRow[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      return { data: null, error: "Unable to load your goals." };
    }

    const page = data ?? [];
    goals.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  const completedWorkouts: CompletedWorkoutRow[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("workouts")
      .select("id, completed_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      return { data: null, error: "Unable to load completed workouts for your streaks." };
    }

    const page = data ?? [];
    completedWorkouts.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  const workoutsByWeek = new Map<string, number>();
  const workoutDays = new Set<string>();
  const activeWeeks = new Set<string>();
  for (const workout of completedWorkouts) {
    if (!workout.completed_at) continue;
    const completedAt = new Date(workout.completed_at);
    const day = dateKey(completedAt);
    const week = dateKey(startOfUtcWeek(completedAt));
    workoutDays.add(day);
    activeWeeks.add(week);
    workoutsByWeek.set(week, (workoutsByWeek.get(week) ?? 0) + 1);
  }

  const exerciseGoals = goals.filter((goal) => goal.goal_type === "exercise_target");
  const requestedExerciseNames = new Set(
    exerciseGoals.map((goal) => goal.exercise_name?.trim().toLowerCase() ?? ""),
  );
  const exercises: ExerciseRow[] = [];
  const completedWorkoutIds = exerciseGoals.length
    ? completedWorkouts.map((workout) => workout.id)
    : [];
  for (let batchStart = 0; batchStart < completedWorkoutIds.length; batchStart += ID_BATCH_SIZE) {
    const workoutIdBatch = completedWorkoutIds.slice(
      batchStart,
      batchStart + ID_BATCH_SIZE,
    );
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("exercises")
        .select("id, workout_id, name")
        .eq("user_id", userId)
        .in("workout_id", workoutIdBatch)
        .order("id", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        return { data: null, error: "Unable to load exercise goal progress." };
      }

      const page = data ?? [];
      exercises.push(...page);
      if (page.length < PAGE_SIZE) break;
    }
  }

  const matchingExercises = exercises.filter((exercise) =>
    requestedExerciseNames.has(exercise.name.trim().toLowerCase()),
  );
  const exerciseNameById = new Map(
    matchingExercises.map((exercise) => [
      exercise.id,
      exercise.name.trim().toLowerCase(),
    ]),
  );
  const setsByExerciseName = new Map<string, SetMetric[]>();
  const exerciseIds = matchingExercises.map((exercise) => exercise.id);

  for (let batchStart = 0; batchStart < exerciseIds.length; batchStart += ID_BATCH_SIZE) {
    const exerciseIdBatch = exerciseIds.slice(batchStart, batchStart + ID_BATCH_SIZE);
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("workout_sets")
        .select("exercise_id, reps, weight_kg")
        .eq("user_id", userId)
        .in("exercise_id", exerciseIdBatch)
        .order("exercise_id", { ascending: true })
        .order("set_number", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        return { data: null, error: "Unable to load strength goal progress." };
      }

      for (const set of data ?? []) {
        const exerciseName = exerciseNameById.get(set.exercise_id);
        if (!exerciseName) continue;
        const existing = setsByExerciseName.get(exerciseName) ?? [];
        existing.push({ reps: set.reps, weightKg: set.weight_kg });
        setsByExerciseName.set(exerciseName, existing);
      }
      if ((data ?? []).length < PAGE_SIZE) break;
    }
  }

  const goalsWithProgress = goals.map((goal): GoalWithProgress => {
    if (goal.goal_type === "weekly_workouts") {
      const weekStart = dateKey(weekStartForDate(goal.target_date, currentWeekStart));
      return {
        ...goal,
        goal_type: "weekly_workouts",
        progress: calculateWeeklyProgress(
          goal,
          workoutsByWeek.get(weekStart) ?? 0,
          weekStart,
        ),
      };
    }

    const exerciseName = goal.exercise_name?.trim().toLowerCase() ?? "";
    return {
      ...goal,
      goal_type: "exercise_target",
      progress: calculateExerciseProgress(
        goal,
        setsByExerciseName.get(exerciseName) ?? [],
      ),
    };
  });

  const activeWeeklyGoal = goalsWithProgress.find(
    (goal): goal is WeeklyWorkoutGoalWithProgress =>
      goal.goal_type === "weekly_workouts" &&
      !goal.completed_at &&
      goal.progress.weekStart === currentWeekKey,
  );
  const legacyTarget =
    legacyGoal?.target_workouts && !activeWeeklyGoal
      ? {
          title: "Weekly workout target",
          targetWorkouts: legacyGoal.target_workouts,
          completedWorkouts: workoutsByWeek.get(currentWeekKey) ?? 0,
          progressPercent: Math.min(
            100,
            Math.round(
              ((workoutsByWeek.get(currentWeekKey) ?? 0) /
                legacyGoal.target_workouts) *
                100,
            ),
          ),
        }
      : null;

  return {
    data: {
      goals: goalsWithProgress,
      ...getWeeklyStreaks(activeWeeks, currentWeekStart),
      currentActiveDayStreak: getCurrentActiveDayStreak(workoutDays, today),
      workoutsThisWeek: workoutsByWeek.get(currentWeekKey) ?? 0,
      currentWeeklyGoal: activeWeeklyGoal
        ? {
            title: activeWeeklyGoal.title,
            targetWorkouts: activeWeeklyGoal.progress.targetWorkouts,
            completedWorkouts: activeWeeklyGoal.progress.completedWorkouts,
            progressPercent: activeWeeklyGoal.progress.progressPercent,
          }
        : legacyTarget,
    },
  };
}
