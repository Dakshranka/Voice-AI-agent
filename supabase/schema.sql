create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'recruiter' check (role in ('admin', 'recruiter')),
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  skills text[] not null default '{}',
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_name text not null,
  transcript text not null default '',
  score numeric,
  feedback text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.jobs enable row level security;
alter table public.interviews enable row level security;

create policy "users can read own profile"
on public.users for select
using (auth.uid() = id);

create policy "users can upsert own profile"
on public.users for insert
with check (auth.uid() = id);

create policy "users can update own profile"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "users manage own jobs"
on public.jobs for all
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

create policy "users access own interviews"
on public.interviews for all
using (
  exists (
    select 1 from public.jobs
    where jobs.id = interviews.job_id and jobs.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.jobs
    where jobs.id = interviews.job_id and jobs.created_by = auth.uid()
  )
);
