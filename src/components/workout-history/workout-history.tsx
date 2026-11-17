import Link from "next/link";

type CompletedWorkoutSummary = {
  id: string;
  title: string;
  completed_at: string | null;
  exerciseCount: number;
  setCount: number;
};

function formatCompletionDate(value: string | null) {
  if (!value) return "Completion date unavailable";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function WorkoutHistory({
  workouts,
}: {
  workouts: CompletedWorkoutSummary[];
}) {
  return (
    <main className="min-h-screen bg-[#121212] px-4 pb-20 pt-6 text-[#f4f4f5] sm:px-7 sm:pt-9 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-xs font-medium text-[#95a098] transition hover:text-[#5fdf87]"
        >
          ← Dashboard
        </Link>
        <header className="mb-7 mt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#758078]">
            IRONMAN · Training
          </p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                Workout history
              </h1>
              <p className="mt-2 text-sm text-[#929c94]">
                Review completed sessions, exercises, and logged sets.
              </p>
            </div>
            <span className="rounded-full border border-[#354039] bg-[#1a211c] px-3 py-1.5 text-xs font-medium text-[#8de3a5]">
              {workouts.length} completed
            </span>
          </div>
        </header>

        {workouts.length === 0 ? (
          <section className="rounded-2xl border border-[#34383d] bg-[#191c1a] px-5 py-12 text-center sm:px-8">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-[#36533d] bg-[#1d2921] text-[#65dc88]">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-white">No completed workouts yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#929c94]">
              Completed training sessions will appear here so you can review your logged sets and weights.
            </p>
            <Link
              href="/training-plans"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#22c55e] px-4 text-xs font-bold text-[#101510] transition hover:bg-[#4ade80]"
            >
              View training plans
            </Link>
          </section>
        ) : (
          <ol className="space-y-3">
            {workouts.map((workout) => (
              <li
                key={workout.id}
                className="flex flex-col gap-4 rounded-2xl border border-[#34383d] bg-[#191c1a] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex min-w-0 items-start gap-3.5">
                  <div className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl border border-[#36533d] bg-[#1d2921] text-[#65dc88]">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="size-[18px]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 12h4l3-8 4 16 3-8h4" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-white">
                      {workout.title}
                    </h2>
                    <p className="mt-1 text-xs text-[#8f9991]">
                      Completed {formatCompletionDate(workout.completed_at)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#aeb6af]">
                      <span>
                        <strong className="font-semibold text-[#dfe4df]">
                          {workout.exerciseCount}
                        </strong>{" "}
                        {workout.exerciseCount === 1 ? "exercise" : "exercises"}
                      </span>
                      <span>
                        <strong className="font-semibold text-[#dfe4df]">
                          {workout.setCount}
                        </strong>{" "}
                        {workout.setCount === 1 ? "set" : "sets"}
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/training-plans/workouts/${workout.id}`}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-[#3b5641] px-4 text-xs font-semibold text-[#8de3a5] transition hover:bg-[#1d2921] hover:text-[#b2f0c2]"
                >
                  View details
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}
