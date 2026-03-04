import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../errors/httpError";
import type { ListNotificationsQueryInput } from "../../dtos/notifications/listNotifications.dto";
import { listMyNotifications } from "../../services/notification.service";

export async function listNotificationsController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      throw new HttpError(401, "Unauthorized");
    }

    const query = req.query as unknown as ListNotificationsQueryInput;

    const data = await listMyNotifications(userId, {
      page: query.page,
      limit: query.limit,
      isRead: query.isRead,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
}
