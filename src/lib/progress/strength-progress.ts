import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type CompletedWorkoutRow = {
  id: string;
  completed_at: string | null;
};

type ExerciseRow = {
  id: string;
  workout_id: string;
  name: string;
};

type WorkoutSetRow = {
  exercise_id: string;
  reps: number;
  weight_kg: number;
};

const PAGE_SIZE = 1000;
const ID_BATCH_SIZE = 100;

export type ExerciseSessionProgress = {
  workoutId: string;
  completedAt: string | null;
  setCount: number;
  volumeKg: number;
  maxWeightKg: number;
};

export type ExerciseProgress = {
  name: string;
  sessions: number;
  totalSets: number;
  totalVolumeKg: number;
  maxWeightKg: number;
  recentSessions: ExerciseSessionProgress[];
};

export type WeeklyProgress = {
  weekStart: string;
  workouts: number;
  volumeKg: number;
};

export type StrengthProgressData = {
  totalCompletedWorkouts: number;
  totalTrainingVolumeKg: number;
  totalSetsLogged: number;
  workoutsThisWeek: number;
  exerciseProgress: ExerciseProgress[];
  weeklyProgress: WeeklyProgress[];
};

export type StrengthProgressResult =
  | { data: StrengthProgressData; error?: never }
  | { data: null; error: string };

function roundToTwo(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function startOfUtcWeek(value: Date) {
  const date = new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - weekday + 1);
  return date;
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getCompletedWeek(workout: CompletedWorkoutRow) {
  return workout.completed_at
    ? dateKey(startOfUtcWeek(new Date(workout.completed_at)))
    : null;
}

export async function getStrengthProgress(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<StrengthProgressResult> {
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
      return { data: null, error: "Unable to load completed workout statistics." };
    }

    const page = data ?? [];
    completedWorkouts.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  const workoutIds = completedWorkouts.map((workout) => workout.id);
  const exercises: ExerciseRow[] = [];

  for (let batchStart = 0; batchStart < workoutIds.length; batchStart += ID_BATCH_SIZE) {
    const workoutIdBatch = workoutIds.slice(batchStart, batchStart + ID_BATCH_SIZE);
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("exercises")
        .select("id, workout_id, name")
        .eq("user_id", userId)
        .in("workout_id", workoutIdBatch)
        .order("id", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        return { data: null, error: "Unable to load exercise statistics." };
      }

      const page = data ?? [];
      exercises.push(...page);
      if (page.length < PAGE_SIZE) break;
    }
  }

  const exerciseIds = exercises.map((exercise) => exercise.id);
  const sets: WorkoutSetRow[] = [];

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
        return { data: null, error: "Unable to load set statistics." };
      }

      const page = data ?? [];
      sets.push(...page);
      if (page.length < PAGE_SIZE) break;
    }
  }

  const workoutsById = new Map(
    completedWorkouts.map((workout) => [workout.id, workout]),
  );
  const exercisesById = new Map(
    exercises.map((exercise) => [exercise.id, exercise]),
  );
  const weeklyByStart = new Map<string, { workouts: number; volumeKg: number }>();
  const currentWeekStart = startOfUtcWeek(new Date());
  const currentWeekKey = dateKey(currentWeekStart);

  for (let offset = 7; offset >= 0; offset -= 1) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - offset * 7);
    weeklyByStart.set(dateKey(weekStart), { workouts: 0, volumeKg: 0 });
  }

  let workoutsThisWeek = 0;
  for (const workout of completedWorkouts) {
    const weekKey = getCompletedWeek(workout);
    if (!weekKey) continue;

    if (weekKey === currentWeekKey) workoutsThisWeek += 1;
    const week = weeklyByStart.get(weekKey);
    if (week) week.workouts += 1;
  }

  type MutableExerciseProgress = {
    name: string;
    sessions: Map<string, ExerciseSessionProgress>;
    totalSets: number;
    totalVolumeKg: number;
    maxWeightKg: number;
  };

  const exerciseProgress = new Map<string, MutableExerciseProgress>();
  let totalTrainingVolumeKg = 0;

  for (const set of sets) {
    const exercise = exercisesById.get(set.exercise_id);
    if (!exercise) continue;
    const workout = workoutsById.get(exercise.workout_id);
    if (!workout) continue;

    const normalizedName = exercise.name.trim().toLowerCase();
    if (!normalizedName) continue;

    let progress = exerciseProgress.get(normalizedName);
    if (!progress) {
      progress = {
        name: exercise.name.trim(),
        sessions: new Map(),
        totalSets: 0,
        totalVolumeKg: 0,
        maxWeightKg: 0,
      };
      exerciseProgress.set(normalizedName, progress);
    }

    let session = progress.sessions.get(workout.id);
    if (!session) {
      session = {
        workoutId: workout.id,
        completedAt: workout.completed_at,
        setCount: 0,
        volumeKg: 0,
        maxWeightKg: 0,
      };
      progress.sessions.set(workout.id, session);
    }

    const volume = set.reps * set.weight_kg;
    progress.totalSets += 1;
    progress.totalVolumeKg += volume;
    progress.maxWeightKg = Math.max(progress.maxWeightKg, set.weight_kg);
    session.setCount += 1;
    session.volumeKg += volume;
    session.maxWeightKg = Math.max(session.maxWeightKg, set.weight_kg);
    totalTrainingVolumeKg += volume;

    const weekKey = getCompletedWeek(workout);
    const week = weekKey ? weeklyByStart.get(weekKey) : undefined;
    if (week) week.volumeKg += volume;
  }

  const exercisesWithProgress = [...exerciseProgress.values()]
    .map((exercise) => ({
      name: exercise.name,
      sessions: exercise.sessions.size,
      totalSets: exercise.totalSets,
      totalVolumeKg: roundToTwo(exercise.totalVolumeKg),
      maxWeightKg: roundToTwo(exercise.maxWeightKg),
      recentSessions: [...exercise.sessions.values()]
        .sort((left, right) => {
          return (
            new Date(left.completedAt ?? 0).getTime() -
            new Date(right.completedAt ?? 0).getTime()
          );
        })
        .slice(-6)
        .map((session) => ({
          ...session,
          volumeKg: roundToTwo(session.volumeKg),
          maxWeightKg: roundToTwo(session.maxWeightKg),
        })),
    }))
    .sort(
      (left, right) =>
        right.totalVolumeKg - left.totalVolumeKg ||
        left.name.localeCompare(right.name),
    );

  const weeklyProgress = [...weeklyByStart.entries()].map(([weekStart, week]) => ({
    weekStart,
    workouts: week.workouts,
    volumeKg: roundToTwo(week.volumeKg),
  }));

  return {
    data: {
      totalCompletedWorkouts: completedWorkouts.length,
      totalTrainingVolumeKg: roundToTwo(totalTrainingVolumeKg),
      totalSetsLogged: sets.length,
      workoutsThisWeek,
      exerciseProgress: exercisesWithProgress,
      weeklyProgress,
    },
  };
}
