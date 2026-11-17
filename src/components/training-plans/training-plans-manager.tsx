"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  activateTrainingPlanAction,
  createPlannedWorkoutAction,
  deletePlannedExerciseAction,
  deletePlannedWorkoutAction,
  deleteTrainingPlanAction,
  savePlannedExerciseAction,
  saveTrainingPlanAction,
  startPlannedWorkoutAction,
} from "@/app/actions/training-plans";
import type { Database } from "@/lib/supabase/database.types";

type PlanRow = Database["public"]["Tables"]["training_plans"]["Row"];
type WorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
type ExerciseRow = Database["public"]["Tables"]["planned_exercises"]["Row"];
type Plan = PlanRow & { workouts: (WorkoutRow & { exercises: ExerciseRow[] })[] };

const inputClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-[#343a36] bg-[#121513] px-3 text-sm text-white placeholder:text-[#667069] focus:border-[#22c55e] focus:outline-none";
const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-xl border border-[#3a413c] px-3.5 text-xs font-semibold text-[#d3d9d4] transition hover:border-[#536258] hover:bg-[#232824] disabled:cursor-not-allowed disabled:opacity-50";
const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-xl bg-[#22c55e] px-4 text-xs font-bold text-[#101510] transition hover:bg-[#4ade80] disabled:cursor-not-allowed disabled:opacity-50";

function isRestDay(workout: WorkoutRow) {
  return workout.title === "Rest Day";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-[#34383d] bg-[#191c1a] ${className}`}>
      {children}
    </section>
  );
}

export function TrainingPlansManager({ initialPlans }: { initialPlans: Plan[] }) {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState(
    initialPlans.find((plan) => plan.is_active)?.id ?? initialPlans[0]?.id ?? "",
  );
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [week, setWeek] = useState(1);
  const [addingDay, setAddingDay] = useState(false);
  const [addingExerciseTo, setAddingExerciseTo] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<ExerciseRow | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedPlan =
    initialPlans.find((plan) => plan.id === selectedPlanId) ?? initialPlans[0];
  const weekWorkouts =
    selectedPlan?.workouts.filter((workout) => workout.week_number === week) ?? [];
  const availableDays = Array.from({ length: 7 }, (_, index) => index + 1).filter(
    (dayNumber) => !weekWorkouts.some((workout) => workout.day_number === dayNumber),
  );

  async function perform(
    action: () => Promise<
      | { success: true; message?: string; workoutId?: string }
      | { success: false; message: string }
    >,
    onSuccess?: (workoutId?: string) => void,
  ) {
    setPending(true);
    setMessage("");
    setErrorMessage("");
    try {
      const result = await action();
      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }
      setMessage(result.message ?? "");
      onSuccess?.(result.workoutId);
      router.refresh();
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function submitForm(
    event: FormEvent<HTMLFormElement>,
    action: (formData: FormData) => Promise<
      | { success: true; message?: string; workoutId?: string }
      | { success: false; message: string }
    >,
    onSuccess?: (workoutId?: string) => void,
  ) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    void perform(() => action(formData), onSuccess);
  }

  function beginCreatePlan() {
    setEditingPlan(null);
    setCreatingPlan(true);
  }

  function beginEditPlan(plan: Plan) {
    setCreatingPlan(false);
    setEditingPlan(plan);
  }

  function cancelPlanForm() {
    setCreatingPlan(false);
    setEditingPlan(null);
  }

  return (
    <main className="min-h-screen bg-[#121212] px-4 pb-20 pt-6 text-[#f4f4f5] sm:px-7 sm:pt-9 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-xs font-medium text-[#95a098] transition hover:text-[#5fdf87]"
            >
              ← Dashboard
            </Link>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#758078]">
              IRONMAN · Training
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              Training plans
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9ba49d]">
              Build a weekly schedule, add exercises and targets, and start a workout when you’re ready.
            </p>
          </div>
          <button type="button" className={primaryButtonClass} onClick={beginCreatePlan}>
            + New plan
          </button>
        </header>

        {(message || errorMessage) && (
          <p
            role={errorMessage ? "alert" : "status"}
            className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
              errorMessage
                ? "border-[#704342] bg-[#2b1d1d] text-[#f2aaa5]"
                : "border-[#31533b] bg-[#1a281e] text-[#8de3a5]"
            }`}
          >
            {errorMessage || message}
          </p>
        )}

        {(creatingPlan || editingPlan) && (
          <Panel className="mb-5 p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">
                {editingPlan ? "Edit training plan" : "Create training plan"}
              </h2>
              <button type="button" className={buttonClass} onClick={cancelPlanForm}>
                Cancel
              </button>
            </div>
            <form
              className="grid gap-4 sm:grid-cols-3"
              onSubmit={(event) =>
                submitForm(event, saveTrainingPlanAction, () => {
                  setCreatingPlan(false);
                  setEditingPlan(null);
                })
              }
            >
              {editingPlan && <input type="hidden" name="id" value={editingPlan.id} />}
              <label className="text-xs font-medium text-[#aeb6af] sm:col-span-3">
                Plan name
                <input
                  className={inputClass}
                  name="name"
                  required
                  maxLength={120}
                  defaultValue={editingPlan?.name ?? ""}
                  placeholder="e.g. 70.3 Base Build"
                />
              </label>
              <label className="text-xs font-medium text-[#aeb6af]">
                Starts on
                <input
                  className={inputClass}
                  name="starts_on"
                  type="date"
                  required
                  defaultValue={editingPlan?.starts_on ?? ""}
                />
              </label>
              <label className="text-xs font-medium text-[#aeb6af]">
                Ends on <span className="font-normal text-[#7d8780]">(optional)</span>
                <input
                  className={inputClass}
                  name="ends_on"
                  type="date"
                  defaultValue={editingPlan?.ends_on ?? ""}
                />
              </label>
              <div className="flex items-end">
                <button className={`${primaryButtonClass} w-full`} disabled={pending}>
                  {pending ? "Saving…" : editingPlan ? "Save changes" : "Create plan"}
                </button>
              </div>
            </form>
          </Panel>
        )}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.8fr)]">
          <section aria-labelledby="plans-heading">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="plans-heading" className="text-sm font-semibold text-white">
                Your plans
              </h2>
              <span className="text-[11px] text-[#849087]">{initialPlans.length} total</span>
            </div>
            {initialPlans.length === 0 ? (
              <Panel className="p-5">
                <p className="text-sm font-medium text-white">No plans yet</p>
                <p className="mt-2 text-xs leading-5 text-[#99a29b]">
                  Create a plan to start organizing your training weeks.
                </p>
                <button type="button" onClick={beginCreatePlan} className={`${primaryButtonClass} mt-4`}>
                  Create your first plan
                </button>
              </Panel>
            ) : (
              <div className="space-y-3">
                {initialPlans.map((plan) => (
                  <Panel
                    key={plan.id}
                    className={`p-4 transition ${
                      plan.id === selectedPlan?.id
                        ? "border-[#42664b] bg-[linear-gradient(135deg,#1d261f,#191c1a)]"
                        : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => setSelectedPlanId(plan.id)}
                      aria-pressed={plan.id === selectedPlan?.id}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white">{plan.name}</span>
                        {plan.is_active && (
                          <span className="rounded-full border border-[#315c3a] bg-[#1b2c20] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#7ee29b]">
                            Active
                          </span>
                        )}
                      </span>
                      <span className="mt-2 block text-[11px] text-[#939d95]">
                        {formatDate(plan.starts_on)}
                        {plan.ends_on ? ` – ${formatDate(plan.ends_on)}` : " · No end date"}
                      </span>
                      <span className="mt-1 block text-[11px] text-[#7f8981]">
                        {plan.workouts.length} scheduled day{plan.workouts.length === 1 ? "" : "s"}
                      </span>
                    </button>
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-[#303632] pt-3">
                      {!plan.is_active && (
                        <button
                          type="button"
                          className={buttonClass}
                          disabled={pending}
                          onClick={() =>
                            void perform(() => activateTrainingPlanAction(plan.id))
                          }
                        >
                          Activate
                        </button>
                      )}
                      <button
                        type="button"
                        className={buttonClass}
                        onClick={() => beginEditPlan(plan)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={`${buttonClass} border-[#64403f] text-[#e2a29e] hover:bg-[#2b1d1d]`}
                        disabled={pending}
                        onClick={() => {
                          if (window.confirm(`Delete “${plan.name}” and its scheduled days?`)) {
                            void perform(() => deleteTrainingPlanAction(plan.id), () => {
                              if (selectedPlanId === plan.id) {
                                setSelectedPlanId(
                                  initialPlans.find((item) => item.id !== plan.id)?.id ?? "",
                                );
                              }
                            });
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </Panel>
                ))}
              </div>
            )}
          </section>

          {selectedPlan ? (
            <section aria-labelledby="schedule-heading">
              <Panel className="p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#748078]">
                      {selectedPlan.is_active ? "Active plan" : "Plan schedule"}
                    </p>
                    <h2 id="schedule-heading" className="mt-1 text-xl font-semibold text-white">
                      {selectedPlan.name}
                    </h2>
                    <p className="mt-1 text-xs text-[#8e9991]">
                      {formatDate(selectedPlan.starts_on)}
                      {selectedPlan.ends_on ? ` – ${formatDate(selectedPlan.ends_on)}` : ""}
                    </p>
                  </div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-[#929c94]">
                    Week
                    <input
                      className="ml-2 h-10 w-20 rounded-lg border border-[#343a36] bg-[#121513] px-2 text-sm text-white"
                      type="number"
                      min={1}
                      max={520}
                      value={week}
                      onChange={(event) =>
                        setWeek(Math.min(520, Math.max(1, Number(event.target.value) || 1)))
                      }
                    />
                  </label>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {Array.from({ length: 7 }, (_, index) => index + 1).map((dayNumber) => {
                    const workout = weekWorkouts.find(
                      (item) => item.day_number === dayNumber,
                    );
                    return (
                      <div
                        key={dayNumber}
                        className={`min-w-0 rounded-xl border p-3 ${
                          workout
                            ? "border-[#343a36] bg-[#1d201e]"
                            : "border-dashed border-[#333a35] bg-[#171a18]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#89948c]">
                              Day {dayNumber}
                            </p>
                            {workout ? (
                              <>
                                <p className="mt-1 truncate text-sm font-semibold text-white">
                                  {isRestDay(workout) ? "Rest day" : workout.title}
                                </p>
                                <p className="mt-1 text-[10px] text-[#7f8981]">
                                  {formatDate(workout.scheduled_for)}
                                </p>
                              </>
                            ) : (
                              <p className="mt-1 text-xs text-[#667069]">No workout scheduled</p>
                            )}
                          </div>
                          {workout && (
                            <button
                              type="button"
                              aria-label={`Delete day ${dayNumber}`}
                              className="rounded-lg px-2 py-1 text-xs text-[#9f7775] hover:bg-[#2b1d1d] hover:text-[#f2aaa5]"
                              disabled={pending}
                              onClick={() => {
                                if (window.confirm(`Delete Day ${dayNumber} and its exercises?`)) {
                                  void perform(() => deletePlannedWorkoutAction(workout.id));
                                }
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        {workout && !isRestDay(workout) && (
                          <div className="mt-3 border-t border-[#303632] pt-2.5">
                            {workout.exercises.length ? (
                              <ul className="space-y-2">
                                {workout.exercises.map((exercise) => (
                                  <li
                                    key={exercise.id}
                                    className="flex items-start justify-between gap-2 text-xs"
                                  >
                                    <span className="min-w-0">
                                      <span className="block truncate font-medium text-[#dce1dc]">
                                        {exercise.name}
                                      </span>
                                      <span className="mt-0.5 block text-[10px] text-[#879188]">
                                        {exercise.target_sets ?? "—"} sets ×{" "}
                                        {exercise.target_reps ?? "—"} reps
                                        {(exercise.target_sets === null ||
                                          exercise.target_reps === null) && " · target optional"}
                                      </span>
                                    </span>
                                    <span className="flex shrink-0 gap-1">
                                      <button
                                        type="button"
                                        className="px-1 text-[10px] text-[#9ba69e] hover:text-white"
                                        onClick={() => {
                                          setAddingExerciseTo(null);
                                          setEditingExercise(exercise);
                                        }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        className="px-1 text-[10px] text-[#d69b97] hover:text-white"
                                        disabled={pending}
                                        onClick={() => {
                                          if (window.confirm(`Delete ${exercise.name}?`)) {
                                            void perform(() =>
                                              deletePlannedExerciseAction(exercise.id),
                                            );
                                          }
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[10px] text-[#7d8780]">No exercises added yet.</p>
                            )}
                            {(addingExerciseTo === workout.id ||
                              editingExercise?.planned_workout_id === workout.id) && (
                              <form
                                key={editingExercise?.id ?? `${workout.id}-new`}
                                className="mt-3 grid gap-2 rounded-lg border border-[#343a36] bg-[#171a18] p-3"
                                onSubmit={(event) =>
                                  submitForm(event, savePlannedExerciseAction, () => {
                                    setAddingExerciseTo(null);
                                    setEditingExercise(null);
                                  })
                                }
                              >
                                <input
                                  type="hidden"
                                  name="planned_workout_id"
                                  value={workout.id}
                                />
                                {editingExercise && (
                                  <input
                                    type="hidden"
                                    name="id"
                                    value={editingExercise.id}
                                  />
                                )}
                                <label className="text-[10px] font-medium text-[#aeb6af]">
                                  Exercise name
                                  <input
                                    className={inputClass}
                                    name="name"
                                    required
                                    maxLength={120}
                                    defaultValue={editingExercise?.name ?? ""}
                                    placeholder="e.g. Romanian deadlift"
                                  />
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                  <label className="text-[10px] font-medium text-[#aeb6af]">
                                    Target sets (optional)
                                    <input
                                      className={inputClass}
                                      name="target_sets"
                                      type="number"
                                      min={1}
                                      step={1}
                                      defaultValue={editingExercise?.target_sets ?? ""}
                                      placeholder="—"
                                    />
                                  </label>
                                  <label className="text-[10px] font-medium text-[#aeb6af]">
                                    Target reps (optional)
                                    <input
                                      className={inputClass}
                                      name="target_reps"
                                      type="number"
                                      min={1}
                                      step={1}
                                      defaultValue={editingExercise?.target_reps ?? ""}
                                      placeholder="—"
                                    />
                                  </label>
                                </div>
                                <p className="text-[10px] leading-4 text-[#7f8981]">
                                  You can leave targets blank and record actual sets and reps during the workout.
                                </p>
                                <div className="flex gap-2">
                                  <button className={primaryButtonClass} disabled={pending}>
                                    {editingExercise ? "Save exercise" : "Add exercise"}
                                  </button>
                                  <button
                                    type="button"
                                    className={buttonClass}
                                    onClick={() => {
                                      setAddingExerciseTo(null);
                                      setEditingExercise(null);
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            )}
                            {!addingExerciseTo && !editingExercise && (
                              <button
                                type="button"
                                className="mt-3 text-[10px] font-semibold text-[#61d987] hover:text-[#9aeab2]"
                                onClick={() => setAddingExerciseTo(workout.id)}
                              >
                                + Add exercise
                              </button>
                            )}
                            <button
                              type="button"
                              className={`${buttonClass} mt-3 min-h-9 w-full border-[#36533d] text-[#8be3a2]`}
                              disabled={pending}
                              onClick={() =>
                                void perform(
                                  () => startPlannedWorkoutAction(workout.id),
                                  (workoutId) => {
                                    if (workoutId) {
                                      router.push(`/training-plans/workouts/${workoutId}`);
                                    }
                                  },
                                )
                              }
                            >
                              Start this workout
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {addingDay ? (
                  <form
                    className="mt-4 grid gap-3 rounded-xl border border-[#343a36] bg-[#171a18] p-4 sm:grid-cols-[100px_1fr_auto] sm:items-end"
                    onSubmit={(event) =>
                      submitForm(event, createPlannedWorkoutAction, () => setAddingDay(false))
                    }
                  >
                    <input type="hidden" name="training_plan_id" value={selectedPlan.id} />
                    <input type="hidden" name="week_number" value={week} />
                    <label className="text-xs font-medium text-[#aeb6af]">
                      Day
                      <select className={inputClass} name="day_number" required defaultValue={availableDays[0]}>
                        {availableDays.map((dayNumber) => (
                          <option key={dayNumber} value={dayNumber}>
                            Day {dayNumber}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-medium text-[#aeb6af]">
                      Workout name
                      <input
                        className={inputClass}
                        name="title"
                        maxLength={120}
                        placeholder="e.g. Strength · Upper body"
                      />
                    </label>
                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      <label className="flex min-h-11 items-center gap-2 text-xs text-[#c2c9c3]">
                        <input
                          className="size-4 accent-[#22c55e]"
                          type="checkbox"
                          name="is_rest_day"
                          onChange={(event) => {
                            const input = event.currentTarget.form?.elements.namedItem("title");
                            if (input instanceof HTMLInputElement) {
                              input.disabled = event.currentTarget.checked;
                              input.required = !event.currentTarget.checked;
                            }
                          }}
                        />
                        Rest day
                      </label>
                      <button className={primaryButtonClass} disabled={pending || !availableDays.length}>
                        Add day
                      </button>
                      <button
                        type="button"
                        className={buttonClass}
                        onClick={() => setAddingDay(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    className={`${buttonClass} mt-4 w-full border-dashed`}
                    onClick={() => {
                      setAddingExerciseTo(null);
                      setEditingExercise(null);
                      setAddingDay(true);
                    }}
                    disabled={availableDays.length === 0}
                  >
                    {availableDays.length ? "+ Add workout day" : "All 7 days are scheduled"}
                  </button>
                )}
              </Panel>
            </section>
          ) : (
            <Panel className="grid min-h-52 place-items-center p-8 text-center">
              <div>
                <p className="font-semibold text-white">Your weekly schedule starts here</p>
                <p className="mt-2 text-sm text-[#929c94]">
                  Create a plan to add workout days, rest days, and exercises.
                </p>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </main>
  );
}
