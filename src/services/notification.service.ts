import { HttpError } from "../errors/httpError";
import {
  type NotificationEntityType,
  type NotificationRecipientRole,
  type NotificationType,
} from "../models/notification.model";
import { NotificationRepository } from "../repositories/notification.repository";

type NotificationPayload = {
  recipientUserId: string;
  recipientRole: NotificationRecipientRole;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: NotificationEntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

type ListNotificationsInput = {
  page?: number;
  limit?: number;
  isRead?: boolean;
};

function requireUserId(userId?: string) {
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }
  return userId;
}

export async function createNotification(payload: NotificationPayload) {
  if (!payload.recipientUserId?.trim()) {
    throw new HttpError(400, "Recipient user id is required");
  }

  if (!payload.title?.trim() || !payload.message?.trim()) {
    throw new HttpError(400, "Notification title and message are required");
  }

  const created = await NotificationRepository.create({
    recipientUserId: payload.recipientUserId.trim(),
    recipientRole: payload.recipientRole,
    type: payload.type,
    title: payload.title.trim(),
    message: payload.message.trim(),
    entityType: payload.entityType ?? "system",
    entityId: payload.entityId?.trim() || undefined,
    metadata: payload.metadata,
  });

  return created;
}

export async function createNotifications(payloads: NotificationPayload[]) {
  const filtered = payloads
    .filter((item) => item.recipientUserId?.trim() && item.title?.trim() && item.message?.trim())
    .map((item) => ({
      recipientUserId: item.recipientUserId.trim(),
      recipientRole: item.recipientRole,
      type: item.type,
      title: item.title.trim(),
      message: item.message.trim(),
      entityType: item.entityType ?? "system",
      entityId: item.entityId?.trim() || undefined,
      metadata: item.metadata,
    }));

  if (!filtered.length) return [];

  return NotificationRepository.createMany(filtered);
}

export async function listMyNotifications(userId: string, input: ListNotificationsInput) {
  const authUserId = requireUserId(userId);

  const items = await NotificationRepository.listByRecipient(authUserId, {
    page: input.page,
    limit: input.limit,
    isRead: input.isRead,
  });

  const total = await NotificationRepository.countByRecipient(authUserId, input.isRead);

  return {
    items,
    total,
    page: input.page && input.page > 0 ? input.page : 1,
    limit: input.limit && input.limit > 0 ? input.limit : 20,
  };
}

export async function getMyUnreadNotificationCount(userId: string) {
  const authUserId = requireUserId(userId);
  const count = await NotificationRepository.countUnreadByRecipient(authUserId);
  return { unreadCount: count };
}

export async function markMyNotificationRead(userId: string, notificationId: string) {
  const authUserId = requireUserId(userId);

  const updated = await NotificationRepository.markRead(notificationId, authUserId);
  if (!updated) {
    throw new HttpError(404, "Notification not found");
  }

  return updated;
}

export async function markAllMyNotificationsRead(userId: string) {
  const authUserId = requireUserId(userId);
  const result = await NotificationRepository.markAllRead(authUserId);

  return {
    modifiedCount: result.modifiedCount ?? 0,
  };
}

export async function deleteMyNotification(userId: string, notificationId: string) {
  const authUserId = requireUserId(userId);

  const deleted = await NotificationRepository.deleteOne(notificationId, authUserId);
  if (!deleted) {
    throw new HttpError(404, "Notification not found");
  }

  return {
    id: String(deleted._id),
  };
}

export async function notifyIssueStatusChanged(input: {
  recipientUserId: string;
  recipientRole: NotificationRecipientRole;
  issueId: string;
  issueTitle: string;
  status: string;
  changedByRole: "admin" | "authority";
}) {
  return createNotification({
    recipientUserId: input.recipientUserId,
    recipientRole: input.recipientRole,
    type: "issue_status_changed",
    title: "Issue status updated",
    message: `Your issue \"${input.issueTitle}\" is now ${input.status.replace(/_/g, " ")}.`,
    entityType: "issue",
    entityId: input.issueId,
    metadata: {
      status: input.status,
      changedByRole: input.changedByRole,
    },
  });
}

export async function notifyIssueCreated(input: {
  recipientUserId: string;
  recipientRole: NotificationRecipientRole;
  issueId: string;
  issueTitle: string;
  category: string;
}) {
  return createNotification({
    recipientUserId: input.recipientUserId,
    recipientRole: input.recipientRole,
    type: "issue_created",
    title: "New issue reported",
    message: `A new issue \"${input.issueTitle}\" has been reported in ${input.category}.`,
    entityType: "issue",
    entityId: input.issueId,
    metadata: {
      category: input.category,
    },
  });
}
