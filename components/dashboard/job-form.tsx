"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function JobForm() {
  const router = useRouter();
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          skills: skills
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create job");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Role title</label>
        <Input name="title" required placeholder="Senior Frontend Engineer" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Job description</label>
        <Textarea
          name="description"
          required
          rows={7}
          placeholder="Describe responsibilities, expected skills, and scope."
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Skills (comma separated)</label>
        <Input
          value={skills}
          onChange={(event) => setSkills(event.target.value)}
          placeholder="React, TypeScript, System Design"
        />
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Job"}
      </Button>
    </form>
  );
}
