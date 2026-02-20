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

    location: {
      latitude: { type: Number },
      longitude: { type: Number },
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

export type IssueReport = InferSchemaType<typeof issueReportSchema>;

export const IssueReportModel: Model<IssueReport> =
  mongoose.models.IssueReport || mongoose.model<IssueReport>("IssueReport", issueReportSchema, "issue_reports");
