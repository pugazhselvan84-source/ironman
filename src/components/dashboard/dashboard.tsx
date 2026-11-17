import type { ReactNode } from "react";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type {
  StrengthProgressData,
  WeeklyProgress,
} from "@/lib/progress/strength-progress";
import type {
  GoalWithProgress,
  GoalsProgressData,
} from "@/lib/goals/goals-progress";
import type { PersonalRecord } from "@/lib/records/personal-records";

type IconName =
  | "activity"
  | "calendar"
  | "chart"
  | "check"
  | "chevron-right"
  | "clock"
  | "grid"
  | "more"
  | "search"
  | "settings"
  | "target"
  | "trophy"
  | "user";

const iconShapes: Record<IconName, ReactNode> = {
  activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="m7 14 4-4 4 3 6-7" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  settings: (
    <>
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      <path d="m19.4 15 .1.1 1.2.9-1.2 2.1-1.4-.6a8 8 0 0 1-1.5.9l-.2 1.5h-2.5l-.3-1.5a8 8 0 0 1-1.6-.9l-1.4.6-1.2-2.1 1.2-.9a7 7 0 0 1 0-1.8l-1.2-.9 1.2-2.1 1.4.6a8 8 0 0 1 1.6-.9l.3-1.5h2.5l.2 1.5a8 8 0 0 1 1.5.9l1.4-.6 1.2 2.1-1.2.9a7 7 0 0 1-.1 1.7Z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 12 19 5m-3 0h3v3" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 21h8m-4-4v4m-5-18h10v5a5 5 0 0 1-10 0V3Z" />
      <path d="M7 6H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </>
  ),
};

function Icon({
  name,
  className = "size-5",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {iconShapes[name]}
    </svg>
  );
}

const navigation: { label: string; href: string; icon: IconName }[] = [
  { label: "Overview", href: "#overview", icon: "grid" },
  { label: "Training plan", href: "/training-plans", icon: "calendar" },
  { label: "Workout history", href: "/history", icon: "clock" },
  { label: "Progress", href: "/progress", icon: "chart" },
  { label: "Personal records", href: "/records", icon: "trophy" },
  { label: "Goals", href: "/goals", icon: "target" },
  { label: "Profile", href: "/profile", icon: "user" },
];

function ShieldMark({ className = "size-10" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 44 48"
      fill="none"
      className={className}
    >
      <path
        d="M22 2.5 39.5 9v12.7c0 11.2-7.3 18.5-17.5 23.8C11.8 40.2 4.5 32.9 4.5 21.7V9L22 2.5Z"
        fill="rgb(34 197 94 / 10%)"
        stroke="#22c55e"
        strokeWidth="2"
      />
      <path
        d="M24.7 9 15 25.2h7.1L19.3 38l9.8-17h-7.2L24.7 9Z"
        fill="#22c55e"
      />
      <path d="M11 13.5h4M29 34.5h4" stroke="#22c55e" strokeWidth="1.5" />
    </svg>
  );
}

function Brand() {
  return (
    <a href="#overview" className="flex min-w-0 items-center gap-3" aria-label="IRONMAN dashboard">
      <ShieldMark className="size-10 shrink-0" />
      <span className="min-w-0">
        <span className="block text-sm font-black tracking-[0.2em] text-white">IRONMAN</span>
        <span className="mt-1 block max-w-[190px] text-[9px] font-medium leading-4 tracking-[0.02em] text-muted">
          Track Your Progress. Build Your Strength.
        </span>
      </span>
    </a>
  );
}

