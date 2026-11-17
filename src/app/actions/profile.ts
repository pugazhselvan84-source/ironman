"use server";

import { revalidatePath } from "next/cache";
import { getVerifiedAuth } from "@/lib/supabase/session";

export type ProfileActionResult =
  | { success: true; message: string }
  | { success: false; message: string };

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function passwordField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function updateDisplayNameAction(
  formData: FormData,
): Promise<ProfileActionResult> {
  const { supabase, user } = await getVerifiedAuth();
  if (!user) {
    return { success: false, message: "Sign in to update your profile." };
  }

  const displayName = field(formData, "display_name");
  if (!displayName || displayName.length > 80) {
    return {
      success: false,
      message: "Enter a display name between 1 and 80 characters.",
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { success: false, message: "We couldn't update your profile. Please try again." };
  }
  if (!data) {
    return { success: false, message: "Your profile could not be found." };
  }

  revalidatePath("/profile");
  revalidatePath("/");
  return { success: true, message: "Display name updated." };
}

export async function changePasswordAction(
  formData: FormData,
): Promise<ProfileActionResult> {
  const { supabase, user } = await getVerifiedAuth();
  if (!user) {
    return { success: false, message: "Sign in to change your password." };
  }

  const oldPassword = passwordField(formData, "old_password");
  const password = passwordField(formData, "password");
  const confirmPassword = passwordField(formData, "confirm_password");

  if (!oldPassword) {
    return { success: false, message: "Enter your old password." };
  }
  if (password.length < 8 || password.length > 128) {
    return {
      success: false,
      message: "Your new password must be between 8 and 128 characters.",
    };
  }
  if (password !== confirmPassword) {
    return { success: false, message: "The passwords do not match." };
  }

  if (!user.email) {
    return {
      success: false,
      message: "This account has no email address to verify the old password.",
    };
  }

  const { error: verificationError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: oldPassword,
  });
  if (verificationError) {
    return { success: false, message: "Incorrect old password" };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      success: false,
      message: "We couldn't change your password. Please try again.",
    };
  }

  revalidatePath("/profile");
  return { success: true, message: "Password changed successfully." };
}
