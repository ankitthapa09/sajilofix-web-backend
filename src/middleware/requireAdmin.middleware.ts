import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../errors/httpError";

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.auth?.userId) throw new HttpError(401, "Unauthorized");
    if (req.auth.role !== "admin") throw new HttpError(403, "Forbidden");
    return next();
  } catch (err) {
    return next(err);
  }
}
