"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createGoalAction,
  deleteGoalAction,
  toggleGoalCompleteAction,
  updateGoalAction,
} from "@/app/actions/goals";
import type {
  GoalWithProgress,
  GoalsProgressData,
} from "@/lib/goals/goals-progress";
import type { Database } from "@/lib/supabase/database.types";

type GoalRow = Database["public"]["Tables"]["goals"]["Row"];
type GoalType = GoalRow["goal_type"];
type GoalActionResult =
  | { success: true; message?: string }
  | { success: false; message: string };

const cardClass = "rounded-2xl border border-[#34383d] bg-[#191c1a]";
const inputClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-[#343a36] bg-[#121513] px-3 text-sm text-white placeholder:text-[#667069] focus:border-[#22c55e] focus:outline-none";
const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-xl border border-[#3a413c] px-3.5 text-xs font-semibold text-[#d3d9d4] transition hover:border-[#536258] hover:bg-[#232824] disabled:cursor-not-allowed disabled:opacity-50";
const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-xl bg-[#22c55e] px-4 text-xs font-bold text-[#101510] transition hover:bg-[#4ade80] disabled:cursor-not-allowed disabled:opacity-50";

function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en", { maximumFractionDigits }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
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
  return <section className={`${cardClass} ${className}`}>{children}</section>;
}

function StreakStat({
  label,
  value,
  unit,
  note,
}: {
  label: string;
  value: number;
  unit: string;
  note: string;
}) {
  return (
    <Panel className="p-4 sm:p-5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#849087]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
        {formatNumber(value)}
        <span className="ml-1.5 text-xs font-medium tracking-normal text-[#9ba49d]">
          {unit}
        </span>
      </p>
      <p className="mt-1.5 text-[10px] leading-4 text-[#7f8981]">{note}</p>
    </Panel>
  );
}

function GoalProgress({
  goal,
}: {
  goal: GoalWithProgress;
}) {
  if (goal.progress.kind === "weekly_workouts") {
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between gap-2 text-[10px]">
          <span className="font-medium text-[#cbd1cb]">
            {goal.progress.completedWorkouts} of {goal.progress.targetWorkouts} workouts
          </span>
          <span className="text-[#8de3a5]">{goal.progress.progressPercent}%</span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-[#2b312d]"
          role="progressbar"
          aria-label={`${goal.title} progress`}
          aria-valuenow={goal.progress.progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#16803b] to-[#45dd72]"
            style={{ width: `${goal.progress.progressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-[9px] text-[#7f8981]">
          Week of {formatDate(goal.progress.weekStart)}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-2 text-[10px]">
        <span className="font-medium text-[#cbd1cb]">
          {goal.progress.bestSet
            ? `Best set: ${formatNumber(goal.progress.bestSet.weightKg, 2)} kg × ${goal.progress.bestSet.reps} reps`
            : "No completed sets for this exercise yet"}
        </span>
        <span className="shrink-0 text-[#8de3a5]">{goal.progress.progressPercent}%</span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-[#2b312d]"
        role="progressbar"
        aria-label={`${goal.title} progress`}
        aria-valuenow={goal.progress.progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#16803b] to-[#45dd72]"
          style={{ width: `${goal.progress.progressPercent}%` }}
        />
      </div>
      <p className="mt-2 text-[9px] text-[#7f8981]">
        {goal.target_weight_kg !== null &&
          `Target ${formatNumber(goal.target_weight_kg, 2)} kg`}
        {goal.target_weight_kg !== null && goal.target_reps !== null && " · "}
        {goal.target_reps !== null && `${goal.target_reps} reps`}
        {goal.progress.achieved && " · Target reached"}
      </p>
    </div>
  );
}

function GoalCard({
  goal,
  pending,
  onEdit,
  onDelete,
  onToggle,
}: {
  goal: GoalWithProgress;
  pending: boolean;
  onEdit: (goal: GoalWithProgress) => void;
  onDelete: (goal: GoalWithProgress) => void;
  onToggle: (goal: GoalWithProgress) => void;
}) {
  const isComplete = goal.completed_at !== null;

  return (
    <article
      className={`${cardClass} p-4 sm:p-5 ${
        isComplete ? "opacity-75" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-white">{goal.title}</h3>
            <span className="rounded-full border border-[#39413b] bg-[#202421] px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-[#9ca69e]">
              {goal.goal_type === "weekly_workouts" ? "Weekly workouts" : goal.exercise_name}
            </span>
            {isComplete && (
              <span className="rounded-full border border-[#315c3a] bg-[#1b2c20] px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-[#8de3a5]">
                Complete
              </span>
            )}
          </div>
          {goal.target_date && (
            <p className="mt-2 text-[10px] text-[#89938b]">
              Target date · {formatDate(goal.target_date)}
            </p>
          )}
        </div>
      </div>

      <GoalProgress goal={goal} />

      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#2b302c] pt-3">
        <button
          type="button"
          className={buttonClass}
          disabled={pending}
          onClick={() => onToggle(goal)}
        >
          {isComplete ? "Mark active" : "Mark complete"}
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={pending}
          onClick={() => onEdit(goal)}
        >
          Edit
        </button>
        <button
          type="button"
          className={`${buttonClass} text-[#e2a6a2] hover:border-[#704342] hover:bg-[#2b1d1d]`}
          disabled={pending}
          onClick={() => onDelete(goal)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export function GoalsManager({
  initialData,
}: {
  initialData: GoalsProgressData;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithProgress | null>(null);
  const [goalType, setGoalType] = useState<GoalType>("exercise_target");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const activeGoals = initialData.goals.filter((goal) => !goal.completed_at);

  function closeForm() {
    setCreating(false);
    setEditingGoal(null);
    setGoalType("exercise_target");
  }

  function beginCreate(type: GoalType = "exercise_target") {
    setEditingGoal(null);
    setGoalType(type);
    setCreating(true);
  }

  function beginEdit(goal: GoalWithProgress) {
    setEditingGoal(goal);
    setGoalType(goal.goal_type);
    setCreating(true);
  }

  async function perform(action: () => Promise<GoalActionResult>) {
    setPending(true);
    setMessage("");
    setErrorMessage("");
    try {
      const result = await action();
      if (!result.success) {
        setErrorMessage(result.message);
        return false;
      }
      setMessage(result.message ?? "");
      router.refresh();
      return true;
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function submitGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const succeeded = await perform(() =>
      editingGoal ? updateGoalAction(formData) : createGoalAction(formData),
    );
    if (succeeded) closeForm();
  }

  function deleteGoal(goal: GoalWithProgress) {
    if (!window.confirm(`Delete "${goal.title}"? This cannot be undone.`)) return;
    void perform(() => deleteGoalAction(goal.id));
  }

  function toggleGoal(goal: GoalWithProgress) {
    void perform(() =>
      toggleGoalCompleteAction(goal.id, goal.completed_at === null),
    );
  }

  const legacyCurrentTarget =
    initialData.currentWeeklyGoal?.title === "Weekly workout target";

  return (
    <main className="min-h-screen bg-[#121212] px-4 pb-20 pt-6 text-[#f4f4f5] sm:px-7 sm:pt-9 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-xs font-medium text-[#95a098] transition hover:text-[#5fdf87]"
        >
          ← Dashboard
        </Link>
        <header className="mb-6 mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#758078]">
              IRONMAN · Strength training
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              Goals & streaks
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#929c94]">
              Set strength milestones, track weekly training, and build consistency one session at a time.
            </p>
          </div>
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => beginCreate()}
          >
            + New goal
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

        <section aria-labelledby="streaks-heading">
          <div className="mb-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#768078]">
              Consistency
            </p>
            <h2 id="streaks-heading" className="mt-1 text-lg font-semibold text-white">
              Streaks & weekly target
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StreakStat
              label="Current weekly streak"
              value={initialData.currentWeeklyStreak}
              unit="weeks"
              note="Consecutive weeks with a completed workout"
            />
            <StreakStat
              label="Longest weekly streak"
              value={initialData.longestWeeklyStreak}
              unit="weeks"
              note="Your best run of active training weeks"
            />
            <StreakStat
              label="Active day streak"
              value={initialData.currentActiveDayStreak}
              unit="days"
              note="Consecutive UTC dates with a completed workout"
            />
            <Panel className="p-4 sm:p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#849087]">
                This week
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                {initialData.workoutsThisWeek}
                <span className="ml-1.5 text-xs font-medium tracking-normal text-[#9ba49d]">
                  workouts
                </span>
              </p>
              {initialData.currentWeeklyGoal ? (
                <>
                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-[#2b312d]"
                    role="progressbar"
                    aria-label="Weekly workout target progress"
                    aria-valuenow={initialData.currentWeeklyGoal.progressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#16803b] to-[#45dd72]"
                      style={{
                        width: `${initialData.currentWeeklyGoal.progressPercent}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[9px] text-[#7f8981]">
                    {initialData.currentWeeklyGoal.completedWorkouts} /{" "}
                    {initialData.currentWeeklyGoal.targetWorkouts} ·{" "}
                    {initialData.currentWeeklyGoal.title}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-[9px] text-[#7f8981]">
                  No weekly workout target set
                </p>
              )}
            </Panel>
          </div>
          {legacyCurrentTarget && (
            <p className="mt-2 text-[9px] text-[#7f8981]">
              Weekly target progress is using your saved training target.
            </p>
          )}
        </section>

        {creating && (
          <Panel className="mt-6 p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">
                {editingGoal ? "Edit goal" : "Create a goal"}
              </h2>
              <button type="button" className={buttonClass} onClick={closeForm}>
                Cancel
              </button>
            </div>
            <form
              key={editingGoal?.id ?? "new-goal"}
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={submitGoal}
            >
              {editingGoal && <input type="hidden" name="id" value={editingGoal.id} />}
              <label className="text-xs font-medium text-[#aeb6af]">
                Goal type
                <select
                  className={inputClass}
                  name="goal_type"
                  value={goalType}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    if (value === "exercise_target" || value === "weekly_workouts") {
                      setGoalType(value);
                    }
                  }}
                >
                  <option value="exercise_target">Exercise strength target</option>
                  <option value="weekly_workouts">Weekly workout count</option>
                </select>
              </label>
              <label className="text-xs font-medium text-[#aeb6af]">
                Goal name
                <input
                  className={inputClass}
                  name="title"
                  required
                  maxLength={120}
                  defaultValue={editingGoal?.title ?? ""}
                  placeholder={
                    goalType === "weekly_workouts"
                      ? "e.g. Train four times this week"
                      : "e.g. Build my squat"
                  }
                />
              </label>

              {goalType === "exercise_target" ? (
                <>
                  <label className="text-xs font-medium text-[#aeb6af]">
                    Exercise name
                    <input
                      className={inputClass}
                      name="exercise_name"
                      required
                      maxLength={120}
                      defaultValue={editingGoal?.exercise_name ?? ""}
                      placeholder="e.g. Barbell squat"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs font-medium text-[#aeb6af]">
                      Target weight (kg)
                      <input
                        className={inputClass}
                        name="target_weight_kg"
                        type="number"
                        min="0.01"
                        max="99999.99"
                        step="0.01"
                        defaultValue={editingGoal?.target_weight_kg ?? ""}
                        placeholder="Optional"
                      />
                    </label>
                    <label className="text-xs font-medium text-[#aeb6af]">
                      Target reps
                      <input
                        className={inputClass}
                        name="target_reps"
                        type="number"
                        min="1"
                        max="10000"
                        step="1"
                        defaultValue={editingGoal?.target_reps ?? ""}
                        placeholder="Optional"
                      />
                    </label>
                  </div>
                </>
              ) : (
                <label className="text-xs font-medium text-[#aeb6af]">
                  Workouts per week
                  <input
                    className={inputClass}
                    name="target_workouts"
                    type="number"
                    required
                    min="1"
                    max="1000"
                    step="1"
                    defaultValue={editingGoal?.target_workouts ?? ""}
                    placeholder="e.g. 4"
                  />
                </label>
              )}
              <label className="text-xs font-medium text-[#aeb6af]">
                Target date <span className="font-normal text-[#7d8780]">(optional)</span>
                <input
                  className={inputClass}
                  name="target_date"
                  type="date"
                  defaultValue={editingGoal?.target_date ?? ""}
                />
              </label>
              <div className="flex items-end gap-2">
                <button className={primaryButtonClass} disabled={pending}>
                  {pending ? "Saving…" : editingGoal ? "Save changes" : "Create goal"}
                </button>
              </div>
              <p className="text-[10px] leading-4 text-[#7f8981] sm:col-span-2">
                Exercise goals need a weight target, reps target, or both. Weekly goals are measured against completed workouts in the target date’s week (or this week when no date is set).
              </p>
            </form>
          </Panel>
        )}

        <section className="mt-8" aria-labelledby="goals-heading">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#768078]">
                Strength & workouts
              </p>
              <h2 id="goals-heading" className="mt-1 text-lg font-semibold text-white">
                Your goals
              </h2>
            </div>
            <span className="text-[10px] text-[#849087]">
              {activeGoals.length} active · {initialData.goals.length} total
            </span>
          </div>

          {initialData.goals.length === 0 ? (
            <Panel className="px-5 py-10 text-center sm:px-8">
              <h3 className="text-base font-semibold text-white">No goals yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#929c94]">
                Add a strength target or weekly workout goal to start tracking your progress.
              </p>
              <button
                type="button"
                className={`${primaryButtonClass} mt-5`}
                onClick={() => beginCreate()}
              >
                Create your first goal
              </button>
            </Panel>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {initialData.goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  pending={pending}
                  onEdit={beginEdit}
                  onDelete={deleteGoal}
                  onToggle={toggleGoal}
                />
              ))}
            </div>
          )}
        </section>
        <p className="mt-5 text-[9px] text-[#69736c]">
          Streaks and workout targets are based on completed workouts. Dates use UTC because no account timezone is stored.
        </p>
      </div>
    </main>
  );
}
