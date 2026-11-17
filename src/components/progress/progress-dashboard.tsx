import Link from "next/link";
import type {
  ExerciseProgress,
  StrengthProgressData,
} from "@/lib/progress/strength-progress";

const cardClass = "rounded-2xl border border-[#34383d] bg-[#191c1a]";

function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en", { maximumFractionDigits }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatWeekRange(weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const startMonth = new Intl.DateTimeFormat("en", {
    month: "short",
    timeZone: "UTC",
  }).format(start);
  const endMonth = new Intl.DateTimeFormat("en", {
    month: "short",
    timeZone: "UTC",
  }).format(end);
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  return startMonth === endMonth
    ? `${startMonth} ${startDay}–${endDay}`
    : `${startMonth} ${startDay}–${endMonth} ${endDay}`;
}

function SummaryCard({
  label,
  value,
  unit,
  note,
  icon,
}: {
  label: string;
  value: string;
  unit: string;
  note: string;
  icon: string;
}) {
  return (
    <section className={`${cardClass} p-4 sm:p-5`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium text-[#949c96]">{label}</p>
        <span className="grid size-8 place-items-center rounded-lg bg-[#243128] text-[10px] font-bold text-[#69dc89]">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">
        {value}
        <span className="ml-1.5 text-xs font-medium tracking-normal text-[#9ca49e]">
          {unit}
        </span>
      </p>
      <p className="mt-1 text-[10px] text-[#778079]">{note}</p>
    </section>
  );
}

function WeeklyTrend({ progress }: { progress: StrengthProgressData }) {
  const maxVolume = Math.max(
    1,
    ...progress.weeklyProgress.map((week) => week.volumeKg),
  );

  return (
    <section className={`${cardClass} p-4 sm:p-6`}>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#77827a]">
          Consistency & workload
        </p>
        <h2 className="mt-1 text-base font-semibold text-white">
          Weekly training trend
        </h2>
        <p className="mt-1 text-xs text-[#8b958d]">
          Completed strength workouts and logged volume over the last eight weeks.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {progress.weeklyProgress.map((week) => {
          const height = week.volumeKg
            ? Math.max(5, (week.volumeKg / maxVolume) * 100)
            : 3;
          return (
            <div
              key={week.weekStart}
              className="rounded-xl border border-[#2d332f] bg-[#171a18] p-3"
            >
              <p className="text-[10px] font-medium text-[#aeb6af]">
                {formatWeekRange(week.weekStart)}
              </p>
              <div className="mt-3 flex h-24 items-end rounded-lg bg-[#202421] px-2 pb-2">
                <div
                  role="progressbar"
                  aria-label={`${formatWeekRange(week.weekStart)} training volume`}
                  aria-valuenow={week.volumeKg}
                  aria-valuemin={0}
                  aria-valuemax={maxVolume}
                  className="w-full rounded-md bg-gradient-to-t from-[#16803b] to-[#45dd72]"
                  style={{ height: `${height}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-semibold text-white">
                {week.workouts} {week.workouts === 1 ? "workout" : "workouts"}
              </p>
              <p className="mt-0.5 text-[10px] text-[#829087]">
                {formatNumber(week.volumeKg, 2)} kg
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ExerciseProgressCard({ exercise }: { exercise: ExerciseProgress }) {
  const maxSessionVolume = Math.max(
    1,
    ...exercise.recentSessions.map((session) => session.volumeKg),
  );

  return (
    <article className={`${cardClass} p-4 sm:p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{exercise.name}</h3>
          <p className="mt-1 text-[10px] text-[#859087]">
            {exercise.sessions} {exercise.sessions === 1 ? "session" : "sessions"} ·{" "}
            {exercise.totalSets} {exercise.totalSets === 1 ? "set" : "sets"}
          </p>
        </div>
        <span className="rounded-full border border-[#3b5641] bg-[#1d2921] px-2.5 py-1 text-[10px] font-semibold text-[#8de3a5]">
          Max {formatNumber(exercise.maxWeightKg, 2)} kg
        </span>
      </div>

      <p className="mt-4 text-sm font-semibold text-[#dfe4df]">
        {formatNumber(exercise.totalVolumeKg, 2)}{" "}
        <span className="text-[10px] font-medium text-[#8d978f]">kg total volume</span>
      </p>

      <div className="mt-4 border-t border-[#2d332f] pt-3">
        <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-[#77827a]">
          Recent session volume
        </p>
        {exercise.recentSessions.length ? (
          <ol className="space-y-2.5">
            {exercise.recentSessions.map((session) => {
              const width = session.volumeKg
                ? Math.max(4, (session.volumeKg / maxSessionVolume) * 100)
                : 4;
              return (
                <li
                  key={session.workoutId}
                  className="grid grid-cols-[76px_1fr_auto] items-center gap-2 text-[10px]"
                >
                  <span className="text-[#909a92]">{formatDate(session.completedAt)}</span>
                  <div
                    role="progressbar"
                    aria-label={`${exercise.name} session volume on ${formatDate(session.completedAt)}`}
                    aria-valuenow={session.volumeKg}
                    aria-valuemin={0}
                    aria-valuemax={maxSessionVolume}
                    className="h-2 overflow-hidden rounded-full bg-[#303531]"
                  >
                    <div
                      className="h-full rounded-full bg-[#35d76d]"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="whitespace-nowrap text-[#c2c9c3]">
                    {session.setCount} × {formatNumber(session.volumeKg, 2)} kg
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-xs text-[#818a83]">No sessions to chart yet.</p>
        )}
      </div>
    </article>
  );
}

export function ProgressDashboard({
  progress,
}: {
  progress: StrengthProgressData;
}) {
  return (
    <main className="min-h-screen bg-[#121212] px-4 pb-20 pt-6 text-[#f4f4f5] sm:px-7 sm:pt-9 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-xs font-medium text-[#95a098] transition hover:text-[#5fdf87]"
        >
          ← Dashboard
        </Link>
        <header className="mb-7 mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#758078]">
              IRONMAN · Strength training
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              Progress & statistics
            </h1>
            <p className="mt-2 text-sm text-[#929c94]">
              Training volume and progression from your completed strength sessions.
            </p>
          </div>
          <Link
            href="/training-plans"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#3a413c] px-4 text-xs font-semibold text-[#d3d9d4] transition hover:bg-[#232824]"
          >
            Training plans
          </Link>
        </header>

        <section
          aria-label="Overall strength and volume summary"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <SummaryCard
            label="Completed workouts"
            value={formatNumber(progress.totalCompletedWorkouts)}
            unit="total"
            note="Completed strength sessions"
            icon="WK"
          />
          <SummaryCard
            label="Training volume"
            value={formatNumber(progress.totalTrainingVolumeKg, 2)}
            unit="kg"
            note="Reps × weight across logged sets"
            icon="KG"
          />
          <SummaryCard
            label="Sets logged"
            value={formatNumber(progress.totalSetsLogged)}
            unit="sets"
            note="Across completed workouts"
            icon="SET"
          />
          <SummaryCard
            label="Workouts this week"
            value={formatNumber(progress.workoutsThisWeek)}
            unit="workouts"
            note="Monday through Sunday"
            icon="7D"
          />
        </section>

        <div className="mt-5">
          <WeeklyTrend progress={progress} />
        </div>

        <section className="mt-8">
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#77827a]">
              Lift-by-lift
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">Exercise progress</h2>
            <p className="mt-1 text-xs text-[#8b958d]">
              Sessions, logged sets, volume, max weight, and recent session trends.
            </p>
          </div>
          {progress.exerciseProgress.length ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {progress.exerciseProgress.map((exercise) => (
                <ExerciseProgressCard key={exercise.name.toLocaleLowerCase()} exercise={exercise} />
              ))}
            </div>
          ) : (
            <section className={`${cardClass} px-5 py-10 text-center`}>
              <h3 className="font-semibold text-white">No strength sets recorded yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#929c94]">
                Complete a workout and log sets to see exercise-specific volume and progress here.
              </p>
              <Link
                href="/training-plans"
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-[#22c55e] px-4 text-xs font-bold text-[#101510] transition hover:bg-[#4ade80]"
              >
                View training plans
              </Link>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
