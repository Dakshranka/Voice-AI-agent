import { AuthForm } from "@/components/auth/auth-form";
import { SupabaseConnectivityCheck } from "@/components/auth/supabase-connectivity-check";
import { signUpAction } from "@/app/(auth)/actions";

interface RegisterPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const safeError = params.error?.includes("NEXT_REDIRECT") ? undefined : params.error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Create Student Account</h1>
        <p className="mb-6 text-sm text-slate-600">Start practicing structured voice interviews with AI.</p>
        <AuthForm mode="register" action={signUpAction} error={safeError} />
        <SupabaseConnectivityCheck />
      </div>
    </main>
  );
}
