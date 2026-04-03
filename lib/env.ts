const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
  "VAPI_API_KEY",
  "NEXT_PUBLIC_VAPI_PUBLIC_KEY",
] as const;

export function getEnv(name: (typeof requiredEnvVars)[number]): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function validateEnv(): void {
  requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
      // Lazy validation is better for local development, but this helps catch production misconfig.
      console.warn(`Missing environment variable: ${key}`);
    }
  });
}
