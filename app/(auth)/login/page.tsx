import { AuthForm } from "@/components/auth/auth-form";
import { SupabaseConnectivityCheck } from "@/components/auth/supabase-connectivity-check";
import { signInAction } from "@/app/(auth)/actions";

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  signup_rate_limited:
    "Signup is temporarily rate-limited by Supabase. If you already have an account, sign in. Otherwise wait a few minutes and try signup again.",
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string; errorCode?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorFromCode = params.errorCode ? LOGIN_ERROR_MESSAGES[params.errorCode] : undefined;
  const errorFromParam = params.error?.includes("NEXT_REDIRECT") ? undefined : params.error;
  const safeError = errorFromCode ?? errorFromParam;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Welcome Back</h1>
        <p className="mb-6 text-sm text-slate-600">Sign in to continue your interview practice sessions.</p>
        <AuthForm mode="login" action={signInAction} error={safeError} />
        <SupabaseConnectivityCheck />
      </div>
    </main>
  );
}
