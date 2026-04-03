export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: "admin" | "recruiter";
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: "admin" | "recruiter";
          created_at?: string;
        };
        Update: {
          email?: string;
          role?: "admin" | "recruiter";
        };
      };
      jobs: {
        Row: {
          id: string;
          title: string;
          description: string;
          skills: string[];
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          skills?: string[];
          created_by: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          skills?: string[];
        };
      };
      interviews: {
        Row: {
          id: string;
          job_id: string;
          candidate_name: string;
          transcript: string;
          score: number | null;
          feedback: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          candidate_name: string;
          transcript?: string;
          score?: number | null;
          feedback?: string | null;
          created_at?: string;
        };
        Update: {
          transcript?: string;
          score?: number | null;
          feedback?: string | null;
        };
      };
    };
  };
}
