"use client";

import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import type { InterviewQuestion, TranscriptLine } from "@/types";

interface VapiMessage {
  type?: string;
  role?: string;
  transcriptType?: string;
  transcript?: string;
  text?: string;
}

interface UseVapiInterviewOptions {
  questions: InterviewQuestion[];
  candidateName: string;
  onTranscriptLine: (line: TranscriptLine) => Promise<void>;
}

interface VapiRuntime {
  on: (event: string, cb: (payload: unknown) => void) => void;
  start: (config: unknown) => Promise<void>;
  stop: () => Promise<void>;
}

const STOP_TIMEOUT_MS = 6000;

function toErrorMessage(event: unknown): string {
  if (event instanceof Error) {
    return event.message;
  }

  if (typeof event === "string") {
    return event;
  }

  if (event && typeof event === "object" && "message" in event) {
    const maybeMessage = (event as { message?: unknown }).message;
    if (typeof maybeMessage === "string") {
      return maybeMessage;
    }
  }

  return "Vapi session error";
}

function isIgnorableSessionEndError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("meeting has ended") ||
    normalized.includes("meeting ended due to ejection") ||
    normalized.includes("call ended")
  );
}

export function useVapiInterview({
  questions,
  candidateName,
  onTranscriptLine,
}: UseVapiInterviewOptions) {
  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  const vapiRef = useRef<VapiRuntime | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<TranscriptLine[]>([]);
  const [error, setError] = useState<string | null>(
    publicKey ? null : "Missing NEXT_PUBLIC_VAPI_PUBLIC_KEY",
  );
  const isUnmountingRef = useRef(false);
  const isListeningRef = useRef(false);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    if (!publicKey) {
      return;
    }

    const vapi = new Vapi(publicKey) as unknown as VapiRuntime;
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      setError(null);
      setIsListening(true);
    });

    vapi.on("call-end", () => {
      setError(null);
      setIsListening(false);
    });

    vapi.on("message", async (rawMessage: unknown) => {
      const message = rawMessage as VapiMessage;
      if (message.type !== "transcript") {
        return;
      }

      const isAI = message.role === "assistant";
      const text = message.transcript || message.text;
      if (!text) {
        return;
      }

      const line: TranscriptLine = {
        speaker: isAI ? "ai" : "candidate",
        text,
        timestamp: new Date().toISOString(),
      };

      setLiveTranscript((prev) => [...prev, line]);
      try {
        await onTranscriptLine(line);
      } catch (persistError) {
        setError(toErrorMessage(persistError));
      }
    });

    vapi.on("error", (event: unknown) => {
      const message = toErrorMessage(event);
      if (isIgnorableSessionEndError(message)) {
        setError(null);
        return;
      }
      setError(message);
    });

    return () => {
      isUnmountingRef.current = true;
      if (isListeningRef.current) {
        void vapi.stop().catch(() => {
          // Ignore teardown errors when the call is already closed.
        });
      }
      vapiRef.current = null;
    };
  }, [onTranscriptLine, publicKey]);

  async function startSession() {
    if (!vapiRef.current) {
      setError("Vapi is not initialized");
      return;
    }

    setError(null);
    const prompt = [
      `You are an AI recruiter conducting a voice interview with ${candidateName}.`,
      "Ask each question exactly once and wait for candidate response before moving on.",
      "Questions:",
      ...questions.map((item, index) => `${index + 1}. (${item.difficulty}) ${item.question}`),
      "Keep a warm, professional tone and keep each follow-up concise.",
    ].join("\n");

    await vapiRef.current.start({
      name: "Recruiter Interview Assistant",
      firstMessage: `Hi ${candidateName}, welcome. Let's begin the interview.`,
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en-US",
      },
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        systemPrompt: prompt,
      },
      voice: {
        provider: "11labs",
        voiceId: "sarah",
      },
    });
  }

  async function stopSession() {
    if (!vapiRef.current) {
      return;
    }

    try {
      setIsListening(false);
      await Promise.race([
        vapiRef.current.stop(),
        new Promise((resolve) => {
          setTimeout(resolve, STOP_TIMEOUT_MS);
        }),
      ]);
      setError(null);
    } catch (stopError) {
      const message = toErrorMessage(stopError);
      if (!isIgnorableSessionEndError(message)) {
        setError(message);
      }
    }
    if (isUnmountingRef.current) {
      setError(null);
    }
  }

  return {
    startSession,
    stopSession,
    isListening,
    liveTranscript,
    error,
  };
}
