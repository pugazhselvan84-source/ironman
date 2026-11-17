import { Dashboard } from "@/components/dashboard/dashboard";
import { redirect } from "next/navigation";
import { getStrengthProgress } from "@/lib/progress/strength-progress";
import { getGoalsProgress } from "@/lib/goals/goals-progress";
import { getPersonalRecords } from "@/lib/records/personal-records";
import { getVerifiedAuth } from "@/lib/supabase/session";

export const instant = false;

export default async function Home() {
  const { supabase, user } = await getVerifiedAuth();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: profile, error: profileError },
    { data: recentWorkouts, error: workoutsError },
    strengthProgress,
    personalRecordsResult,
    goalsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("workouts")
      .select("id, title, completed_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(3),
    getStrengthProgress(supabase, user.id),
    getPersonalRecords(supabase, user.id),
    getGoalsProgress(supabase, user.id),
  ]);

  const profileName = profile?.display_name?.trim() || user.email || "Athlete";
  const profileMessage = profileError
    ? "Your dashboard is available, but profile details could not be loaded."
    : undefined;
  const recentWorkoutsMessage = workoutsError
    ? "Recent workouts could not be loaded."
    : undefined;

  return (
    <Dashboard
      profileName={profileName}
      email={user.email ?? ""}
      profileMessage={profileMessage}
      recentWorkouts={recentWorkouts ?? []}
      recentWorkoutsMessage={recentWorkoutsMessage}
      progress={strengthProgress.data}
      progressMessage={
        strengthProgress.data ? undefined : strengthProgress.error
      }
      personalRecords={personalRecordsResult.records ?? []}
      recordsMessage={
        personalRecordsResult.records ? undefined : personalRecordsResult.error
      }
      goalsData={goalsResult.data}
      goalsMessage={goalsResult.data ? undefined : goalsResult.error}
    />
  );
}
