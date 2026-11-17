"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addWorkoutSetAction,
  completeWorkoutAction,
} from "@/app/actions/training-plans";
import type { Database } from "@/lib/supabase/database.types";

type Workout = Database["public"]["Tables"]["workouts"]["Row"];
type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
type WorkoutSet = Database["public"]["Tables"]["workout_sets"]["Row"];
type ExerciseWithSets = Exercise & { sets: WorkoutSet[] };

const fieldClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-[#343a36] bg-[#121513] px-3 text-sm text-white focus:border-[#22c55e] focus:outline-none";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#22c55e] px-4 text-xs font-bold text-[#101510] transition hover:bg-[#4ade80] disabled:cursor-not-allowed disabled:opacity-50";

export function WorkoutSession({
  workout,
  exercises,
  personalRecordSetIds,
  personalRecordsMessage,
}: {
  workout: Workout;
  exercises: ExerciseWithSets[];
  personalRecordSetIds: string[];
  personalRecordsMessage?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function submit(
    event: FormEvent<HTMLFormElement>,
    action: (formData: FormData) => Promise<
      | { success: true; message?: string }
      | { success: false; message: string }
    >,
  ) {
    event.preventDefault();
    setPending(true);
    setErrorMessage("");
    setMessage("");
    try {
      const result = await action(new FormData(event.currentTarget));
      if (!result.success) {
        setErrorMessage(result.message);
      } else {
        setMessage(result.message ?? "");
        router.refresh();
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const isComplete = workout.status === "completed";

  return (
    <main className="min-h-screen bg-[#121212] px-4 pb-16 pt-6 text-[#f4f4f5] sm:px-7 sm:pt-9">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/training-plans"
          className="text-xs font-medium text-[#95a098] transition hover:text-[#5fdf87]"
        >
          ← Training plans
        </Link>
        <header className="mb-6 mt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#758078]">
            {isComplete ? "Workout completed" : "Workout in progress"}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-white">
            {workout.title}
          </h1>
          <p className="mt-2 text-sm text-[#929c94]">
            Planned targets are optional. Log your actual reps and weight for each set.
          </p>
        </header>

        {personalRecordsMessage && (
          <p role="status" className="mb-4 text-xs text-[#e3bf77]">
            {personalRecordsMessage}
          </p>
        )}

        {(message || errorMessage) && (
          <p
            role={errorMessage ? "alert" : "status"}
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              errorMessage
                ? "border-[#704342] bg-[#2b1d1d] text-[#f2aaa5]"
                : "border-[#31533b] bg-[#1a281e] text-[#8de3a5]"
            }`}
          >
            {errorMessage || message}
          </p>
        )}

        <div className="space-y-4">
          {exercises.map((exercise) => (
            <section
              key={exercise.id}
              className="rounded-2xl border border-[#34383d] bg-[#191c1a] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="font-semibold text-white">{exercise.name}</h2>
                <span className="rounded-full border border-[#3b423d] px-2.5 py-1 text-[10px] text-[#9ba49d]">
                  Target: {exercise.target_sets ?? "—"} sets × {exercise.target_reps ?? "—"} reps
                </span>
              </div>
              {exercise.sets.length > 0 && (
                <ol className="mt-4 divide-y divide-[#2b302c] border-y border-[#2b302c]">
                  {exercise.sets.map((set) => (
                    <li
                      key={set.id}
                      className={`flex items-center justify-between py-2.5 text-xs ${
                        personalRecordSetIds.includes(set.id)
                          ? "rounded-lg border border-[#365c3f] bg-[#1d2921] px-2 text-[#e5f4e8]"
                          : "text-[#cbd1cb]"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        Set {set.set_number}
                        {personalRecordSetIds.includes(set.id) && (
                          <span className="rounded-full border border-[#315c3a] bg-[#243d2a] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#8de3a5]">
                            PR
                          </span>
                        )}
                      </span>
                      <span>
                        {set.reps} reps · {set.weight_kg} kg
                      </span>
                    </li>
                  ))}
                </ol>
              )}
              {isComplete ? (
                exercise.sets.length === 0 && (
                  <p className="mt-3 text-xs text-[#818a83]">No actual sets were recorded.</p>
                )
              ) : (
                <form
                  className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                  onSubmit={(event) => void submit(event, addWorkoutSetAction)}
                >
                  <input type="hidden" name="exercise_id" value={exercise.id} />
                  <label className="text-xs font-medium text-[#aeb6af]">
                    Actual reps
                    <input
                      className={fieldClass}
                      name="reps"
                      type="number"
                      min={1}
                      step={1}
                      required
                      placeholder={
                        exercise.target_reps ? `Target: ${exercise.target_reps}` : "Enter reps"
                      }
                    />
                  </label>
                  <label className="text-xs font-medium text-[#aeb6af]">
                    Weight (kg)
                    <input
                      className={fieldClass}
                      name="weight_kg"
                      type="number"
                      min={0}
                      max={99999.99}
                      step="0.01"
                      required
                      defaultValue="0"
                    />
                  </label>
                  <button className={buttonClass} disabled={pending}>
                    Record set
                  </button>
                </form>
              )}
            </section>
          ))}
          {exercises.length === 0 && (
            <section className="rounded-2xl border border-[#34383d] bg-[#191c1a] p-5">
              <p className="text-sm font-medium text-white">No planned exercises</p>
              <p className="mt-1 text-xs text-[#929c94]">
                You can still complete this workout, or return to the plan to add exercises.
              </p>
            </section>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {!isComplete && (
            <form onSubmit={(event) => void submit(event, () => completeWorkoutAction(workout.id))}>
              <button className={buttonClass} disabled={pending}>
                {pending ? "Saving…" : "Complete workout"}
              </button>
            </form>
          )}
          <Link
            href="/training-plans"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#3a413c] px-4 text-xs font-semibold text-[#d3d9d4] transition hover:bg-[#232824]"
          >
            Back to plans
          </Link>
        </div>
      </div>
    </main>
  );
}
