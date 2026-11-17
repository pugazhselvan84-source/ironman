"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  changePasswordAction,
  updateDisplayNameAction,
  type ProfileActionResult,
} from "@/app/actions/profile";
import { signOutAction } from "@/app/actions/auth";
import type { AuthActionState } from "@/lib/auth/action-state";

const cardClass = "rounded-2xl border border-[#34383d] bg-[#191c1a]";
const inputClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-[#343a36] bg-[#121513] px-3 text-sm text-white placeholder:text-[#667069] focus:border-[#22c55e] focus:outline-none";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#22c55e] px-4 text-xs font-bold text-[#101510] transition hover:bg-[#4ade80] disabled:cursor-not-allowed disabled:opacity-50";

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`${cardClass} p-5 sm:p-6 ${className}`}>{children}</section>;
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#768078]">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-base font-semibold text-white">{title}</h2>
      <p className="mt-1.5 text-xs leading-5 text-[#89938b]">{description}</p>
    </div>
  );
}

function formatMemberSince(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function ProfileManager({
  email,
  memberSince,
  displayName,
}: {
  email: string | null;
  memberSince: string;
  displayName: string | null;
}) {
  const router = useRouter();
  const [logoutState, logoutFormAction, logoutPending] = useActionState<AuthActionState, FormData>(
    signOutAction,
    null,
  );
  const [pendingAction, setPendingAction] = useState<"profile" | "password" | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function perform(
    action: (formData: FormData) => Promise<ProfileActionResult>,
    formData: FormData,
    type: "profile" | "password",
  ) {
    setPendingAction(type);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const result = await action(formData);
      if (!result.success) {
        setErrorMessage(result.message);
        return false;
      }
      setSuccessMessage(result.message);
      router.refresh();
      return true;
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      return false;
    } finally {
      setPendingAction(null);
    }
  }

  async function saveDisplayName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await perform(
      updateDisplayNameAction,
      new FormData(form),
      "profile",
    );
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const succeeded = await perform(
      changePasswordAction,
      new FormData(form),
      "password",
    );
    if (succeeded) form.reset();
  }

  return (
    <main className="min-h-screen bg-[#121212] px-4 pb-20 pt-6 text-[#f4f4f5] sm:px-7 sm:pt-9 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-xs font-medium text-[#95a098] transition hover:text-[#5fdf87]"
        >
          ← Dashboard
        </Link>
        <header className="mb-6 mt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#758078]">
            IRONMAN · Account
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
            Profile & settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#929c94]">
            Manage your account details, password, and active session.
          </p>
        </header>

        {(successMessage || errorMessage) && (
          <p
            role={errorMessage ? "alert" : "status"}
            className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
              errorMessage
                ? "border-[#704342] bg-[#2b1d1d] text-[#f2aaa5]"
                : "border-[#31533b] bg-[#1a281e] text-[#8de3a5]"
            }`}
          >
            {errorMessage || successMessage}
          </p>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <SectionTitle
              eyebrow="Account details"
              title="Your account"
              description="Information associated with your authenticated Supabase account."
            />
            <dl className="space-y-4">
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-wide text-[#7f8981]">
                  Email address
                </dt>
                <dd className="mt-1 break-all text-sm font-medium text-[#e2e7e2]">
                  {email || "Email unavailable"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-wide text-[#7f8981]">
                  Member since
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#e2e7e2]">
                  {formatMemberSince(memberSince)}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel>
            <SectionTitle
              eyebrow="Profile information"
              title="Display name"
              description="This name appears in your IRONMAN dashboard."
            />
            <form key={displayName ?? "unset"} className="space-y-4" onSubmit={saveDisplayName}>
              <label className="block text-xs font-medium text-[#aeb6af]" htmlFor="display_name">
                Display name
                <input
                  id="display_name"
                  className={inputClass}
                  name="display_name"
                  required
                  minLength={1}
                  maxLength={80}
                  defaultValue={displayName ?? ""}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </label>
              <button
                type="submit"
                className={buttonClass}
                disabled={pendingAction !== null}
              >
                {pendingAction === "profile" ? "Saving…" : "Save display name"}
              </button>
            </form>
          </Panel>

          <Panel>
            <SectionTitle
              eyebrow="Security"
              title="Change password"
              description="Verify your current password before choosing a new one."
            />
            <form className="space-y-4" onSubmit={changePassword}>
              <label className="block text-xs font-medium text-[#aeb6af]" htmlFor="old-password">
                Old password
                <input
                  id="old-password"
                  className={inputClass}
                  name="old_password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </label>
              <label className="block text-xs font-medium text-[#aeb6af]" htmlFor="new-password">
                New password
                <input
                  id="new-password"
                  className={inputClass}
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                />
              </label>
              <label className="block text-xs font-medium text-[#aeb6af]" htmlFor="confirm-password">
                Confirm new password
                <input
                  id="confirm-password"
                  className={inputClass}
                  name="confirm_password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                />
              </label>
              <button
                type="submit"
                className={buttonClass}
                disabled={pendingAction !== null}
              >
                {pendingAction === "password" ? "Updating…" : "Change password"}
              </button>
            </form>
          </Panel>

          <Panel>
            <SectionTitle
              eyebrow="Session"
              title="Sign out"
              description="End your current session on this device."
            />
            <form
              action={logoutFormAction}
              onSubmit={(event) => {
                if (!window.confirm("Sign out of your IRONMAN account?")) {
                  event.preventDefault();
                }
              }}
            >
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#704342] px-4 text-xs font-semibold text-[#f0aaa5] transition hover:bg-[#2b1d1d] disabled:opacity-50"
                disabled={logoutPending || pendingAction !== null}
              >
                {logoutPending ? "Signing out…" : "Sign out"}
              </button>
            </form>
            {logoutState?.status === "error" && (
              <p role="alert" className="mt-3 text-xs text-[#f0aaa5]">
                {logoutState.message}
              </p>
            )}
          </Panel>
        </div>
      </div>
    </main>
  );
}
