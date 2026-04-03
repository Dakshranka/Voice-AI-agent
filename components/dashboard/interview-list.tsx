import Link from "next/link";
import type { Interview } from "@/types";
import { Card } from "@/components/ui/card";

interface InterviewListProps {
  interviews: Interview[];
}

export function InterviewList({ interviews }: InterviewListProps) {
  if (!interviews.length) {
    return <Card>No interviews yet. Start one from a job card.</Card>;
  }

  return (
    <div className="space-y-3">
      {interviews.map((interview) => (
        <Card key={interview.id}>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h4 className="font-semibold text-slate-900">{interview.candidate_name}</h4>
              <p className="text-sm text-slate-600">
                {new Date(interview.created_at).toLocaleString()} • Score: {interview.score ?? "Pending"}
              </p>
            </div>
            <Link href={`/results/${interview.id}`} className="text-sm font-semibold text-teal-700">
              View result
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}
