// Reads a required environment variable and fails with a clear message if missing.
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Add it to .env (see .env.example).`);
  }
  return value;
}
