import { NextResponse } from "next/server";

function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      {
        ok: false,
        status: "misconfigured",
        message: "Missing Supabase URL or anon key in environment.",
      },
      { status: 500 },
    );
  }

  const started = Date.now();

  try {
    const authHealth = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: "GET",
      headers: {
        apikey: anonKey,
      },
      signal: timeoutSignal(8000),
      cache: "no-store",
    });

    const latencyMs = Date.now() - started;

    if (!authHealth.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: "unreachable",
          message: `Supabase responded with status ${authHealth.status}.`,
          latencyMs,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: "connected",
      message: "Supabase is reachable and responding normally.",
      latencyMs,
    });
  } catch (error) {
    const latencyMs = Date.now() - started;
    return NextResponse.json(
      {
        ok: false,
        status: "timeout",
        message:
          error instanceof Error
            ? `Connection failed: ${error.message}`
            : "Connection failed.",
        latencyMs,
      },
      { status: 504 },
    );
  }
}
