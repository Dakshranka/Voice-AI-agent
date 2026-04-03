import { DashboardHeader } from "@/components/dashboard/header";
import { JobForm } from "@/components/dashboard/job-form";

export default function CreateJobPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <DashboardHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Create Job Role</h1>
          <p className="mt-1 text-sm text-slate-600">
            Define role context and required skills to generate better interview questions.
          </p>
          <div className="mt-6">
            <JobForm />
          </div>
        </div>
      </main>
    </div>
  );
}
