import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload, type Secret } from "jsonwebtoken";
import { env } from "../config/env";
import { HttpError } from "../errors/httpError";

type AuthTokenPayload = JwtPayload & {
  sub?: string;
  role?: string;
};

function normalizeRole(role: unknown): "admin" | "authority" | "citizen" | undefined {
  if (role === "admin" || role === "authority" || role === "citizen") return role;
  return undefined;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header("authorization") ?? req.header("Authorization");
    let token: string | undefined;

    if (header) {
      const [scheme, bearerToken] = header.split(" ");
      if (scheme !== "Bearer" || !bearerToken) {
        throw new HttpError(401, "Invalid Authorization header");
      }
      token = bearerToken;
    } else {
      // For browser clients using cookies (e.g. Next.js/SPA) without exposing tokens to JS
      token = (req as Request & { cookies?: Record<string, string> }).cookies?.auth_token;
      if (!token) throw new HttpError(401, "Unauthorized");
    }

    const payload = jwt.verify(token, env.JWT_SECRET as unknown as Secret) as AuthTokenPayload;
    const userId = payload.sub;
    if (!userId) throw new HttpError(401, "Invalid token payload");

    req.auth = { userId, role: normalizeRole(payload.role) };
    return next();
  } catch (err) {
    return next(err);
  }
}
