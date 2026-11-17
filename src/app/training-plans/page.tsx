import { redirect } from "next/navigation";
import { TrainingPlansManager } from "@/components/training-plans/training-plans-manager";
import { getVerifiedAuth } from "@/lib/supabase/session";

export const instant = false;

export default async function TrainingPlansPage() {
  const { supabase, user } = await getVerifiedAuth();
  if (!user) redirect("/login");

  const [{ data: plans, error: plansError }, { data: workouts, error: workoutsError }] =
    await Promise.all([
      supabase
        .from("training_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("planned_workouts")
        .select("*")
        .eq("user_id", user.id)
        .order("week_number")
        .order("day_number"),
    ]);

  if (plansError || workoutsError) {
    throw new Error("Unable to load your training plans.");
  }

  const workoutIds = (workouts ?? []).map((workout) => workout.id);
  const { data: exercises, error: exercisesError } = workoutIds.length
    ? await supabase
        .from("planned_exercises")
        .select("*")
        .eq("user_id", user.id)
        .in("planned_workout_id", workoutIds)
        .order("position")
    : { data: [], error: null };

  if (exercisesError) {
    throw new Error("Unable to load your planned exercises.");
  }

  const planData = (plans ?? []).map((plan) => ({
    ...plan,
    workouts: (workouts ?? [])
      .filter((workout) => workout.training_plan_id === plan.id)
      .map((workout) => ({
        ...workout,
        exercises: (exercises ?? []).filter(
          (exercise) => exercise.planned_workout_id === workout.id,
        ),
      })),
  }));

  return <TrainingPlansManager initialPlans={planData} />;
}
