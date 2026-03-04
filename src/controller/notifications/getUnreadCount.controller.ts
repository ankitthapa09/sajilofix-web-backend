import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../errors/httpError";
import { getMyUnreadNotificationCount } from "../../services/notification.service";

export async function getUnreadCountController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      throw new HttpError(401, "Unauthorized");
    }

    const data = await getMyUnreadNotificationCount(userId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
}
