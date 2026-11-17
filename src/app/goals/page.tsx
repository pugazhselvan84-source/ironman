import { redirect } from "next/navigation";
import { GoalsManager } from "@/components/goals/goals-manager";
import { getGoalsProgress } from "@/lib/goals/goals-progress";
import { getVerifiedAuth } from "@/lib/supabase/session";

export const instant = false;

export default async function GoalsPage() {
  const { supabase, user } = await getVerifiedAuth();
  if (!user) redirect("/login");

  const result = await getGoalsProgress(supabase, user.id);
  if (!result.data) {
    throw new Error(result.error);
  }

  return <GoalsManager initialData={result.data} />;
}
