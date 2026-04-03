"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type CheckState = {
  ok: boolean;
  status: string;
  message: string;
  latencyMs?: number;
} | null;

export function SupabaseConnectivityCheck() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckState>(null);

  async function runCheck() {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/health/supabase", { method: "GET" });
      const data = (await response.json()) as CheckState;
      setResult(data);
    } catch (error) {
      setResult({
        ok: false,
        status: "error",
        message: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Supabase Connectivity</p>
          <p className="mt-0.5 text-xs text-slate-600">Verify your connection to Supabase</p>
        </div>
        <Button variant="secondary" type="button" onClick={runCheck} disabled={loading}>
          {loading ? "Checking..." : "Check Connection"}
        </Button>
      </div>

      {result ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
          <div
            className={`flex items-center gap-2 ${
              result.ok ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                result.ok ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <p className="text-sm font-semibold">
              {result.ok ? "Connected" : "Not Connected"} ({result.status})
            </p>
          </div>
          <p className="mt-2 text-sm text-slate-700">{result.message}</p>
          {typeof result.latencyMs === "number" ? (
            <p className="mt-1 text-xs text-slate-600">
              Latency: {result.latencyMs}ms
            </p>
          ) : null}
          {!result.ok && (
            <div className="mt-2 rounded bg-rose-50 p-2">
              <p className="text-xs text-rose-700">
                💡 <strong>Troubleshooting:</strong> Check your NEXT_PUBLIC_SUPABASE_URL and .env
                configuration, or verify Supabase service status.
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-500">
          Use this if signup or login shows fetch timeout errors.
        </p>
      )}
    </div>
  );
}
