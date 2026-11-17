"use server";

import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/supabase/database.types";
import { getVerifiedAuth } from "@/lib/supabase/session";

type ActionResult =
  | { success: true; message?: string }
  | { success: false; message: string };
type GoalInsert = Database["public"]["Tables"]["goals"]["Insert"];
type GoalValues = Omit<GoalInsert, "id" | "user_id" | "created_at">;

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

function positiveWeight(value: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 99999.99
    ? parsed
    : null;
}

function validDate(value: string) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function databaseFailure(error: { code?: string }) {
  if (error.code === "23514" || error.code === "22003") {
    return "One or more goal values are outside the allowed range.";
  }
  return "We couldn't save that goal. Please try again.";
}

async function getOwner() {
  const { supabase, user } = await getVerifiedAuth();
  return user ? { supabase, user } : null;
}

function parseGoal(formData: FormData):
  | { values: GoalValues }
  | { error: string } {
  const goalType = field(formData, "goal_type");
  const title = field(formData, "title");
  const targetDate = field(formData, "target_date") || null;

  if (
    (goalType !== "exercise_target" && goalType !== "weekly_workouts") ||
    !title ||
    title.length > 120 ||
    (targetDate !== null && !validDate(targetDate))
  ) {
    return { error: "Enter a goal title, type, and valid optional target date." };
  }

  if (goalType === "weekly_workouts") {
    const targetWorkouts = positiveInteger(field(formData, "target_workouts"));
    if (!targetWorkouts || targetWorkouts > 1000) {
      return { error: "Enter a weekly workout target from 1 to 1,000." };
    }

    return {
      values: {
        goal_type: goalType,
        title,
        target_date: targetDate,
        exercise_name: null,
        target_weight_kg: null,
        target_reps: null,
        target_workouts: targetWorkouts,
      },
    };
  }

  const exerciseName = field(formData, "exercise_name");
  const weightText = field(formData, "target_weight_kg");
  const repsText = field(formData, "target_reps");
  const targetWeight = weightText ? positiveWeight(weightText) : null;
  const targetReps = repsText ? positiveInteger(repsText) : null;

  if (
    !exerciseName ||
    exerciseName.length > 120 ||
    (!weightText && !repsText) ||
    (weightText && targetWeight === null) ||
    (repsText && (!targetReps || targetReps > 10000))
  ) {
    return {
      error:
        "Enter an exercise name and at least one valid weight or reps target.",
    };
  }

  return {
    values: {
      goal_type: goalType,
      title,
      target_date: targetDate,
      exercise_name: exerciseName,
      target_weight_kg: targetWeight,
      target_reps: targetReps,
      target_workouts: null,
    },
  };
}

function revalidateGoals() {
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function createGoalAction(formData: FormData): Promise<ActionResult> {
  const owner = await getOwner();
  if (!owner) return failure("Sign in to manage your goals.");

  const parsed = parseGoal(formData);
  if ("error" in parsed) return failure(parsed.error);

  const { error } = await owner.supabase.from("goals").insert({
    ...parsed.values,
    user_id: owner.user.id,
  });
  if (error) return failure(databaseFailure(error));

  revalidateGoals();
  return { success: true, message: "Goal created." };
}

export async function updateGoalAction(formData: FormData): Promise<ActionResult> {
  const owner = await getOwner();
  if (!owner) return failure("Sign in to manage your goals.");

  const id = field(formData, "id");
  if (!id) return failure("Choose a goal to update.");

  const parsed = parseGoal(formData);
  if ("error" in parsed) return failure(parsed.error);

  const { data, error } = await owner.supabase
    .from("goals")
    .update(parsed.values)
    .eq("id", id)
    .eq("user_id", owner.user.id)
    .select("id")
    .maybeSingle();
  if (error) return failure(databaseFailure(error));
  if (!data) return failure("That goal could not be found.");

  revalidateGoals();
  return { success: true, message: "Goal updated." };
}

export async function deleteGoalAction(id: string): Promise<ActionResult> {
  const owner = await getOwner();
  if (!owner) return failure("Sign in to manage your goals.");
  if (!id) return failure("Choose a goal to delete.");

  const { data, error } = await owner.supabase
    .from("goals")
    .delete()
    .eq("id", id)
    .eq("user_id", owner.user.id)
    .select("id")
    .maybeSingle();
  if (error) return failure(databaseFailure(error));
  if (!data) return failure("That goal could not be found.");

  revalidateGoals();
  return { success: true, message: "Goal deleted." };
}

export async function toggleGoalCompleteAction(
  id: string,
  completed: boolean,
): Promise<ActionResult> {
  const owner = await getOwner();
  if (!owner) return failure("Sign in to manage your goals.");
  if (!id || typeof completed !== "boolean") {
    return failure("Choose a valid goal status.");
  }

  const { data, error } = await owner.supabase
    .from("goals")
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("user_id", owner.user.id)
    .select("id")
    .maybeSingle();
  if (error) return failure(databaseFailure(error));
  if (!data) return failure("That goal could not be found.");

  revalidateGoals();
  return {
    success: true,
    message: completed ? "Goal marked complete." : "Goal marked active.",
  };
}
