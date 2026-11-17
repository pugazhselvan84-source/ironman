import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getVerifiedAuth() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError") {
    throw new Error("Unable to verify the current Supabase session.");
  }

  return { supabase, user: data.user };
}
