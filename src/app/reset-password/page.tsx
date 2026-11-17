import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getVerifiedAuth } from "@/lib/supabase/session";

export const instant = false;

export default async function ResetPasswordPage() {
  const { user } = await getVerifiedAuth();
  if (!user) {
    redirect("/login?error=recovery");
  }

  return <AuthForm mode="reset-password" />;
}
