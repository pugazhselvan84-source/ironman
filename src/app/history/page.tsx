import { redirect } from "next/navigation";
import { WorkoutHistory } from "@/components/workout-history/workout-history";
import { getVerifiedAuth } from "@/lib/supabase/session";

export const instant = false;

export default async function HistoryPage() {
  const { supabase, user } = await getVerifiedAuth();
  if (!user) redirect("/login");

  const { data: workouts, error: workoutsError } = await supabase
    .from("workouts")
    .select("id, title, completed_at")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  if (workoutsError) {
    throw new Error("Unable to load your workout history.");
  }

  const completedWorkouts = workouts ?? [];
  const workoutIds = completedWorkouts.map((workout) => workout.id);
  const { data: exercises, error: exercisesError } = workoutIds.length
    ? await supabase
        .from("exercises")
        .select("id, workout_id")
        .eq("user_id", user.id)
        .in("workout_id", workoutIds)
    : { data: [], error: null };

  if (exercisesError) {
    throw new Error("Unable to load workout history exercise totals.");
  }

  const exerciseRows = exercises ?? [];
  const exerciseIds = exerciseRows.map((exercise) => exercise.id);
  const { data: sets, error: setsError } = exerciseIds.length
    ? await supabase
        .from("workout_sets")
        .select("exercise_id")
        .eq("user_id", user.id)
        .in("exercise_id", exerciseIds)
    : { data: [], error: null };

  if (setsError) {
    throw new Error("Unable to load workout history set totals.");
  }

  const exerciseCounts = new Map<string, number>();
  const exerciseWorkouts = new Map<string, string>();
  for (const exercise of exerciseRows) {
    exerciseCounts.set(
      exercise.workout_id,
      (exerciseCounts.get(exercise.workout_id) ?? 0) + 1,
    );
    exerciseWorkouts.set(exercise.id, exercise.workout_id);
  }

  const setCounts = new Map<string, number>();
  for (const set of sets ?? []) {
    const workoutId = exerciseWorkouts.get(set.exercise_id);
    if (workoutId) {
      setCounts.set(workoutId, (setCounts.get(workoutId) ?? 0) + 1);
    }
  }

  return (
    <WorkoutHistory
      workouts={completedWorkouts.map((workout) => ({
        ...workout,
        exerciseCount: exerciseCounts.get(workout.id) ?? 0,
        setCount: setCounts.get(workout.id) ?? 0,
      }))}
    />
  );
}
