import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/header";
import { JobList } from "@/components/dashboard/job-list";
import { InterviewList } from "@/components/dashboard/interview-list";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id;

  const [{ data: jobs }, { data: interviews }] = await Promise.all([
    supabase
      .from("jobs")
      .select("*")
      .eq("created_by", userId ?? "")
      .order("created_at", { ascending: false }),
    supabase
      .from("interviews")
      .select("id, job_id, candidate_name, transcript, score, feedback, created_at, jobs!inner(created_by)")
      .eq("jobs.created_by", userId ?? "")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="min-h-screen bg-slate-100">
      <DashboardHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-6">
        <section className="animate-fade-in-up rounded-3xl border border-cyan-100 bg-gradient-to-r from-white via-cyan-50 to-sky-50 p-6 shadow-sm md:p-8">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Recruiter Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600 md:text-base">
            Create job roles, run AI voice interviews, and review candidate evaluation reports.
          </p>
        </section>

        <section className="animate-fade-in-up">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Open Roles</h2>
            <Link href="/jobs/new" className="text-sm font-semibold text-teal-700">
              Add Role
            </Link>
          </div>
          <JobList jobs={(jobs ?? []) as never[]} />
        </section>

        <section className="animate-fade-in-up">
          <h2 className="mb-4 text-xl font-bold text-slate-900">Interview History</h2>
          <InterviewList interviews={(interviews ?? []) as never[]} />
        </section>
      </main>
    </div>
  );
}
