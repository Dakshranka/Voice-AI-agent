"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthMode = "login" | "register";

interface AuthFormProps {
  mode: AuthMode;
  action: (formData: FormData) => Promise<void>;
  error?: string;
}

function SubmitButton({ isRegister }: { isRegister: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending} aria-disabled={pending}>
      {pending ? (isRegister ? "Creating account..." : "Signing in...") : isRegister ? "Create account" : "Sign in"}
    </Button>
  );
}

export function AuthForm({ mode, action, error }: AuthFormProps) {
  const isRegister = mode === "register";
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const validateEmail = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setEmailError(null);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError("Invalid email format");
    } else {
      setEmailError(null);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    validateEmail(value);
  };

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <Input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          placeholder="student@example.com"
          className={emailError ? "border-rose-500" : ""}
        />
        {emailError && <p className="mt-1 text-xs text-rose-600">{emailError}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
        <Input type="password" name="password" required minLength={6} placeholder="••••••••" />
      </div>

      {isRegister ? <input type="hidden" name="role" value="recruiter" /> : null}

      <SubmitButton isRegister={isRegister} />

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
          <p className="text-sm text-rose-700">{error}</p>
          {error.includes("email") && (
            <p className="mt-2 text-xs text-rose-600">
              Tip: Make sure your email is confirmed in Supabase before signing in.
            </p>
          )}
        </div>
      )}

      <p className="text-center text-sm text-slate-600">
        {isRegister ? "Already have an account?" : "Need an account?"}{" "}
        <Link
          className="font-semibold text-teal-700 hover:text-teal-800"
          href={isRegister ? "/login" : "/register"}
        >
          {isRegister ? "Sign in" : "Register"}
        </Link>
      </p>
    </form>
  );
}
