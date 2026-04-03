"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useVapiInterview } from "@/hooks/use-vapi-interview";
import type { InterviewQuestion, TranscriptLine } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface VoiceInterviewPanelProps {
  jobId: string;
  jobDescription: string;
}

const INTERVIEW_DURATION_LIMIT_SECONDS = 20 * 60;

function formatTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}m ${seconds}s`;
}

function serializeTranscript(lines: TranscriptLine[]): string {
  return lines
    .map((line) => `[${line.timestamp}] ${line.speaker.toUpperCase()}: ${line.text.trim()}`)
    .join("\n");
}

export function VoiceInterviewPanel({ jobId, jobDescription }: VoiceInterviewPanelProps) {
  const router = useRouter();
  const [candidateName, setCandidateName] = useState("");
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "preparing" | "live" | "evaluating">("idle");

  const onTranscriptLine = useCallback(
    async (line: TranscriptLine) => {
      if (!interviewId) {
        return;
      }

      const response = await fetch("/api/interview/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          speaker: line.speaker,
          text: line.text,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to save transcript line");
      }
    },
    [interviewId],
  );

  const { startSession, stopSession, isListening, liveTranscript, error } = useVapiInterview({
    questions,
    candidateName,
    onTranscriptLine,
  });

  useEffect(() => {
    if (!isListening) {
      if (status === "live") {
        setStatus("idle");
      }
      return;
    }

    setStatus("live");
    const interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isListening, status]);

  const askedQuestionCount = Math.min(
    questions.length,
    liveTranscript.filter((line) => line.speaker === "ai" && line.text.includes("?")).length,
  );

  const activeQuestionIndex = Math.min(askedQuestionCount, Math.max(questions.length - 1, 0));
  const completedQuestions = questions.slice(0, askedQuestionCount);
  const remainingSeconds = Math.max(INTERVIEW_DURATION_LIMIT_SECONDS - timer, 0);

  async function prepareInterview() {
    const trimmedCandidateName = candidateName.trim();
    if (!trimmedCandidateName) {
      setLocalError("Please enter candidate name before starting.");
      return;
    }

    setLoading(true);
    setStatus("preparing");
    setLocalError(null);

    try {
      const response = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          candidateName: trimmedCandidateName,
          jobDescription,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        interviewId?: string;
        questions?: InterviewQuestion[];
      };

      if (!response.ok || !data.interviewId || !data.questions?.length) {
        throw new Error(data.error ?? "Failed to initialize interview");
      }

      setInterviewId(data.interviewId);
      setQuestions(data.questions);
      setTimer(0);
      setCandidateName(trimmedCandidateName);
      await startSession();
    } catch (prepareError) {
      setLocalError((prepareError as Error).message);
      setStatus("idle");
    } finally {
      setLoading(false);
    }
  }

  const completeInterview = useCallback(async () => {
    if (!interviewId) {
      return;
    }

    setLoading(true);
    setStatus("evaluating");
    setLocalError(null);

    try {
      await stopSession();

      const transcript = serializeTranscript(liveTranscript);
      const response = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, transcript }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to evaluate interview");
      }

      router.push(`/results/${interviewId}`);
      router.refresh();
    } catch (completeError) {
      setLocalError((completeError as Error).message);
      setStatus("idle");
    } finally {
      setLoading(false);
    }
  }, [interviewId, liveTranscript, router, stopSession]);

  useEffect(() => {
    if (
      isListening &&
      timer >= INTERVIEW_DURATION_LIMIT_SECONDS &&
      !loading &&
      status !== "evaluating"
    ) {
      void completeInterview();
    }
  }, [completeInterview, isListening, loading, status, timer]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr,1fr]">
      <div className="space-y-4">
        <Card>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-slate-900">Interview Control Center</h3>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                  status === "live"
                    ? "bg-emerald-100 text-emerald-700"
                    : status === "evaluating"
                      ? "bg-amber-100 text-amber-700"
                      : status === "preparing"
                        ? "bg-cyan-100 text-cyan-700"
                        : "bg-slate-200 text-slate-700"
                }`}
              >
                {status}
              </span>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Candidate Name</label>
              <Input
                value={candidateName}
                onChange={(event) => setCandidateName(event.target.value)}
                placeholder="Alex Johnson"
                disabled={isListening || loading}
              />
            </div>

            <div className="rounded-2xl border border-teal-200/70 bg-gradient-to-r from-teal-50 via-cyan-50 to-sky-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">Interview Duration (max 20m)</span>
                <span className="font-mono text-xl font-bold text-slate-900">{formatTimer(timer)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Remaining: {formatTimer(remainingSeconds)}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-700"
                  style={{
                    width: `${Math.min((timer / INTERVIEW_DURATION_LIMIT_SECONDS) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            {isListening && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
                <div className="relative flex h-3 w-3 items-center justify-center">
                  <div className="absolute h-3 w-3 animate-ping rounded-full bg-emerald-400/70"></div>
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                </div>
                <span className="text-sm font-medium text-emerald-700">Recording in progress...</span>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                disabled={!candidateName.trim() || isListening || loading}
                onClick={prepareInterview}
                className="w-full"
              >
                {status === "preparing" ? "Preparing..." : "Start Voice Interview"}
              </Button>
              <Button
                variant="secondary"
                disabled={!isListening || loading}
                onClick={completeInterview}
                className="w-full"
              >
                {status === "evaluating" ? "Evaluating..." : "End & Evaluate"}
              </Button>
            </div>

            {(localError || error) && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                <p className="text-sm text-rose-700">{localError || error}</p>
                <p className="mt-1 text-xs text-rose-600">
                  If this is a voice session issue, confirm Vapi keys and microphone permissions.
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">Question Progress</h3>
            <span className="text-xs font-semibold text-slate-600">
              {Math.min(askedQuestionCount, questions.length)}/{questions.length || 0}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {!questions.length && (
              <div className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
                Questions will load once interview starts.
              </div>
            )}

            {!!questions.length && isListening && (
              <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 animate-fade-in-up">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                  Current question
                </p>
                <p className="mt-1 text-sm text-slate-900">{questions[activeQuestionIndex]?.question}</p>
              </div>
            )}

            {!isListening && completedQuestions.length > 0 && (
              <div className="space-y-2">
                {questions.map((item, index) => (
                  <div key={item.question} className="rounded-lg bg-slate-50 p-3 animate-fade-in-up">
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-medium text-teal-700">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-900">{item.question}</p>
                        <span className="mt-1 inline-block rounded-full bg-teal-100 px-2 py-1 text-xs font-medium text-teal-700">
                          {item.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900">Live Transcript</h3>
          {isListening && (
            <div className="relative flex h-3 w-3 items-center justify-center">
              <div className="absolute h-3 w-3 animate-ping rounded-full bg-emerald-400/60"></div>
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            </div>
          )}
        </div>

        <div className="relative mt-3 max-h-[540px] overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          {liveTranscript.length ? (
            <div className="space-y-3">
              {liveTranscript.map((line, index) => (
                <div key={`${line.timestamp}-${index}`} className="flex gap-3 animate-fade-in-up">
                  <div
                    className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      line.speaker === "ai"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {line.speaker === "ai" ? "AI" : "Candidate"}
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-slate-800">{line.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-sm text-slate-500">
                {isListening
                  ? "Listening for responses..."
                  : "Transcript will update in real-time during the interview."}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
