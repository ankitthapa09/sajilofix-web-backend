import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function parseCorsOrigins(value: string | undefined): string[] {
  if (!value) return ["http://localhost:3000"];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  MONGO_URI: requireEnv("MONGO_URI"),
  JWT_SECRET: requireEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  CORS_ORIGINS: parseCorsOrigins(process.env.CORS_ORIGINS),
};
