import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type WorkoutSetRow = {
  id: string;
  exercise_id: string;
  reps: number;
  weight_kg: number;
  completed_at: string;
};

type ExerciseRow = {
  id: string;
  name: string;
};

export type PersonalRecordSet = {
  setId: string;
  weightKg: number;
  reps: number;
  estimated1RmKg: number;
  volumeKg: number;
  achievedAt: string;
};

export type PersonalRecord = {
  exerciseName: string;
  heaviestWeight: PersonalRecordSet;
  estimatedOneRepMax: PersonalRecordSet;
  bestSingleSetVolume: PersonalRecordSet;
  recordSetIds: string[];
};

export type PersonalRecordsResult =
  | { records: PersonalRecord[]; error?: never }
  | { records: null; error: string };

const PAGE_SIZE = 1000;
const ID_BATCH_SIZE = 100;

function roundToTwo(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function moreRecent(left: PersonalRecordSet, right: PersonalRecordSet) {
  return new Date(left.achievedAt).getTime() > new Date(right.achievedAt).getTime();
}

function updateBest(
  current: PersonalRecordSet,
  candidate: PersonalRecordSet,
  metric: "weightKg" | "estimated1RmKg" | "volumeKg",
  recordSetIds: Set<string>,
) {
  if (candidate[metric] > current[metric]) {
    recordSetIds.clear();
    recordSetIds.add(candidate.setId);
    return candidate;
  }
  if (candidate[metric] === current[metric]) {
    recordSetIds.add(candidate.setId);
    return moreRecent(candidate, current) ? candidate : current;
  }
  return current;
}

export async function getPersonalRecords(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<PersonalRecordsResult> {
  const sets: WorkoutSetRow[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("workout_sets")
      .select("id, exercise_id, reps, weight_kg, completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      return { records: null, error: "Unable to load your logged strength sets." };
    }

    const page = data ?? [];
    sets.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  const exerciseIds = [...new Set(sets.map((set) => set.exercise_id))];
  const exercises: ExerciseRow[] = [];
  for (let batchStart = 0; batchStart < exerciseIds.length; batchStart += ID_BATCH_SIZE) {
    const exerciseIdBatch = exerciseIds.slice(batchStart, batchStart + ID_BATCH_SIZE);
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name")
        .eq("user_id", userId)
        .in("id", exerciseIdBatch)
        .order("id", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        return { records: null, error: "Unable to load exercise names for your records." };
      }

      const page = data ?? [];
      exercises.push(...page);
      if (page.length < PAGE_SIZE) break;
    }
  }

  const exerciseNames = new Map(
    exercises.map((exercise) => [exercise.id, exercise.name.trim()]),
  );
  type MutableRecord = {
    exerciseName: string;
    heaviestWeight: PersonalRecordSet;
    estimatedOneRepMax: PersonalRecordSet;
    bestSingleSetVolume: PersonalRecordSet;
    heaviestSetIds: Set<string>;
    oneRepMaxSetIds: Set<string>;
    volumeSetIds: Set<string>;
  };
  const records = new Map<string, MutableRecord>();

  for (const set of sets) {
    const exerciseName = exerciseNames.get(set.exercise_id);
    if (!exerciseName) continue;

    const normalizedName = exerciseName.toLowerCase();
    const candidate: PersonalRecordSet = {
      setId: set.id,
      weightKg: roundToTwo(set.weight_kg),
      reps: set.reps,
      estimated1RmKg: roundToTwo(
        set.reps > 1 ? set.weight_kg * (1 + set.reps / 30) : set.weight_kg,
      ),
      volumeKg: roundToTwo(set.weight_kg * set.reps),
      achievedAt: set.completed_at,
    };

    let record = records.get(normalizedName);
    if (!record) {
      record = {
        exerciseName,
        heaviestWeight: candidate,
        estimatedOneRepMax: candidate,
        bestSingleSetVolume: candidate,
        heaviestSetIds: new Set([candidate.setId]),
        oneRepMaxSetIds: new Set([candidate.setId]),
        volumeSetIds: new Set([candidate.setId]),
      };
      records.set(normalizedName, record);
      continue;
    }

    record.heaviestWeight = updateBest(
      record.heaviestWeight,
      candidate,
      "weightKg",
      record.heaviestSetIds,
    );
    record.estimatedOneRepMax = updateBest(
      record.estimatedOneRepMax,
      candidate,
      "estimated1RmKg",
      record.oneRepMaxSetIds,
    );
    record.bestSingleSetVolume = updateBest(
      record.bestSingleSetVolume,
      candidate,
      "volumeKg",
      record.volumeSetIds,
    );
  }

  const result = [...records.values()]
    .map((record) => ({
      exerciseName: record.exerciseName,
      heaviestWeight: record.heaviestWeight,
      estimatedOneRepMax: record.estimatedOneRepMax,
      bestSingleSetVolume: record.bestSingleSetVolume,
      recordSetIds: [
        ...new Set([
          ...record.heaviestSetIds,
          ...record.oneRepMaxSetIds,
          ...record.volumeSetIds,
        ]),
      ],
    }))
    .sort(
      (left, right) =>
        right.heaviestWeight.weightKg - left.heaviestWeight.weightKg ||
        new Date(right.heaviestWeight.achievedAt).getTime() -
          new Date(left.heaviestWeight.achievedAt).getTime() ||
        left.exerciseName.localeCompare(right.exerciseName),
    );

  return { records: result };
}
