import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { evaluateTranscript } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { interviewId?: string; transcript?: string };

    if (!body.interviewId) {
      return NextResponse.json({ error: "interviewId is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("interviews")
      .select("id, transcript, jobs!inner(description, created_by)")
      .eq("id", body.interviewId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const jobRow = Array.isArray(data.jobs) ? data.jobs[0] : data.jobs;
    const job = jobRow as { description: string; created_by: string } | undefined;
    if (!job || job.created_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const transcript = body.transcript?.trim() || data.transcript?.trim() || "";
    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is empty. Conduct the interview before evaluation." },
        { status: 400 },
      );
    }

    const { error: transcriptUpdateError } = await supabase
      .from("interviews")
      .update({ transcript })
      .eq("id", data.id);

    if (transcriptUpdateError) {
      return NextResponse.json({ error: transcriptUpdateError.message }, { status: 400 });
    }

    const evaluation = await evaluateTranscript({
      transcript,
      jobDescription: job.description,
    });

    const { error: updateError } = await supabase
      .from("interviews")
      .update({ score: evaluation.score, feedback: evaluation.feedback })
      .eq("id", data.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json(evaluation);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
