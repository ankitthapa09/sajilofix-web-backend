import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../errors/httpError";
import { markAllMyNotificationsRead } from "../../services/notification.service";

export async function markAllNotificationsReadController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      throw new HttpError(401, "Unauthorized");
    }

    const data = await markAllMyNotificationsRead(userId);

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data,
    });
  } catch (err) {
    return next(err);
  }
}
