# Interview Sprint

Interview Sprint is a student-focused AI interview practice platform built with Next.js, Supabase, Google Gemini, and Vapi.

It lets a user:
- create a practice role
- generate interview questions from the role description
- run a live voice interview with an AI interviewer
- save transcript lines in real time
- evaluate the interview with a score and feedback
- review, copy, download, and retake the interview

## Live Features

- Public landing page with animated hero, header, and footer
- Student registration and login
- Dashboard for creating practice roles
- Voice interview session with AI-driven questions
- Live transcript persistence to Supabase
- Automatic interview evaluation and scoring
- Result page with score, feedback, transcript, copy, download, and retake actions
- Role deletion from the dashboard
- Logged-in user name shown in the dashboard header
- Responsive layout for mobile and desktop

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase Auth, Postgres, and RLS
- Google Gemini 2.5 Flash for question generation and evaluation
- Vapi Web SDK for live voice conversations

## Architecture Overview

The app is organized around four layers:

1. UI layer
- `app/` contains pages, layouts, and API routes
- `components/` contains reusable UI and feature components
- `hooks/` contains client-side session logic for Vapi

2. Application logic
- `lib/openai.ts` generates interview questions and evaluates transcripts with Gemini
- `lib/env.ts` validates required environment variables
- `lib/supabase/*` creates server, browser, and middleware Supabase clients

3. Data layer
- Supabase stores users, jobs, and interviews
- Row Level Security keeps records scoped to the logged-in user

4. External services
- Gemini generates questions and scores interviews
- Vapi handles the real-time voice session in the browser

## User Flow

1. User opens the landing page.
2. User registers or logs in.
3. User creates a practice role from the dashboard.
4. User starts an interview from a role.
5. The app generates questions from the role description.
6. Vapi starts a live AI voice session.
7. Transcript lines are saved to Supabase as the interview runs.
8. When the interview ends, the transcript is evaluated and a score is saved.
9. The result page shows score, feedback, transcript, and actions to copy, download, or retake.

## Project Structure

- `app/page.tsx` public home page
- `app/(auth)/login/page.tsx` login screen
- `app/(auth)/register/page.tsx` registration screen
- `app/dashboard/page.tsx` dashboard listing roles and interview history
- `app/jobs/new/page.tsx` create role page
- `app/interview/[jobId]/page.tsx` live interview page
- `app/results/[id]/page.tsx` evaluation result page
- `app/api/jobs/route.ts` create, list, and delete roles
- `app/api/interview/start/route.ts` create interview and generate questions
- `app/api/interview/respond/route.ts` persist transcript lines
- `app/api/interview/evaluate/route.ts` evaluate transcript and save score/feedback
- `app/api/health/supabase/route.ts` Supabase connectivity check
- `components/auth/*` auth form and connectivity check
- `components/dashboard/*` dashboard header, role list, interview list, and role form
- `components/interview/*` voice interview panel and result actions
- `components/ui/*` lightweight button, card, input, and textarea primitives
- `hooks/use-vapi-interview.ts` Vapi session hook
- `lib/openai.ts` Gemini question generation and evaluation
- `lib/supabase/*` server/browser/middleware Supabase clients
- `supabase/schema.sql` database schema and RLS policies
- `types/*` shared TypeScript types

## Data Model

### `users`
Stores authenticated users.
- `id`
- `email`
- `role`
- `created_at`

### `jobs`
Stores practice roles created by the user.
- `id`
- `title`
- `description`
- `skills`
- `created_by`
- `created_at`

### `interviews`
Stores each practice interview.
- `id`
- `job_id`
- `candidate_name`
- `transcript`
- `score`
- `feedback`
- `created_at`

## API Routes

### `GET /api/jobs`
Returns the current user’s roles.

### `POST /api/jobs`
Creates a new role.

Body:
```json
{
  "title": "Frontend Engineer",
  "description": "Role description",
  "skills": ["React", "TypeScript"]
}
```

### `DELETE /api/jobs?jobId=...`
Deletes a role owned by the current user.

### `POST /api/interview/start`
Creates an interview record and generates questions.

Body:
```json
{
  "jobId": "uuid",
  "candidateName": "Alex Johnson",
  "jobDescription": "Optional override"
}
```

### `POST /api/interview/respond`
Appends one transcript line during the interview.

Body:
```json
{
  "interviewId": "uuid",
  "speaker": "ai",
  "text": "Question or answer text"
}
```

### `POST /api/interview/evaluate`
Evaluates transcript, saves score and feedback, and returns the result.

Body:
```json
{
  "interviewId": "uuid",
  "transcript": "Optional full transcript override"
}
```

### `GET /api/health/supabase`
Checks Supabase connectivity from the browser.

## Environment Variables

Create `.env.local` with the following values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
VAPI_API_KEY=
NEXT_PUBLIC_VAPI_PUBLIC_KEY=
```

Notes:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required for browser and server Supabase clients.
- `SUPABASE_SERVICE_ROLE_KEY` is used for privileged server-side access.
- `GEMINI_API_KEY` powers question generation and evaluation.
- `NEXT_PUBLIC_VAPI_PUBLIC_KEY` is required for the live voice session.
- `VAPI_API_KEY` is reserved for Vapi-side integration needs.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy your secrets into `.env.local`.

### 3. Create the database schema
Run the SQL in `supabase/schema.sql` inside the Supabase SQL editor.

### 4. Start the development server
```bash
npm run dev
```

### 5. Open the app
Visit `http://localhost:3000`.

## Database Setup

The schema file creates:
- tables for users, jobs, and interviews
- row level security policies
- user ownership rules so users only see their own data

If you are setting this up for a new Supabase project, make sure:
- Auth is enabled
- email/password sign-in is enabled
- the schema file is executed once after project creation

## Notes for Developers

- The app is student-facing. The signup UI does not expose an admin selection.
- Live interview scoring is resilient: if Gemini fails or times out, the app falls back to a deterministic score so results still save.
- The interview duration is capped at 20 minutes in the UI.
- The result page includes copy, download, and retake actions.
- Dashboard role cards can be deleted directly from the UI.

## Troubleshooting

### Score is pending
- Check `GEMINI_API_KEY`.
- Check the server logs for `/api/interview/evaluate`.
- Verify the transcript is not empty.

### Interview stops unexpectedly
- Confirm microphone permissions in the browser.
- Check the Vapi public key.
- Review the browser console for Vapi end events.

### Supabase login or save errors
- Run the connectivity check on the login/register pages.
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Confirm the user is authenticated before starting a session.

### Build or runtime issues with fonts
- This app uses Google fonts through `next/font/google`.
- If your build environment blocks outbound requests, consider self-hosting fonts.

## Recommended GitHub README Summary

A short summary you can use in the repo description:

> Interview Sprint is a student-focused AI voice interview practice app with live transcript saving, automatic scoring, role-based practice sessions, and downloadable interview results.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## License

Add your preferred license before publishing publicly.
