import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  MONGO_URI: requireEnv("MONGO_URI"),
};
