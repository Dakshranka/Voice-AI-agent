import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      interviewId?: string;
      speaker?: "ai" | "candidate";
      text?: string;
    };

    if (!body.interviewId || !body.speaker || !body.text?.trim()) {
      return NextResponse.json(
        { error: "interviewId, speaker, and text are required" },
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

    const { data: interview, error: fetchError } = await supabase
      .from("interviews")
      .select("id, transcript, jobs!inner(created_by)")
      .eq("id", body.interviewId)
      .single();

    if (fetchError || !interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const job = Array.isArray(interview.jobs) ? interview.jobs[0] : interview.jobs;
    const ownerId = (job as { created_by: string } | undefined)?.created_by;
    if (ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const line = `[${new Date().toISOString()}] ${body.speaker.toUpperCase()}: ${body.text.trim()}`;
    const transcript = interview.transcript ? `${interview.transcript}\n${line}` : line;

    const { error: updateError } = await supabase
      .from("interviews")
      .update({ transcript })
      .eq("id", body.interviewId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, transcript });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
