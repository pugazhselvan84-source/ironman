import { redirect } from "next/navigation";
import { ProgressDashboard } from "@/components/progress/progress-dashboard";
import { getStrengthProgress } from "@/lib/progress/strength-progress";
import { getVerifiedAuth } from "@/lib/supabase/session";

export const instant = false;

export default async function ProgressPage() {
  const { supabase, user } = await getVerifiedAuth();
  if (!user) redirect("/login");

  const result = await getStrengthProgress(supabase, user.id);
  if (!result.data) {
    throw new Error(result.error);
  }

  return <ProgressDashboard progress={result.data} />;
}
