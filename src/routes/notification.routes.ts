import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { validateParams, validateQuery } from "../middleware/validate.middleware";
import { listNotificationsController } from "../controller/notifications/listNotifications.controller";
import { getUnreadCountController } from "../controller/notifications/getUnreadCount.controller";
import { markNotificationReadController } from "../controller/notifications/markNotificationRead.controller";
import { markAllNotificationsReadController } from "../controller/notifications/markAllNotificationsRead.controller";
import { deleteNotificationController } from "../controller/notifications/deleteNotification.controller";
import { listNotificationsQuerySchema } from "../dtos/notifications/listNotifications.dto";
import { markNotificationReadParamsSchema } from "../dtos/notifications/markNotificationRead.dto";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get("/", validateQuery(listNotificationsQuerySchema), listNotificationsController);
notificationRouter.get("/unread-count", getUnreadCountController);
notificationRouter.patch("/:id/read", validateParams(markNotificationReadParamsSchema), markNotificationReadController);
notificationRouter.delete("/:id", validateParams(markNotificationReadParamsSchema), deleteNotificationController);
notificationRouter.patch("/read-all", markAllNotificationsReadController);
