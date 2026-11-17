"use server";

import { revalidatePath } from "next/cache";
import { getVerifiedAuth } from "@/lib/supabase/session";

type ActionResult =
  | { success: true; message?: string; workoutId?: string }
  | { success: false; message: string };

function failure(message: string): ActionResult {
  return { success: false, message };
}

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function positiveInteger(value: string) {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function optionalPositiveInteger(value: string) {
  return value === "" ? null : positiveInteger(value);
}

function databaseFailure(error: { code?: string }) {
  if (error.code === "23505") {
    return "That name or schedule entry is already in use.";
  }
  if (error.code === "23514") {
    return "One or more values are outside the allowed range.";
  }
  return "We couldn't save that change. Please try again.";
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function getOwner() {
  const { supabase, user } = await getVerifiedAuth();
  return user ? { supabase, user } : null;
}

export async function saveTrainingPlanAction(formData: FormData): Promise<ActionResult> {
  const owner = await getOwner();
  if (!owner) return failure("Sign in to manage your training plans.");

  const id = field(formData, "id");
  const name = field(formData, "name");
  const startsOn = field(formData, "starts_on");
  const endsOn = field(formData, "ends_on") || null;

  if (!name || name.length > 120 || !isValidDate(startsOn)) {
    return failure("Enter a plan name and a valid start date.");
  }
  if (endsOn && (!isValidDate(endsOn) || endsOn < startsOn)) {
    return failure("The end date must be valid and on or after the start date.");
  }

  const values = { name, starts_on: startsOn, ends_on: endsOn };
  const query = id
    ? owner.supabase
        .from("training_plans")
        .update(values)
        .eq("id", id)
        .eq("user_id", owner.user.id)
    : owner.supabase.from("training_plans").insert({
        ...values,
        user_id: owner.user.id,
      });
  const { error } = await query;

  if (error) return failure(databaseFailure(error));
  revalidatePath("/");
  revalidatePath("/training-plans");
  return { success: true, message: id ? "Training plan updated." : "Training plan created." };
}

export async function deleteTrainingPlanAction(id: string): Promise<ActionResult> {
  const owner = await getOwner();
  if (!owner) return failure("Sign in to manage your training plans.");
  if (!id) return failure("Choose a training plan to delete.");

  const { error } = await owner.supabase
    .from("training_plans")
    .delete()
    .eq("id", id)
    .eq("user_id", owner.user.id);
  if (error) return failure(databaseFailure(error));
  revalidatePath("/");
  revalidatePath("/training-plans");
  return { success: true, message: "Training plan deleted." };
}

export async function activateTrainingPlanAction(id: string): Promise<ActionResult> {
  const owner = await getOwner();
  if (!owner) return failure("Sign in to manage your training plans.");
  if (!id) return failure("Choose a training plan to activate.");

  const { data: target, error: targetError } = await owner.supabase
    .from("training_plans")
    .select("id")
    .eq("id", id)
    .eq("user_id", owner.user.id)
    .maybeSingle();
  if (targetError) return failure(databaseFailure(targetError));
  if (!target) return failure("That training plan could not be found.");

  const { error: deactivateError } = await owner.supabase
    .from("training_plans")
    .update({ is_active: false })
    .eq("user_id", owner.user.id)
    .eq("is_active", true)
    .neq("id", id);
  if (deactivateError) return failure(databaseFailure(deactivateError));

  const { data, error } = await owner.supabase
    .from("training_plans")
    .update({ is_active: true })
    .eq("id", id)
    .eq("user_id", owner.user.id)
    .select("id")
    .maybeSingle();
  if (error) return failure(databaseFailure(error));
  if (!data) return failure("That training plan could not be found.");

  revalidatePath("/");
  revalidatePath("/training-plans");
  return { success: true, message: "Training plan activated." };
}

export async function createPlannedWorkoutAction(
  formData: FormData,
): Promise<ActionResult> {
  const owner = await getOwner();
  if (!owner) return failure("Sign in to manage your training plans.");

  const planId = field(formData, "training_plan_id");
  const dayNumber = positiveInteger(field(formData, "day_number"));
  const weekNumber = positiveInteger(field(formData, "week_number"));
  const isRestDay = field(formData, "is_rest_day") === "on";
  const title = isRestDay ? "Rest Day" : field(formData, "title");

  if (!planId || !dayNumber || dayNumber > 7 || !weekNumber || weekNumber > 520) {
    return failure("Choose a valid week and day.");
  }
  if (!title || title.length > 120) {
    return failure("Enter a workout name up to 120 characters.");
  }

  const { data: plan, error: planError } = await owner.supabase
    .from("training_plans")
    .select("starts_on, ends_on")
    .eq("id", planId)
    .eq("user_id", owner.user.id)
    .maybeSingle();
  if (planError) return failure(databaseFailure(planError));
  if (!plan) return failure("That training plan could not be found.");

  const scheduledDate = new Date(`${plan.starts_on}T00:00:00Z`);
  scheduledDate.setUTCDate(
    scheduledDate.getUTCDate() + (weekNumber - 1) * 7 + dayNumber - 1,
  );
  const scheduledFor = scheduledDate.toISOString().slice(0, 10);
  if (plan.ends_on && scheduledFor > plan.ends_on) {
    return failure("That schedule day falls after the plan end date.");
  }

  const { data: existing, error: lookupError } = await owner.supabase
    .from("planned_workouts")
    .select("id")
    .eq("training_plan_id", planId)
    .eq("user_id", owner.user.id)
    .eq("week_number", weekNumber)
    .eq("day_number", dayNumber)
    .maybeSingle();
  if (lookupError) return failure(databaseFailure(lookupError));
  if (existing) return failure("That day already has a workout in this week.");

  const { error } = await owner.supabase.from("planned_workouts").insert({
    user_id: owner.user.id,
    training_plan_id: planId,
    scheduled_for: scheduledFor,
    week_number: weekNumber,
    day_number: dayNumber,
    title,
  });
  if (error) return failure(databaseFailure(error));

  revalidatePath("/training-plans");
  return { success: true, message: "Workout day added." };
}

export async function deletePlannedWorkoutAction(id: string): Promise<ActionResult> {
  const owner = await getOwner();
  if (!owner) return failure("Sign in to manage your training plans.");
  if (!id) return failure("Choose a workout day to delete.");

  const { error } = await owner.supabase
    .from("planned_workouts")
    .delete()
    .eq("id", id)
    .eq("user_id", owner.user.id);
  if (error) return failure(databaseFailure(error));
  revalidatePath("/training-plans");
  return { success: true, message: "Workout day deleted." };
}

export async function savePlannedExerciseAction(
  formData: FormData,
): Promise<ActionResult> {
  const owner = await getOwner();
  if (!owner) return failure("Sign in to manage your training plans.");

  const id = field(formData, "id");
  const workoutId = field(formData, "planned_workout_id");
  const name = field(formData, "name");
  const sets = optionalPositiveInteger(field(formData, "target_sets"));
  const reps = optionalPositiveInteger(field(formData, "target_reps"));

  if (!workoutId || !name || name.length > 120) {
    return failure("Enter an exercise name up to 120 characters.");
  }
  if (sets === null && field(formData, "target_sets") !== "") {
    return failure("Target sets must be a positive whole number or left blank.");
  }
  if (reps === null && field(formData, "target_reps") !== "") {
    return failure("Target reps must be a positive whole number or left blank.");
  }

  if (id) {
    const { error } = await owner.supabase
      .from("planned_exercises")
      .update({ name, target_sets: sets, target_reps: reps })
      .eq("id", id)
      .eq("user_id", owner.user.id)
      .eq("planned_workout_id", workoutId);
    if (error) return failure(databaseFailure(error));
  } else {
    const { data: current, error: lookupError } = await owner.supabase
      .from("planned_exercises")
      .select("position")
      .eq("planned_workout_id", workoutId)
      .eq("user_id", owner.user.id)
      .order("position", { ascending: false })
      .limit(1);
    if (lookupError) return failure(databaseFailure(lookupError));
    const position = (current?.[0]?.position ?? 0) + 1;
    const { error } = await owner.supabase.from("planned_exercises").insert({
      user_id: owner.user.id,
      planned_workout_id: workoutId,
      name,
      position,
      target_sets: sets,
      target_reps: reps,
    });
    if (error) return failure(databaseFailure(error));
  }

  revalidatePath("/training-plans");
  return { success: true, message: id ? "Exercise updated." : "Exercise added." };
}

export async function deletePlannedExerciseAction(id: string): Promise<ActionResult> {
  const owner = await getOwner();
  if (!owner) return failure("Sign in to manage your training plans.");
  if (!id) return failure("Choose an exercise to delete.");

  const { error } = await owner.supabase
    .from("planned_exercises")
    .delete()
    .eq("id", id)
    .eq("user_id", owner.user.id);
  if (error) return failure(databaseFailure(error));
  revalidatePath("/training-plans");
  return { success: true, message: "Exercise deleted." };
}

export async function startPlannedWorkoutAction(id: string): Promise<ActionResult> {
  const owner = await getOwner();
  if (!owner) return failure("Sign in to start a workout.");
  if (!id) return failure("Choose a workout day to start.");

  const { data: plannedWorkout, error: workoutError } = await owner.supabase
    .from("planned_workouts")
    .select("id, title")
    .eq("id", id)
    .eq("user_id", owner.user.id)
    .maybeSingle();
  if (workoutError) return failure(databaseFailure(workoutError));
  if (!plannedWorkout) return failure("That planned workout could not be found.");
  if (plannedWorkout.title === "Rest Day") {
    return failure("Rest days cannot be started as workouts.");
  }

  const { data: plannedExercises, error: exerciseError } = await owner.supabase
    .from("planned_exercises")
    .select("name, position, target_sets, target_reps")
    .eq("planned_workout_id", id)
    .eq("user_id", owner.user.id)
    .order("position");
  if (exerciseError) return failure(databaseFailure(exerciseError));

  const { data: workout, error: createError } = await owner.supabase
    .from("workouts")
    .insert({
      user_id: owner.user.id,
      planned_workout_id: id,
      title: plannedWorkout.title,
    })
    .select("id")
    .single();
  if (createError) return failure(databaseFailure(createError));

  if (plannedExercises?.length) {
    const { error: copyError } = await owner.supabase.from("exercises").insert(
      plannedExercises.map((exercise) => ({
        ...exercise,
        workout_id: workout.id,
        user_id: owner.user.id,
      })),
    );
    if (copyError) {
      const { error: cleanupError } = await owner.supabase
        .from("workouts")
        .delete()
        .eq("id", workout.id)
        .eq("user_id", owner.user.id);
      if (cleanupError) {
        return failure("The workout could not be prepared, and cleanup also failed. Please contact support.");
      }
      return failure(databaseFailure(copyError));
    }
  }

  revalidatePath("/");
  return { success: true, workoutId: workout.id };
}

export async function addWorkoutSetAction(formData: FormData): Promise<ActionResult> {
  const owner = await getOwner();
  if (!owner) return failure("Sign in to record a workout.");

  const exerciseId = field(formData, "exercise_id");
  const reps = positiveInteger(field(formData, "reps"));
  const weightText = field(formData, "weight_kg");
  const weight = weightText === "" ? null : Number(weightText);

  if (!exerciseId || !reps || weight === null || !Number.isFinite(weight) || weight < 0 || weight > 99999.99) {
    return failure("Enter positive reps and a weight from 0 to 99,999.99 kg.");
  }

  const { data: exercise, error: exerciseError } = await owner.supabase
    .from("exercises")
    .select("id, workout_id")
    .eq("id", exerciseId)
    .eq("user_id", owner.user.id)
    .maybeSingle();
  if (exerciseError) return failure(databaseFailure(exerciseError));
  if (!exercise) return failure("That exercise could not be found.");

  const { data: previousSets, error: setsError } = await owner.supabase
    .from("workout_sets")
    .select("set_number")
    .eq("exercise_id", exerciseId)
    .eq("user_id", owner.user.id)
    .order("set_number", { ascending: false })
    .limit(1);
  if (setsError) return failure(databaseFailure(setsError));

  const { error } = await owner.supabase.from("workout_sets").insert({
    user_id: owner.user.id,
    exercise_id: exercise.id,
    set_number: (previousSets?.[0]?.set_number ?? 0) + 1,
    reps,
    weight_kg: weight,
    completed_at: new Date().toISOString(),
  });
  if (error) return failure(databaseFailure(error));

  revalidatePath(`/training-plans/workouts/${exercise.workout_id}`);
  return { success: true, message: "Set recorded." };
}

export async function completeWorkoutAction(id: string): Promise<ActionResult> {
  const owner = await getOwner();
  if (!owner) return failure("Sign in to complete a workout.");
  if (!id) return failure("Choose a workout to complete.");

  const { data, error } = await owner.supabase
    .from("workouts")
    .update({ status: "completed" })
    .eq("id", id)
    .eq("user_id", owner.user.id)
    .eq("status", "in_progress")
    .select("id")
    .maybeSingle();
  if (error) return failure(databaseFailure(error));
  if (!data) return failure("That workout is no longer in progress.");

  revalidatePath("/");
  revalidatePath("/goals");
  revalidatePath(`/training-plans/workouts/${id}`);
  return { success: true, message: "Workout completed." };
}