function Sidebar({
  profileName,
  email,
}: {
  profileName: string;
  email: string;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-border bg-[#151716] px-5 py-7 lg:flex">
      <Brand />
      <div className="mt-12">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#69716b]">
          Training
        </p>
        <nav aria-label="Main navigation" className="space-y-1">
          {navigation.map((item, index) => (
            <a
              key={item.label}
              href={item.href}
              aria-current={index === 0 ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition ${
                index === 0
                  ? "bg-[#202923] text-[#57dc83]"
                  : "text-[#9ba29d] hover:bg-[#202321] hover:text-white"
              }`}
            >
              <Icon name={item.icon} className="size-[18px]" />
              {item.label}
              {index === 0 && <span className="ml-auto size-1.5 rounded-full bg-[#22c55e]" />}
            </a>
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t border-[#292e2b] pt-5">
        <a
          href="#settings"
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium text-[#9ba29d] transition hover:bg-[#202321] hover:text-white"
        >
          <Icon name="settings" className="size-[18px]" />
          Settings
        </a>
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#1d201e] p-3">
          <div className="grid size-9 place-items-center rounded-full bg-[#28382d] text-xs font-bold text-[#78e59b]">
            {getInitials(profileName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">{profileName}</p>
            <p className="mt-1 truncate text-[10px] text-[#848c86]">
              {email && email !== profileName ? email : "Signed in"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MobileHeader() {
  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-4 lg:hidden">
      <Brand />
      <button
        type="button"
        aria-label="Notifications"
        className="grid size-10 place-items-center rounded-xl border border-[#303531] text-[#aeb5af]"
      >
        <Icon name="activity" className="size-[18px]" />
      </button>
    </div>
  );
}

function MobileNavigation() {
  const items = navigation;

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-7 border-t border-border bg-[#171918]/95 px-2 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-lg lg:hidden"
    >
      {items.map((item, index) => (
        <a
          key={item.label}
          href={item.href}
          aria-current={index === 0 ? "page" : undefined}
          className={`flex flex-col items-center gap-1.5 py-1 text-[9px] font-medium ${
            index === 0 ? "text-[#53d77d]" : "text-[#858d87]"
          }`}
        >
          <Icon name={item.icon} className="size-[19px]" />
          <span>
            {item.label === "Workout history"
              ? "History"
              : item.label === "Personal records"
                ? "Records"
                : item.label === "Goals"
                  ? "Goals"
                : item.label.replace("Training plan", "Train")}
          </span>
        </a>
      ))}
    </nav>
  );
}

function SectionHeading({
  eyebrow,
  title,
  action,
  actionHref,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  actionHref?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#768078]">
            {eyebrow}
          </p>
        )}
        <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-white sm:text-base">
          {title}
        </h2>
      </div>
      {action && (
        <Link
          href={actionHref ?? "#recent-workouts"}
          className="mb-0.5 inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-[#a8b0aa] transition hover:text-[#5fdf87]"
        >
          {action}
          <Icon name="chevron-right" className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

function Card({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`min-w-0 rounded-2xl border border-border bg-[#191c1a] ${className}`}
    >
      {children}
    </section>
  );
}

function StrengthOverviewCard() {
  return (
    <Card
      className="relative min-h-[250px] overflow-hidden border-[#344338] bg-[radial-gradient(ellipse_at_82%_15%,rgba(34,197,94,0.15),transparent_35%),linear-gradient(135deg,#1d241f_0%,#191c1a_58%)] p-5 sm:p-7"
      id="strength-overview"
    >
      <div className="absolute -right-10 -top-10 size-48 rounded-full border border-[#27362b] opacity-70 sm:size-64" />
      <div className="absolute -right-2 top-0 size-36 rounded-full border border-[#27362b] opacity-50 sm:size-48" />
      <div className="relative flex h-full flex-col">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#344239] bg-[#1d2921]/80 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.13em] text-[#7ce39b]">
          <span className="size-1.5 rounded-full bg-[#22c55e]" />
          Strength training
        </div>
        <div className="mt-7 max-w-lg">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8e9b91]">
            YOUR TRAINING, MEASURED
          </p>
          <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.045em] text-white sm:text-[32px]">
            Build strength with every session.
          </h2>
          <p className="mt-2 max-w-md text-xs leading-5 text-[#a0a9a2]">
            Review completed lifts, logged sets, and volume trends from your strength workouts.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/progress"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#22c55e] px-4 text-xs font-bold text-[#101510] transition hover:bg-[#4ade80]"
          >
            View progress
          </Link>
          <Link
            href="/training-plans"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#3b5641] px-4 text-xs font-semibold text-[#9be9b0] transition hover:bg-[#1d2921]"
          >
            Training plans
          </Link>
        </div>
      </div>
    </Card>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  unit,
  note,
}: {
  icon: IconName;
  label: string;
  value: string;
  unit: string;
  note: string;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="grid size-9 place-items-center rounded-xl bg-[#243128] text-[#59da80]">
          <Icon name={icon} className="size-[18px]" />
        </div>
        <span className="text-[9px] font-semibold text-[#65d988]">STRENGTH</span>
      </div>
      <p className="mt-5 text-[10px] font-medium text-[#949c96]">{label}</p>
      <p className="mt-1 text-[25px] font-semibold tracking-[-0.045em] text-white">
        {value}
        <span className="ml-1.5 text-[11px] font-medium tracking-normal text-[#9ca49e]">
          {unit}
        </span>
      </p>
      <p className="mt-1 text-[9px] text-[#778079]">{note}</p>
    </Card>
  );
}

function MissingStats({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-[#624e2f] bg-[#262116] px-4 py-3 text-xs text-[#e3bf77]"
    >
      {message}
    </div>
  );
}

function WeeklyStrengthTrend({ weeks }: { weeks: WeeklyProgress[] }) {
  const maxVolume = Math.max(1, ...weeks.map((week) => week.volumeKg));

  return (
    <Card className="p-5 sm:p-6" id="progress">
      <SectionHeading
        eyebrow="Last eight weeks"
        title="Strength volume & consistency"
        action="View progress"
        actionHref="/progress"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {weeks.map((week) => {
          const height = week.volumeKg
            ? Math.max(5, (week.volumeKg / maxVolume) * 100)
            : 3;
          const weekDate = new Date(`${week.weekStart}T00:00:00Z`);
          const label = new Intl.DateTimeFormat("en", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          }).format(weekDate);
          return (
            <div
              key={week.weekStart}
              className="rounded-xl border border-[#2d332f] bg-[#171a18] p-3"
            >
              <p className="text-[10px] font-medium text-[#aeb6af]">{label}</p>
              <div className="mt-2 flex h-16 items-end rounded-lg bg-[#202421] px-2 pb-1.5">
                <div
                  role="progressbar"
                  aria-label={`${label} training volume`}
                  aria-valuenow={week.volumeKg}
                  aria-valuemin={0}
                  aria-valuemax={maxVolume}
                  className="w-full rounded-md bg-gradient-to-t from-[#16803b] to-[#45dd72]"
                  style={{ height: `${height}%` }}
                />
              </div>
              <p className="mt-2 text-[10px] font-semibold text-white">
                {week.workouts} {week.workouts === 1 ? "workout" : "workouts"}
              </p>
              <p className="mt-0.5 text-[9px] text-[#829087]">
                {new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(
                  week.volumeKg,
                )}{" "}
                kg
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function TopPersonalRecords({
  records,
  message,
}: {
  records: PersonalRecord[];
  message?: string;
}) {
  const topRecords = [...records]
    .sort(
      (left, right) =>
        new Date(right.heaviestWeight.achievedAt).getTime() -
          new Date(left.heaviestWeight.achievedAt).getTime() ||
        right.heaviestWeight.weightKg - left.heaviestWeight.weightKg,
    )
    .slice(0, 3);

  return (
    <Card className="p-5 sm:p-6" id="top-lifts">
      <SectionHeading
        eyebrow="Strength milestones"
        title="Personal records"
        action="View all records"
        actionHref="/records"
      />
      {message ? (
        <p role="alert" className="mt-3 text-xs text-[#e3bf77]">
          {message}
        </p>
      ) : topRecords.length ? (
        <ol className="mt-3 divide-y divide-[#2b302c]">
          {topRecords.map((record) => (
            <li
              key={record.exerciseName.toLowerCase()}
              className="py-3 first:pt-1 last:pb-0"
            >
              <p className="truncate text-[11px] font-semibold text-[#e8ebe8]">
                {record.exerciseName}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-[10px] font-semibold text-[#8de3a5]">
                  {new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(
                    record.heaviestWeight.weightKg,
                  )}{" "}
                  kg × {record.heaviestWeight.reps} reps
                </p>
                <p className="text-[9px] text-[#858e87]">
                  {formatRecentWorkoutDate(record.heaviestWeight.achievedAt)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-[#343a36] bg-[#171a18] px-4 py-5 text-xs text-[#89938b]">
          Personal records will appear after you log strength sets.
        </p>
      )}
    </Card>
  );
}

function GoalProgressLabel({ goal }: { goal: GoalWithProgress }) {
  if (goal.progress.kind === "weekly_workouts") {
    return (
      <>
        {goal.progress.completedWorkouts}/{goal.progress.targetWorkouts} workouts this week
      </>
    );
  }
  if (!goal.progress.bestSet) return <>No completed sets yet</>;
  return (
    <>
      Best set {goal.progress.bestSet.weightKg} kg × {goal.progress.bestSet.reps} reps
    </>
  );
}

function GoalStreakOverview({
  data,
  message,
}: {
  data: GoalsProgressData | null;
  message?: string;
}) {
  const activeGoals = data?.goals.filter((goal) => !goal.completed_at) ?? [];

  return (
    <section className="mt-8">
      <SectionHeading
        eyebrow="Consistency"
        title="Goals & streaks"
        action="Manage goals"
        actionHref="/goals"
      />
      {message ? (
        <MissingStats message={message} />
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-4 sm:p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#849087]">
                Current weekly streak
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {data.currentWeeklyStreak}
                <span className="ml-1.5 text-xs font-medium text-[#9ba49d]">weeks</span>
              </p>
              <p className="mt-1 text-[9px] text-[#7f8981]">Consecutive active weeks</p>
            </Card>
            <Card className="p-4 sm:p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#849087]">
                Active day streak
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {data.currentActiveDayStreak}
                <span className="ml-1.5 text-xs font-medium text-[#9ba49d]">days</span>
              </p>
              <p className="mt-1 text-[9px] text-[#7f8981]">Consecutive completed workout dates</p>
            </Card>
            <Card className="p-4 sm:p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#849087]">
                Workouts this week
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {data.workoutsThisWeek}
                <span className="ml-1.5 text-xs font-medium text-[#9ba49d]">sessions</span>
              </p>
              {data.currentWeeklyGoal ? (
                <p className="mt-1 text-[9px] text-[#7f8981]">
                  Target {data.currentWeeklyGoal.completedWorkouts}/
                  {data.currentWeeklyGoal.targetWorkouts}
                </p>
              ) : (
                <p className="mt-1 text-[9px] text-[#7f8981]">No weekly target set</p>
              )}
            </Card>
            <Card className="p-4 sm:p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#849087]">
                Longest weekly streak
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {data.longestWeeklyStreak}
                <span className="ml-1.5 text-xs font-medium text-[#9ba49d]">weeks</span>
              </p>
              <p className="mt-1 text-[9px] text-[#7f8981]">Your best training run</p>
            </Card>
          </div>

          <Card className="mt-3 p-5 sm:p-6">
            <SectionHeading
              eyebrow={`${activeGoals.length} active`}
              title="Active goals"
              action="View all goals"
              actionHref="/goals"
            />
            {activeGoals.length ? (
              <ul className="divide-y divide-[#2b302c]">
                {activeGoals.slice(0, 3).map((goal) => (
                  <li
                    key={goal.id}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 first:pt-1 last:pb-0"
                  >
                    <span className="text-[11px] font-semibold text-[#e8ebe8]">
                      {goal.title}
                    </span>
                    <span className="text-[9px] text-[#89938b]">
                      <GoalProgressLabel goal={goal} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-[#343a36] bg-[#171a18] px-4 py-4 text-xs text-[#89938b]">
                You don’t have any active goals yet.
              </p>
            )}
          </Card>
        </>
      ) : (
        <MissingStats message="Your goals and streaks are currently unavailable." />
      )}
    </section>
  );
}

type RecentWorkout = {
  id: string;
  title: string;
  completed_at: string | null;
};

function formatRecentWorkoutDate(value: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function WorkoutHistory({
  workouts,
  message,
}: {
  workouts: RecentWorkout[];
  message?: string;
}) {
  return (
    <Card className="p-5 sm:p-6" id="recent-workouts">
      <SectionHeading
        eyebrow="Keep the momentum"
        title="Recent workouts"
        action="View history"
        actionHref="/history"
      />
      {message ? (
        <p role="alert" className="mt-3 text-xs text-[#e3bf77]">
          {message}
        </p>
      ) : workouts.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-[#343a36] bg-[#171a18] px-4 py-5">
          <p className="text-xs font-medium text-[#dce1dc]">No completed workouts yet</p>
          <p className="mt-1 text-[10px] leading-4 text-[#89938b]">
            Completed sessions will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-3 divide-y divide-[#2b302c]">
          {workouts.map((workout) => (
            <div
              key={workout.id}
              className="flex items-center gap-3 py-3.5 first:pt-1 last:pb-0"
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#243128] text-[#63dc88]">
                <Icon name="activity" className="size-[18px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-[#e8ebe8]">
                  {workout.title}
                </p>
                <p className="mt-1 text-[9px] text-[#858e87]">
                  Completed · {formatRecentWorkoutDate(workout.completed_at)}
                </p>
              </div>
              <Link
                href={`/training-plans/workouts/${workout.id}`}
                className="shrink-0 text-[10px] font-semibold text-[#8de3a5] hover:text-[#b2f0c2]"
              >
                Review
              </Link>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "A"
  );
}

function DashboardHeader({
  profileName,
  email,
  profileMessage,
}: {
  profileName: string;
  email: string;
  profileMessage?: string;
}) {
  const greetingName = profileName.split(/\s+/)[0] || "athlete";

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-5 pb-5 pt-6 sm:px-8 sm:pt-8 xl:px-10">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#818a83]">
          {new Intl.DateTimeFormat("en", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          }).format(new Date())}
        </p>
        <h1 className="mt-1.5 text-[23px] font-semibold tracking-[-0.045em] text-white sm:text-[27px]">
          Welcome back, {greetingName}<span className="text-[#63dd88]">.</span>
        </h1>
        {profileMessage && (
          <p role="status" className="mt-2 text-[10px] text-[#e3bf77]">
            {profileMessage}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Search"
          className="hidden size-10 place-items-center rounded-xl border border-[#303531] text-[#a3aba4] transition hover:border-[#465149] hover:text-white sm:grid"
        >
          <Icon name="search" className="size-[17px]" />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="hidden size-10 place-items-center rounded-xl border border-[#303531] text-[#a3aba4] transition hover:border-[#465149] hover:text-white sm:grid"
        >
          <Icon name="activity" className="size-[17px]" />
        </button>
        <div className="grid size-10 shrink-0 place-items-center rounded-full border border-[#3b4e40] bg-[#26372b] text-[10px] font-bold text-[#7de29b]">
          {getInitials(profileName)}
        </div>
        <div className="hidden max-w-40 min-w-0 md:block">
          <p className="truncate text-[11px] font-semibold text-white">{profileName}</p>
          <p className="truncate text-[9px] text-[#89918b]">{email}</p>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}

function DashboardFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 px-5 pb-7 pt-3 text-[9px] text-muted sm:px-8 xl:px-10">
      <span>IRONMAN · Track Your Progress. Build Your Strength.</span>
      <span>Consistency beats intensity.</span>
    </footer>
  );
}

export function Dashboard({
  profileName,
  email,
  profileMessage,
  recentWorkouts,
  recentWorkoutsMessage,
  progress,
  progressMessage,
  personalRecords,
  recordsMessage,
  goalsData,
  goalsMessage,
}: {
  profileName: string;
  email: string;
  profileMessage?: string;
  recentWorkouts: RecentWorkout[];
  recentWorkoutsMessage?: string;
  progress: StrengthProgressData | null;
  progressMessage?: string;
  personalRecords: PersonalRecord[];
  recordsMessage?: string;
  goalsData: GoalsProgressData | null;
  goalsMessage?: string;
}) {
  return (
    <div id="overview" className="min-h-screen bg-[#121212]">
      <Sidebar profileName={profileName} email={email} />
      <MobileHeader />
      <main className="min-w-0 pb-24 lg:ml-[252px] lg:pb-0">
        <DashboardHeader
          profileName={profileName}
          email={email}
          profileMessage={profileMessage}
        />
        <div className="mx-auto max-w-[1500px] px-5 pb-4 sm:px-8 xl:px-10">
          <StrengthOverviewCard />

          <div className="mt-4">
            {progress ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  icon="check"
                  label="Completed workouts"
                  value={new Intl.NumberFormat("en").format(
                    progress.totalCompletedWorkouts,
                  )}
                  unit="total"
                  note="Completed strength sessions"
                />
                <SummaryCard
                  icon="activity"
                  label="Total training volume"
                  value={new Intl.NumberFormat("en", {
                    maximumFractionDigits: 2,
                  }).format(progress.totalTrainingVolumeKg)}
                  unit="kg"
                  note="Reps × weight across completed sets"
                />
                <SummaryCard
                  icon="grid"
                  label="Total sets logged"
                  value={new Intl.NumberFormat("en").format(progress.totalSetsLogged)}
                  unit="sets"
                  note="From completed workouts"
                />
                <SummaryCard
                  icon="calendar"
                  label="Workouts this week"
                  value={new Intl.NumberFormat("en").format(progress.workoutsThisWeek)}
                  unit="workouts"
                  note="Monday through Sunday"
                />
              </div>
            ) : (
              <MissingStats
                message={progressMessage ?? "Strength statistics are currently unavailable."}
              />
            )}
          </div>

          <GoalStreakOverview data={goalsData} message={goalsMessage} />

          <div className="mt-8">
            <SectionHeading eyebrow="Your training" title="Progress & consistency" />
            <div className="grid gap-4 xl:grid-cols-12">
              <div className="xl:col-span-8">
                {progress ? (
                  <WeeklyStrengthTrend weeks={progress.weeklyProgress} />
                ) : (
                  <MissingStats
                    message={progressMessage ?? "Strength trends are currently unavailable."}
                  />
                )}
              </div>
              <div className="xl:col-span-4">
                <TopPersonalRecords
                  records={personalRecords}
                  message={recordsMessage}
                />
              </div>
            </div>
          </div>

          <div className="mt-8">
            <WorkoutHistory
              workouts={recentWorkouts}
              message={recentWorkoutsMessage}
            />
          </div>
        </div>
        <DashboardFooter />
      </main>
      <MobileNavigation />
    </div>
  );
}
