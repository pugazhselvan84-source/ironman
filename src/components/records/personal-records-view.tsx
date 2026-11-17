"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type {
  PersonalRecord,
  PersonalRecordSet,
} from "@/lib/records/personal-records";

const cardClass = "rounded-2xl border border-[#34383d] bg-[#191c1a]";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function RecordMetric({
  label,
  value,
  details,
}: {
  label: string;
  value: string;
  details: string;
}) {
  return (
    <div className="rounded-xl border border-[#2e3931] bg-[#171c18] p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#849087]">
          {label}
        </p>
        <span className="rounded-full border border-[#315c3a] bg-[#1b2c20] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#7ee29b]">
          PR
        </span>
      </div>
      <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">
        {value}
      </p>
      <p className="mt-1 text-[10px] leading-4 text-[#a0aaa2]">{details}</p>
    </div>
  );
}

function HeaviestRecord({ record }: { record: PersonalRecordSet }) {
  return (
    <RecordMetric
      label="Heaviest weight"
      value={`${formatNumber(record.weightKg)} kg`}
      details={`${record.reps} ${record.reps === 1 ? "rep" : "reps"} · ${formatDate(record.achievedAt)}`}
    />
  );
}

export function PersonalRecordsView({
  records,
}: {
  records: PersonalRecord[];
}) {
  const [query, setQuery] = useState("");
  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery
      ? records.filter((record) =>
          record.exerciseName.toLowerCase().includes(normalizedQuery),
        )
      : records;
  }, [query, records]);

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
              Personal records
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#929c94]">
              Your best logged sets by exercise. Records are calculated from your logged strength sets.
            </p>
          </div>
          <span className="rounded-full border border-[#354039] bg-[#1a211c] px-3 py-1.5 text-xs font-medium text-[#8de3a5]">
            {records.length} {records.length === 1 ? "exercise" : "exercises"}
          </span>
        </header>

        <label className="mb-5 block max-w-md text-xs font-medium text-[#aeb6af]">
          Search exercises
          <span className="relative mt-1.5 block">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7f8981]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              className="min-h-11 w-full rounded-xl border border-[#343a36] bg-[#191c1a] pl-10 pr-3 text-sm text-white placeholder:text-[#667069] focus:border-[#22c55e] focus:outline-none"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. squat"
            />
          </span>
        </label>

        {records.length === 0 ? (
          <section className={`${cardClass} px-5 py-12 text-center sm:px-8`}>
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
                <path d="M6 4v16m12-16v16M3 8h6m6 8h6M9 8l6 8m0-8L9 16" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-white">No records yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#929c94]">
              Log a strength set in a workout to start building your personal records.
            </p>
            <Link
              href="/training-plans"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#22c55e] px-4 text-xs font-bold text-[#101510] transition hover:bg-[#4ade80]"
            >
              View training plans
            </Link>
          </section>
        ) : filteredRecords.length === 0 ? (
          <section className={`${cardClass} px-5 py-10 text-center`}>
            <h2 className="font-semibold text-white">No matching exercises</h2>
            <p className="mt-2 text-sm text-[#929c94]">
              Try a different exercise name.
            </p>
          </section>
        ) : (
          <>
            <p className="mb-3 text-[10px] text-[#7f8981]" aria-live="polite">
              Showing {filteredRecords.length} of {records.length} exercises
            </p>
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredRecords.map((record) => (
                <article key={record.exerciseName.toLowerCase()} className={`${cardClass} p-4 sm:p-5`}>
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold text-white">
                      {record.exerciseName}
                    </h2>
                    <span className="rounded-full border border-[#315c3a] bg-[#1b2c20] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#7ee29b]">
                      {record.recordSetIds.length} PR set
                      {record.recordSetIds.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <HeaviestRecord record={record.heaviestWeight} />
                    <RecordMetric
                      label="Estimated 1-rep max"
                      value={`${formatNumber(record.estimatedOneRepMax.estimated1RmKg)} kg`}
                      details={`From ${formatNumber(record.estimatedOneRepMax.weightKg)} kg × ${record.estimatedOneRepMax.reps} reps · ${formatDate(record.estimatedOneRepMax.achievedAt)}`}
                    />
                    <RecordMetric
                      label="Best single-set volume"
                      value={`${formatNumber(record.bestSingleSetVolume.volumeKg)} kg`}
                      details={`${formatNumber(record.bestSingleSetVolume.weightKg)} kg × ${record.bestSingleSetVolume.reps} reps · ${formatDate(record.bestSingleSetVolume.achievedAt)}`}
                    />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
