import mongoose, { type InferSchemaType, type Model } from "mongoose";

export const NOTIFICATION_TYPES = [
  "issue_created",
  "issue_status_changed",
  "issue_comment_added",
  "system",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_RECIPIENT_ROLES = ["admin", "authority", "citizen"] as const;
export type NotificationRecipientRole = (typeof NOTIFICATION_RECIPIENT_ROLES)[number];

export const NOTIFICATION_ENTITY_TYPES = ["issue", "comment", "system"] as const;
export type NotificationEntityType = (typeof NOTIFICATION_ENTITY_TYPES)[number];

const notificationSchema = new mongoose.Schema(
  {
    recipientUserId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    recipientRole: {
      type: String,
      enum: NOTIFICATION_RECIPIENT_ROLES,
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    entityType: {
      type: String,
      enum: NOTIFICATION_ENTITY_TYPES,
      required: true,
      default: "system" satisfies NotificationEntityType,
    },

    entityId: {
      type: String,
      trim: true,
      default: undefined,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: undefined,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientUserId: 1, createdAt: -1 });

export type Notification = InferSchemaType<typeof notificationSchema>;

export const NotificationModel: Model<Notification> =
  mongoose.models.Notification || mongoose.model<Notification>("Notification", notificationSchema, "notifications");
