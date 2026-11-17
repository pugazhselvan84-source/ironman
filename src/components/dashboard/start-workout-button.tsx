"use client";

import { useState } from "react";

export function StartWorkoutButton() {
  const [started, setStarted] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setStarted((isStarted) => !isStarted)}
      aria-pressed={started}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#22c55e] px-5 text-sm font-bold text-[#101510] transition hover:bg-[#4ade80] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
    >
      {started ? "Workout started" : "Start workout"}
      {started ? (
        <span aria-hidden="true" className="size-2 rounded-full bg-[#101510]" />
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor">
          <path d="M8 5.75c0-.78.85-1.26 1.52-.86l9.1 5.25a.99.99 0 0 1 0 1.72l-9.1 5.25A.99.99 0 0 1 8 16.25z" />
        </svg>
      )}
    </button>
  );
}
