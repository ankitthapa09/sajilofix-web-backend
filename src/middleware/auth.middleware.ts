import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload, type Secret } from "jsonwebtoken";
import { env } from "../config/env";
import { HttpError } from "../errors/httpError";

type AuthTokenPayload = JwtPayload & {
  sub?: string;
  role?: string;
};

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header("authorization") ?? req.header("Authorization");
    if (!header) throw new HttpError(401, "Missing Authorization header");

    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) throw new HttpError(401, "Invalid Authorization header");

    const payload = jwt.verify(token, env.JWT_SECRET as unknown as Secret) as AuthTokenPayload;
    const userId = payload.sub;
    if (!userId) throw new HttpError(401, "Invalid token payload");

    req.auth = { userId, role: payload.role };
    return next();
  } catch (err) {
    return next(err);
  }
}
