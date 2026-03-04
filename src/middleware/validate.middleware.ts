import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { HttpError } from "../errors/httpError";

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "Invalid request";
      return next(new HttpError(400, message));
    }

    req.body = result.data;
    return next();
  };
}

export function validateQuery(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "Invalid query";
      return next(new HttpError(400, message));
    }

    req.query = result.data as Request["query"];
    return next();
  };
}
