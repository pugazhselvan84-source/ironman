import { redirect } from "next/navigation";
import { ProfileManager } from "@/components/profile/profile-manager";
import { getVerifiedAuth } from "@/lib/supabase/session";

export const instant = false;

export default async function ProfilePage() {
  const { supabase, user } = await getVerifiedAuth();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load your profile.");
  }

  return (
    <ProfileManager
      email={user.email ?? null}
      memberSince={user.created_at}
      displayName={profile?.display_name ?? null}
    />
  );
}
