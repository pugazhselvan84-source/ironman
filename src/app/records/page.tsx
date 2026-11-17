import { redirect } from "next/navigation";
import { PersonalRecordsView } from "@/components/records/personal-records-view";
import { getPersonalRecords } from "@/lib/records/personal-records";
import { getVerifiedAuth } from "@/lib/supabase/session";

export const instant = false;

export default async function RecordsPage() {
  const { supabase, user } = await getVerifiedAuth();
  if (!user) redirect("/login");

  const result = await getPersonalRecords(supabase, user.id);
  if (!result.records) {
    throw new Error(result.error);
  }

  return <PersonalRecordsView records={result.records} />;
}
