import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getSafeDestination(request: NextRequest) {
  const requestedPath = request.nextUrl.searchParams.get("next");

  if (
    !requestedPath ||
    !requestedPath.startsWith("/") ||
    requestedPath.startsWith("//") ||
    requestedPath.includes("\\")
  ) {
    return new URL("/", request.url);
  }

  return new URL(requestedPath, request.url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const isRecovery = request.nextUrl.searchParams.get("next") === "/reset-password";

  if (!code) {
    const destination = isRecovery
      ? "/login?error=recovery"
      : "/login?error=confirmation";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const destination = isRecovery
      ? "/login?error=recovery"
      : "/login?error=confirmation";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.redirect(getSafeDestination(request));
}
