import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../errors/httpError";
import { deleteMyNotification } from "../../services/notification.service";

export async function deleteNotificationController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      throw new HttpError(401, "Unauthorized");
    }

    const notificationId = req.params.id;
    if (!notificationId) {
      throw new HttpError(400, "Notification id is required");
    }

    const data = await deleteMyNotification(userId, notificationId);

    return res.status(200).json({
      success: true,
      message: "Notification removed",
      data,
    });
  } catch (err) {
    return next(err);
  }
}
