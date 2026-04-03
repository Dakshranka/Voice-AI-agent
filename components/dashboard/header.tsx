import Link from "next/link";
import { signOutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export async function DashboardHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const metadataName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : null;
  const emailName = user?.email?.split("@")[0] ?? "Student";
  const displayName = metadataName?.trim() || emailName;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight text-slate-900">
          Interview Sprint
        </Link>
        <div className="flex items-center gap-2">
          <div className="hidden rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 sm:block">
            Logged in: {displayName}
          </div>
          <Link href="/jobs/new" className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800">
            Create Role
          </Link>
          <form action={signOutAction}>
            <Button variant="secondary" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
