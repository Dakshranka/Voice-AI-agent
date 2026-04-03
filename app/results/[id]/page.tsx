import { notFound } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { ResultActions } from "@/components/interview/result-actions";
import { createClient } from "@/lib/supabase/server";

interface ResultPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("interviews")
    .select("id, job_id, candidate_name, transcript, score, feedback, created_at, jobs!inner(created_by, title)")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const job = Array.isArray(data.jobs) ? data.jobs[0] : data.jobs;
  const ownerId = (job as { created_by: string; title: string } | undefined)?.created_by;
  if (!ownerId || ownerId !== user?.id) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <DashboardHeader />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-8 md:px-6">
        <section className="animate-fade-in-up rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Interview Result</h1>
          <p className="mt-1 text-sm text-slate-600 md:text-base">
            Candidate: {data.candidate_name} • Role: {(job as { title: string }).title}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Final Score</p>
              <span className="mt-2 inline-block rounded-xl bg-white px-3 py-2 text-sm font-semibold text-teal-900 shadow-sm">
              Score: {data.score ?? "Pending"}/100
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Interviewed At</p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {new Date(data.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {data.feedback ?? "No feedback yet."}
          </p>

          <div className="mt-5">
            <ResultActions transcript={data.transcript} jobId={data.job_id} interviewId={data.id} />
          </div>
        </section>

        <section className="animate-fade-in-up rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Transcript</h2>
          <pre className="mt-3 max-h-[55vh] overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs whitespace-pre-wrap text-slate-700 md:max-h-[500px]">
            {data.transcript || "Transcript empty."}
          </pre>
        </section>
      </main>
    </div>
  );
}
