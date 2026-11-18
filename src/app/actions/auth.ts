"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthActionState } from "@/lib/auth/action-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getStringField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getPasswordField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

async function getRequestOrigin() {
  const originHeader = (await headers()).get("origin");
  if (!originHeader) {
    return null;
  }

  try {
    const origin = new URL(originHeader);
    if (origin.protocol !== "https:" && origin.protocol !== "http:") {
      return null;
    }

    return origin.origin;
  } catch {
    return null;
  }
}

function getAuthErrorMessage(error: { message: string }) {
  const message = error.message.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "The email or password is incorrect. Check your details and try again.";
  }

  if (message.includes("email not confirmed")) {
    return "Please verify your email address before signing in.";
  }

  if (message.includes("already registered") || message.includes("already exists")) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (message.includes("password") && message.includes("length")) {
    return "Choose a longer password and try again.";
  }

  return "We couldn't complete that request. Please try again.";
}

// Temporary auth diagnostics; remove after the production failure is identified.
type AuthDiagnosticError = {
  name: string;
  status?: number;
  code?: string;
  message: string;
};

function sanitizeAuthDiagnosticMessage(message: string, credentials: string[]) {
  let sanitized = message.replace(/[\r\n\t]+/g, " ");

  for (const credential of credentials) {
    if (credential) {
      sanitized = sanitized.split(credential).join("[redacted]");
    }
  }

  return sanitized
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\b(?:bearer|basic)\s+[^\s,;]+/gi, "[redacted-authorization]")
    .replace(/\b(?:access|refresh)[_-]?token\s*[:=]\s*[^,\r\n;]+/gi, "[redacted-token]")
    .replace(
      /\b(?:password|passwd|secret|api[_-]?key|authorization|cookie|email)\s*[:=]\s*[^,\r\n;]+/gi,
      "[redacted-field]",
    )
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[redacted-token]")
    .replace(/\bsb_(?:publishable|secret)_[A-Za-z0-9_-]+\b/gi, "[redacted-key]")
    .replace(/https?:\/\/[^\s"'<>]+/gi, "[redacted-url]")
    .slice(0, 240);
}

function logAuthDiagnostic(
  operation: "login" | "signup",
  error: AuthDiagnosticError,
  credentials: string[],
) {
  console.error("[IRONMAN_AUTH_DIAGNOSTIC]", {
    operation,
    errorName: sanitizeAuthDiagnosticMessage(error.name, credentials).slice(0, 64),
    httpStatus:
      typeof error.status === "number" && Number.isFinite(error.status)
        ? error.status
        : null,
    errorCode: error.code
      ? sanitizeAuthDiagnosticMessage(error.code, credentials).slice(0, 64)
      : null,
    message: sanitizeAuthDiagnosticMessage(error.message, credentials),
  });
}

function errorState(message: string): AuthActionState {
  return { status: "error", message };
}

function successState(message: string): AuthActionState {
  return { status: "success", message };
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getStringField(formData, "email");
  const password = getPasswordField(formData, "password");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
    return errorState("Enter a valid email address and password.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    logAuthDiagnostic("login", error, [email, password]);
    return errorState(getAuthErrorMessage(error));
  }

  redirect("/");
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getStringField(formData, "email");
  const password = getPasswordField(formData, "password");
  const confirmPassword = getPasswordField(formData, "confirmPassword");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return errorState("Enter a valid email address.");
  }

  if (password.length < 8) {
    return errorState("Your password must be at least 8 characters long.");
  }

  if (password !== confirmPassword) {
    return errorState("The passwords do not match.");
  }

  const origin = await getRequestOrigin();
  if (!origin) {
    return errorState("We couldn't determine the verification link address. Try again.");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=%2F`,
    },
  });

  if (error) {
    logAuthDiagnostic("signup", error, [email, password]);
    return errorState(getAuthErrorMessage(error));
  }

  if (data.session) {
    redirect("/");
  }

  return successState(
    "Account created. Check your email for a verification link before signing in.",
  );
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getStringField(formData, "email");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return errorState("Enter a valid email address.");
  }

  const origin = await getRequestOrigin();
  if (!origin) {
    return errorState("We couldn't prepare a password reset link. Try again.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=%2Freset-password`,
  });

  if (error) {
    return errorState(getAuthErrorMessage(error));
  }

  return successState(
    "If an account exists for that email, a password reset link is on its way.",
  );
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = getPasswordField(formData, "password");
  const confirmPassword = getPasswordField(formData, "confirmPassword");

  if (password.length < 8) {
    return errorState("Your password must be at least 8 characters long.");
  }

  if (password !== confirmPassword) {
    return errorState("The passwords do not match.");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error: sessionError } = await supabase.auth.getUser();

  if (sessionError && sessionError.name !== "AuthSessionMissingError") {
    return errorState("We couldn't verify the reset link. Request a new one and try again.");
  }

  if (!data.user) {
    return errorState("This reset link has expired. Request a new password reset link.");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return errorState(getAuthErrorMessage(error));
  }

  redirect("/");
}

export async function signOutAction(
  previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void previousState;
  void formData;

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return errorState("We couldn't sign you out. Please try again.");
  }

  redirect("/login");
}
