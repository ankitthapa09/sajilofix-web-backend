import mongoose, { type InferSchemaType, type Model } from "mongoose";

export const ISSUE_CATEGORIES = [
  "roads_potholes",
  "electricity",
  "water_supply",
  "waste_management",
  "street_lights",
  "public_infrastructure",
  "others",
] as const;
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export const ISSUE_URGENCY = ["low", "medium", "high", "urgent"] as const;
export type IssueUrgency = (typeof ISSUE_URGENCY)[number];

export const ISSUE_STATUS = ["pending", "in_progress", "resolved", "rejected"] as const;
export type IssueStatus = (typeof ISSUE_STATUS)[number];

export const ISSUE_STATUS_ACTOR_ROLES = ["admin", "authority"] as const;
export type IssueStatusActorRole = (typeof ISSUE_STATUS_ACTOR_ROLES)[number];

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (value: number[]) => Array.isArray(value) && value.length === 2,
        message: "Geo coordinates must be [longitude, latitude]",
      },
    },
  },
  { _id: false }
);

const issueReportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "CitizenUser",
    },

    category: {
      type: String,
      enum: ISSUE_CATEGORIES,
      required: true,
      index: true,
    },

    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },

    urgency: {
      type: String,
      enum: ISSUE_URGENCY,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ISSUE_STATUS,
      required: true,
      default: "pending" satisfies IssueStatus,
      index: true,
    },

    statusUpdatedByRole: {
      type: String,
      enum: ISSUE_STATUS_ACTOR_ROLES,
      required: false,
    },

    statusUpdatedByUserId: {
      type: String,
      trim: true,
      required: false,
    },

    statusUpdatedAt: {
      type: Date,
      required: false,
    },

    statusHistory: [
      {
        _id: false,
        status: {
          type: String,
          enum: ISSUE_STATUS,
          required: true,
        },
        changedByRole: {
          type: String,
          enum: ISSUE_STATUS_ACTOR_ROLES,
          required: true,
        },
        changedByUserId: {
          type: String,
          required: true,
          trim: true,
        },
        changedAt: {
          type: Date,
          required: true,
        },
      },
    ],

    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      geo: {
        type: pointSchema,
      },
      address: { type: String, required: true, trim: true },
      district: { type: String, trim: true },
      municipality: { type: String, trim: true },
      ward: { type: String, trim: true },
      landmark: { type: String, trim: true },
    },

    photos: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

issueReportSchema.index({ "location.geo": "2dsphere" });

export type IssueReport = InferSchemaType<typeof issueReportSchema>;

export const IssueReportModel: Model<IssueReport> =
  mongoose.models.IssueReport || mongoose.model<IssueReport>("IssueReport", issueReportSchema, "issue_reports");
