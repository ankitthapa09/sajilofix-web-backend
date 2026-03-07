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

    const parsedQuery = result.data as Record<string, unknown>;
    const targetQuery = req.query as Record<string, unknown>;

    for (const key of Object.keys(targetQuery)) {
      delete targetQuery[key];
    }

    Object.assign(targetQuery, parsedQuery);
    return next();
  };
}

export function validateParams(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "Invalid params";
      return next(new HttpError(400, message));
    }

    const parsedParams = result.data as Record<string, string>;
    const targetParams = req.params as Record<string, string>;

    for (const key of Object.keys(targetParams)) {
      delete targetParams[key];
    }

    Object.assign(targetParams, parsedParams);
    return next();
  };
}
