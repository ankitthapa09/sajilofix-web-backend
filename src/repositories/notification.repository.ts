import type { Document } from "mongoose";
import { NotificationModel, type Notification } from "../models/notification.model";

export type NotificationDoc = Document & Notification;

export const NotificationRepository = {
  create: async (data: Partial<Notification>) => {
    return NotificationModel.create(data);
  },

  createMany: async (items: Partial<Notification>[]) => {
    if (!items.length) return [];
    return NotificationModel.insertMany(items, { ordered: false });
  },

  listByRecipient: async (
    recipientUserId: string,
    options?: {
      page?: number;
      limit?: number;
      isRead?: boolean;
    }
  ) => {
    const page = options?.page && options.page > 0 ? options.page : 1;
    const limit = options?.limit && options.limit > 0 ? options.limit : 20;

    const filter: { recipientUserId: string; isRead?: boolean } = {
      recipientUserId,
    };

    if (typeof options?.isRead === "boolean") {
      filter.isRead = options.isRead;
    }

    return NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  },

  countByRecipient: async (recipientUserId: string, isRead?: boolean) => {
    const filter: { recipientUserId: string; isRead?: boolean } = {
      recipientUserId,
    };

    if (typeof isRead === "boolean") {
      filter.isRead = isRead;
    }

    return NotificationModel.countDocuments(filter).exec();
  },

  countUnreadByRecipient: async (recipientUserId: string) => {
    return NotificationModel.countDocuments({ recipientUserId, isRead: false }).exec();
  },

  markRead: async (id: string, recipientUserId: string) => {
    return NotificationModel.findOneAndUpdate(
      { _id: id, recipientUserId },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      { new: true }
    ).exec();
  },

  markAllRead: async (recipientUserId: string) => {
    const readAt = new Date();
    return NotificationModel.updateMany(
      { recipientUserId, isRead: false },
      {
        $set: {
          isRead: true,
          readAt,
        },
      }
    ).exec();
  },
};
