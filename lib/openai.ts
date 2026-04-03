import { z } from "zod";
import type { EvaluationResult, InterviewQuestion } from "@/types";
import { getEnv } from "@/lib/env";

const questionSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(5),
        difficulty: z.enum(["easy", "medium", "hard"]),
      }),
    )
    .min(5)
    .max(10),
});

const evaluationSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string().min(20),
});

function parseScoreValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const match = value.match(/-?\d+(?:\.\d+)?/);
    if (!match) {
      return null;
    }
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeEvaluationPayload(payload: unknown): EvaluationResult {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid evaluation response payload");
  }

  const record = payload as Record<string, unknown>;
  const scoreCandidate =
    record.score ?? record.overallScore ?? record.overall_score ?? record.rating ?? null;
  const feedbackCandidate = record.feedback ?? record.summary ?? record.comments ?? null;

  const parsedScore = parseScoreValue(scoreCandidate);
  const score = clampScore(parsedScore ?? 0);

  const feedback =
    typeof feedbackCandidate === "string" && feedbackCandidate.trim().length > 0
      ? feedbackCandidate.trim()
      : "Evaluation completed. Review transcript for detailed candidate performance.";

  return evaluationSchema.parse({ score, feedback });
}

function parseModelJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Model response is not valid JSON");
    }
    return JSON.parse(jsonMatch[0]);
  }
}

interface GeminiChatResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

function buildFallbackEvaluation(transcript: string, jobDescription: string): EvaluationResult {
  const transcriptWords = transcript.trim().split(/\s+/).filter(Boolean).length;
  const transcriptLines = transcript.split("\n").filter((line) => line.trim().length > 0).length;
  const jobWords = jobDescription.trim().split(/\s+/).filter(Boolean).length;

  const lengthScore = Math.min(40, Math.round(transcriptWords / 8));
  const coverageScore = Math.min(25, transcriptLines * 3);
  const relevanceScore = Math.min(20, Math.round(jobWords / 20));
  const baseScore = 35;

  const score = clampScore(baseScore + lengthScore + coverageScore + relevanceScore);
  const feedback = [
    "Automatic fallback evaluation was used because the AI evaluator timed out or returned an invalid response.",
    score >= 75
      ? "Strong interview activity and enough response detail were captured."
      : score >= 50
        ? "The interview captured some useful responses, but you should speak more clearly and give fuller answers."
        : "The transcript was too short or too sparse. Try to answer with more detail and keep speaking throughout the interview.",
    "Review the transcript for specific improvement areas and retry the mock interview if needed.",
  ].join(" ");

  return evaluationSchema.parse({ score, feedback });
}

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = getEnv("GEMINI_API_KEY");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: systemPrompt,
            },
          ],
        },
        contents: [
          {
            parts: [
              {
                text: userPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    },
  );

  clearTimeout(timeoutId);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as GeminiChatResponse;
  let content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error("Gemini returned an empty response");
  }

  // Strip markdown code block wrappers if present
  // Gemini sometimes returns ```json ... ``` wrapped responses
  content = content
    .replace(/^```(?:json)?\s*/i, "") // Remove opening ```json or ```
    .replace(/```\s*$/, ""); // Remove closing ```

  return content;
}

export async function generateInterviewQuestions(jobDescription: string): Promise<InterviewQuestion[]> {
  const content = await callGemini(
    "You are an expert technical recruiter. Generate concise, role-specific interview questions.",
    `Job description:\n${jobDescription}\n\nGenerate EXACTLY 6-10 interview questions. Return ONLY valid JSON with shape: { "questions": [{ "question": string, "difficulty": "easy"|"medium"|"hard" }] }. No markdown, no explanation, just JSON.`,
  );

  const parsed = questionSchema.parse(JSON.parse(content));
  return parsed.questions;
}

export async function evaluateTranscript(input: {
  transcript: string;
  jobDescription: string;
}): Promise<EvaluationResult> {
  try {
    const content = await callGemini(
      "You are a senior interviewer. Evaluate candidate responses fairly and provide actionable feedback.",
      [
        `Job Description:\n${input.jobDescription}`,
        `Transcript:\n${input.transcript}`,
        "Evaluate candidate based on communication, technical accuracy, and confidence.",
        "Return JSON only in format: { \"score\": number, \"feedback\": string }",
      ].join("\n\n"),
    );

    const parsed = parseModelJson(content);
    return normalizeEvaluationPayload(parsed);
  } catch {
    return buildFallbackEvaluation(input.transcript, input.jobDescription);
  }
}
