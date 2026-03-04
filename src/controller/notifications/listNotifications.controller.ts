import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../errors/httpError";
import { listMyNotifications } from "../../services/notification.service";

function toPositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return undefined;
}

export async function listNotificationsController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      throw new HttpError(401, "Unauthorized");
    }

    const page = toPositiveInt(req.query.page, 1);
    const limit = toPositiveInt(req.query.limit, 20);
    const isRead = toOptionalBoolean(req.query.isRead);

    const data = await listMyNotifications(userId, {
      page,
      limit,
      isRead,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
}
