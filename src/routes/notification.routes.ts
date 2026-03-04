import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { validateQuery } from "../middleware/validate.middleware";
import { listNotificationsController } from "../controller/notifications/listNotifications.controller";
import { getUnreadCountController } from "../controller/notifications/getUnreadCount.controller";
import { markNotificationReadController } from "../controller/notifications/markNotificationRead.controller";
import { markAllNotificationsReadController } from "../controller/notifications/markAllNotificationsRead.controller";
import { listNotificationsQuerySchema } from "../dtos/notifications/listNotifications.dto";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get("/", validateQuery(listNotificationsQuerySchema), listNotificationsController);
notificationRouter.get("/unread-count", getUnreadCountController);
notificationRouter.patch("/:id/read", markNotificationReadController);
notificationRouter.patch("/read-all", markAllNotificationsReadController);
