import jwt, { type Secret } from "jsonwebtoken";
import { env } from "../../config/env";

export const testSeed = Date.now();

export function makePhone(offset: number) {
  const raw = String((testSeed + offset) % 100000000);
  return `98${raw.padStart(8, "0")}`;
}

export function makeEmail(prefix: string) {
  return `${prefix}-${testSeed}@gmail.com`;
}

export function makeAuthorityEmail(prefix: string) {
  return `${prefix}-${testSeed}@sajilofix.gov.np`;
}

export function signToken(role: "admin" | "authority" | "citizen", sub: string) {
  return jwt.sign({ sub, role }, env.JWT_SECRET as unknown as Secret, { expiresIn: "1h" });
}
