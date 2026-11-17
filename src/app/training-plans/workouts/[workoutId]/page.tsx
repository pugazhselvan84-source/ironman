import { notFound, redirect } from "next/navigation";
import { WorkoutSession } from "@/components/training-plans/workout-session";
import { getPersonalRecords } from "@/lib/records/personal-records";
import { getVerifiedAuth } from "@/lib/supabase/session";

export const instant = false;

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;
  const { supabase, user } = await getVerifiedAuth();
  if (!user) redirect("/login");

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .select("*")
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (workoutError) throw new Error("Unable to load this workout.");
  if (!workout) notFound();

  const { data: exercises, error: exercisesError } = await supabase
    .from("exercises")
    .select("*")
    .eq("workout_id", workoutId)
    .eq("user_id", user.id)
    .order("position");
  if (exercisesError) throw new Error("Unable to load workout exercises.");

  const exerciseIds = (exercises ?? []).map((exercise) => exercise.id);
  const { data: sets, error: setsError } = exerciseIds.length
    ? await supabase
        .from("workout_sets")
        .select("*")
        .eq("user_id", user.id)
        .in("exercise_id", exerciseIds)
        .order("set_number")
    : { data: [], error: null };
  if (setsError) throw new Error("Unable to load recorded sets.");

  const personalRecordsResult = await getPersonalRecords(supabase, user.id);
  const personalRecordSetIds = personalRecordsResult.records
    ? personalRecordsResult.records.flatMap((record) => record.recordSetIds)
    : [];

  return (
    <WorkoutSession
      workout={workout}
      personalRecordSetIds={personalRecordSetIds}
      personalRecordsMessage={
        personalRecordsResult.records ? undefined : personalRecordsResult.error
      }
      exercises={(exercises ?? []).map((exercise) => ({
        ...exercise,
        sets: (sets ?? []).filter((set) => set.exercise_id === exercise.id),
      }))}
    />
  );
}
