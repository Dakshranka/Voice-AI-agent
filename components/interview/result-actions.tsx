"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ResultActionsProps {
  transcript: string;
  jobId: string;
  interviewId: string;
}

function buildTranscriptFileName(interviewId: string): string {
  return `interview-${interviewId}-transcript.txt`;
}

export function ResultActions({ transcript, jobId, interviewId }: ResultActionsProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  async function copyTranscript() {
    try {
      await navigator.clipboard.writeText(transcript || "Transcript empty.");
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 1800);
    }
  }

  function downloadTranscript() {
    const blob = new Blob([transcript || "Transcript empty."], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = buildTranscriptFileName(interviewId);
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" onClick={copyTranscript}>
        {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy transcript"}
      </Button>
      <Button type="button" variant="secondary" onClick={downloadTranscript}>
        Download transcript
      </Button>
      <Link
        href={`/interview/${jobId}`}
        className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
      >
        Retake interview
      </Link>
    </div>
  );
}