import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getVerifiedAuth } from "@/lib/supabase/session";

const callbackMessages: Record<string, string> = {
  confirmation: "That verification link is invalid or expired. Request a new one.",
  recovery: "That password reset link is invalid or expired. Request another link.",
};

export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { user } = await getVerifiedAuth();
  if (user) {
    redirect("/");
  }

  const { error } = await searchParams;

  return <AuthForm mode="login" initialMessage={error ? callbackMessages[error] : undefined} />;
}
