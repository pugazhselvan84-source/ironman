"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordResetAction,
  signInAction,
  signUpAction,
  updatePasswordAction,
} from "@/app/actions/auth";
import type { AuthActionState } from "@/lib/auth/action-state";

type AuthMode = "login" | "signup" | "forgot-password" | "reset-password";

const actions = {
  login: signInAction,
  signup: signUpAction,
  "forgot-password": requestPasswordResetAction,
  "reset-password": updatePasswordAction,
};

const content: Record<AuthMode, { title: string; description: string; button: string }> = {
  login: {
    title: "Welcome back",
    description: "Sign in to continue your training.",
    button: "Sign in",
  },
  signup: {
    title: "Build your account",
    description: "Create an account to keep your strength training on track.",
    button: "Create account",
  },
  "forgot-password": {
    title: "Reset your password",
    description: "We'll email you a secure link to choose a new password.",
    button: "Send reset link",
  },
  "reset-password": {
    title: "Choose a new password",
    description: "Use at least 8 characters for your new password.",
    button: "Save new password",
  },
};

const inputClassName =
  "mt-2 w-full rounded-xl border border-[#343b36] bg-[#121513] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#69716b] focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/15";

function AuthBrand() {
  return (
    <Link href="/login" className="mb-8 inline-flex items-center gap-3" aria-label="IRONMAN">
      <svg aria-hidden="true" viewBox="0 0 44 48" fill="none" className="size-10">
        <path
          d="M22 2.5 39.5 9v12.7c0 11.2-7.3 18.5-17.5 23.8C11.8 40.2 4.5 32.9 4.5 21.7V9L22 2.5Z"
          fill="rgb(34 197 94 / 10%)"
          stroke="#22c55e"
          strokeWidth="2"
        />
        <path d="M24.7 9 15 25.2h7.1L19.3 38l9.8-17h-7.2L24.7 9Z" fill="#22c55e" />
      </svg>
      <span>
        <span className="block text-sm font-black tracking-[0.2em] text-white">IRONMAN</span>
        <span className="mt-1 block text-[9px] tracking-wide text-[#87918a]">
          TRAINING DASHBOARD
        </span>
      </span>
    </Link>
  );
}

function Message({
  state,
  initialMessage,
}: {
  state: AuthActionState;
  initialMessage?: string;
}) {
  const message = state?.message ?? initialMessage;
  if (!message) {
    return null;
  }

  const isSuccess = state?.status === "success";

  return (
    <p
      role={isSuccess ? "status" : "alert"}
      className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
        isSuccess
          ? "border-[#31583b] bg-[#17241a] text-[#91e4a8]"
          : "border-[#5a3737] bg-[#291b1b] text-[#f0aaaa]"
      }`}
    >
      {message}
    </p>
  );
}

export function AuthForm({
  mode,
  initialMessage,
}: {
  mode: AuthMode;
  initialMessage?: string;
}) {
  const [state, formAction, isPending] = useActionState(actions[mode], null);
  const page = content[mode];
  const includesPassword = mode === "login" || mode === "signup" || mode === "reset-password";
  const includesConfirmation = mode === "signup" || mode === "reset-password";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#121212] px-5 py-12">
      <div className="w-full max-w-[440px]">
        <AuthBrand />
        <section className="rounded-3xl border border-[#303632] bg-[#191c1a] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
          <div className="mb-7">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#68d989]">
              Athlete access
            </p>
            <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white">{page.title}</h1>
            <p className="mt-2 text-sm leading-6 text-[#a2aaa4]">{page.description}</p>
          </div>

          <Message state={state} initialMessage={initialMessage} />

          <form action={formAction} className="space-y-5">
            {mode !== "reset-password" && (
              <div>
                <label htmlFor="email" className="text-xs font-medium text-[#d3d8d4]">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  className={inputClassName}
                  placeholder="you@example.com"
                />
              </div>
            )}

            {includesPassword && (
              <div>
                <label htmlFor="password" className="text-xs font-medium text-[#d3d8d4]">
                  {mode === "login" ? "Password" : "New password"}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={8}
                  maxLength={128}
                  className={inputClassName}
                  placeholder="At least 8 characters"
                />
              </div>
            )}

            {includesConfirmation && (
              <div>
                <label htmlFor="confirmPassword" className="text-xs font-medium text-[#d3d8d4]">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  className={inputClassName}
                  placeholder="Enter your password again"
                />
              </div>
            )}

            {mode === "login" && (
              <div className="-mt-2 text-right">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-[#72dc90] transition hover:text-[#a0efb5]"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-[#22c55e] px-4 py-3 text-sm font-bold text-[#07120a] transition hover:bg-[#35d66f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Please wait..." : page.button}
            </button>
          </form>

          <div className="mt-6 border-t border-[#303632] pt-5 text-center text-xs text-[#9ba39d]">
            {mode === "login" && (
              <p>
                New to IRONMAN?{" "}
                <Link href="/signup" className="font-semibold text-[#72dc90] hover:text-[#a0efb5]">
                  Create an account
                </Link>
              </p>
            )}
            {mode === "signup" && (
              <p>
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-[#72dc90] hover:text-[#a0efb5]">
                  Sign in
                </Link>
              </p>
            )}
            {(mode === "forgot-password" || mode === "reset-password") && (
              <p>
                Remember your password?{" "}
                <Link href="/login" className="font-semibold text-[#72dc90] hover:text-[#a0efb5]">
                  Back to sign in
                </Link>
              </p>
            )}
          </div>
        </section>
        <p className="mt-6 text-center text-[10px] text-[#68716a]">
          Your training account is private and protected.
        </p>
      </div>
    </main>
  );
}
