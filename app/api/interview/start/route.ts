import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateInterviewQuestions } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      jobId?: string;
      candidateName?: string;
      jobDescription?: string;
    };

    if (!body.jobId || !body.candidateName?.trim()) {
      return NextResponse.json(
        { error: "jobId and candidateName are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, description, created_by")
      .eq("id", body.jobId)
      .single();

    if (jobError || !job || job.created_by !== user.id) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const questions = await generateInterviewQuestions(body.jobDescription ?? job.description);

    const { data: interview, error: insertError } = await supabase
      .from("interviews")
      .insert({
        job_id: job.id,
        candidate_name: body.candidateName.trim(),
        transcript: "",
      })
      .select("id")
      .single();

    if (insertError || !interview) {
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to create interview" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      interviewId: interview.id,
      questions,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
