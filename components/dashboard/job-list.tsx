"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Job } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface JobListProps {
  jobs: Job[];
}

export function JobList({ jobs }: JobListProps) {
  const router = useRouter();
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onDeleteRole(jobId: string, title: string) {
    const confirmed = window.confirm(
      `Delete role \"${title}\"? This will also remove all interviews linked to this role.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingRoleId(jobId);
    setError(null);

    try {
      const response = await fetch(`/api/jobs?jobId=${encodeURIComponent(jobId)}`, {
        method: "DELETE",
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete role");
      }

      router.refresh();
    } catch (deleteError) {
      setError((deleteError as Error).message);
    } finally {
      setDeletingRoleId(null);
    }
  }

  if (!jobs.length) {
    return <Card>No jobs yet. Create your first role to begin interviewing.</Card>;
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {jobs.map((job) => (
          <Card key={job.id}>
            <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm text-slate-600">{job.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <span
                  key={`${job.id}-${skill}`}
                  className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <Link
                href={`/interview/${job.id}`}
                className="inline-block text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                Start interview
              </Link>
              <Button
                variant="danger"
                type="button"
                onClick={() => onDeleteRole(job.id, job.title)}
                disabled={deletingRoleId === job.id}
              >
                {deletingRoleId === job.id ? "Deleting..." : "Delete role"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
