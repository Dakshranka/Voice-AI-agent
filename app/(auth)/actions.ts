"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

const SIGNUP_RATE_LIMIT_MESSAGE =
  "Signup is temporarily rate-limited by Supabase. If you already have an account, use Login. Otherwise wait a few minutes and try signup again.";
const SIGNUP_RATE_LIMIT_CODE = "signup_rate_limited";

function toSafeAuthError(error: unknown): string {
  const rawMessage =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : "Authentication failed";
  const message = rawMessage.toLowerCase();

  if (message === "fetch failed") {
    return "Network timeout reaching Supabase. Check internet/VPN and retry.";
  }

  if (
    message.includes("email rate limit exceeded") ||
    message.includes("over_email_send_rate_limit") ||
    message.includes("rate limit")
  ) {
    return SIGNUP_RATE_LIMIT_MESSAGE;
  }

  if (message.includes("invalid login credentials")) {
    return "Invalid email or password. If you just registered, verify your email before signing in.";
  }

  return rawMessage;
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  throw lastError;
}

async function upsertUserRole(input: { id: string; email: string; role: UserRole }) {
  const supabase = await createClient();
  await supabase.from("users").upsert({
    id: input.id,
    email: input.email,
    role: input.role,
  });
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const role = (String(formData.get("role") ?? "recruiter") as UserRole) || "recruiter";

  if (!email || !password) {
    redirect("/register?error=Email and password are required");
  }

  const supabase = await createClient();

  let data: { user: { id: string } | null; session: unknown | null };
  let error: { message: string } | null = null;

  try {
    const result = await withRetry(() =>
      supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
          },
          emailRedirectTo: undefined,
        },
      }),
    );
    data = result.data as { user: { id: string } | null; session: unknown | null };
    error = result.error as { message: string } | null;
  } catch (authError) {
    unstable_rethrow(authError);
    redirect(`/register?error=${encodeURIComponent(toSafeAuthError(authError))}`);
  }

  const safeSignupError = error?.message ? toSafeAuthError(error.message) : null;
  if (safeSignupError === SIGNUP_RATE_LIMIT_MESSAGE) {
    redirect(`/login?errorCode=${SIGNUP_RATE_LIMIT_CODE}`);
  }

  if (error || !data.user) {
    redirect(`/register?error=${encodeURIComponent(toSafeAuthError(error?.message ?? "Signup failed"))}`);
  }

  await upsertUserRole({
    id: data.user.id,
    email,
    role,
  });

  if (!data.session) {
    redirect("/login?error=Check your email to confirm your account before signing in");
  }

  redirect("/dashboard");
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    redirect("/login?error=Email and password are required");
  }

  const supabase = await createClient();

  try {
    const { error } = await withRetry(() =>
      supabase.auth.signInWithPassword({
        email,
        password,
      }),
    );

    if (error) {
      redirect(`/login?error=${encodeURIComponent(toSafeAuthError(error.message))}`);
    }
  } catch (authError) {
    unstable_rethrow(authError);
    redirect(`/login?error=${encodeURIComponent(toSafeAuthError(authError))}`);
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
