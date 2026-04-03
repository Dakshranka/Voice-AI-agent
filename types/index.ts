export type UserRole = "admin" | "recruiter";

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  skills: string[];
  created_by: string;
  created_at?: string;
}

export interface Interview {
  id: string;
  job_id: string;
  candidate_name: string;
  transcript: string;
  score: number | null;
  feedback: string | null;
  created_at: string;
}

export interface InterviewQuestion {
  question: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface TranscriptLine {
  speaker: "ai" | "candidate";
  text: string;
  timestamp: string;
}

export interface EvaluationResult {
  score: number;
  feedback: string;
}

export interface InterviewStartResponse {
  interviewId: string;
  questions: InterviewQuestion[];
}
