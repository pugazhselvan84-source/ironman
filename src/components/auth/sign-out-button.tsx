"use client";

import { useActionState } from "react";
import { signOutAction } from "@/app/actions/auth";

export function SignOutButton() {
  const [state, formAction, isPending] = useActionState(signOutAction, null);

  return (
    <div className="min-w-0">
      <form action={formAction}>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg border border-[#3b443d] px-3 py-2 text-[10px] font-semibold text-[#c3cbc5] transition hover:border-[#536458] hover:text-white disabled:opacity-60"
        >
          {isPending ? "Signing out..." : "Sign out"}
        </button>
      </form>
      {state?.status === "error" && (
        <p role="alert" className="mt-1 max-w-48 text-[10px] text-[#f0aaaa]">
          {state.message}
        </p>
      )}
    </div>
  );
}
