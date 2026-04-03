import { notFound } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { VoiceInterviewPanel } from "@/components/interview/voice-interview-panel";
import { createClient } from "@/lib/supabase/server";

interface InterviewPageProps {
  params: Promise<{ jobId: string }>;
}

export default async function InterviewPage({ params }: InterviewPageProps) {
  const { jobId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, title, description, created_by")
    .eq("id", jobId)
    .single();

  if (error || !job || job.created_by !== user?.id) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <DashboardHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <section className="animate-fade-in-up rounded-3xl border border-cyan-100 bg-gradient-to-r from-white via-cyan-50 to-sky-50 p-6 shadow-sm md:p-8">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Voice Interview: {job.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
            AI will ask generated questions in sequence, capture transcript in real time, and evaluate
            performance when you end the interview.
          </p>
        </section>
        <div className="mt-6 animate-fade-in-up">
          <VoiceInterviewPanel jobId={job.id} jobDescription={job.description} />
        </div>
      </main>
    </div>
  );
}
