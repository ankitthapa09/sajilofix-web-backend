import type { Document } from "mongoose";
import { IssueReportModel, type IssueReport } from "../models/issueReport.model";

export type IssueReportDoc = Document & IssueReport;

export const IssueRepository = {
  create: async (data: Partial<IssueReport>) => {
    return IssueReportModel.create(data);
  },

  findById: async (id: string) => {
    return IssueReportModel.findById(id).exec();
  },

  findByIdWithReporter: async (id: string) => {
    return IssueReportModel.findById(id)
      .populate("reporterId", "fullName")
      .exec();
  },

  listAll: async () => {
    return IssueReportModel.find()
      .sort({ createdAt: -1 })
      .populate("reporterId", "fullName")
      .exec();
  },

  listPriority: async () => {
    return IssueReportModel.find({
      urgency: { $in: ["urgent", "high"] },
      status: { $in: ["pending", "in_progress"] },
    })
      .sort({ createdAt: -1 })
      .populate("reporterId", "fullName")
      .exec();
  },

  listByReporter: async (reporterId: string) => {
    return IssueReportModel.find({ reporterId }).sort({ createdAt: -1 }).exec();
  },

  deleteById: async (id: string) => {
    return IssueReportModel.findByIdAndDelete(id).exec();
  },

  updateStatus: async (id: string, status: string, changedByRole: "admin" | "authority", changedByUserId: string) => {
    const changedAt = new Date();
    return IssueReportModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          statusUpdatedByRole: changedByRole,
          statusUpdatedByUserId: changedByUserId,
          statusUpdatedAt: changedAt,
        },
        $push: {
          statusHistory: {
            status,
            changedByRole,
            changedByUserId,
            changedAt,
          },
        },
      },
      { new: true }
    ).exec();
  },
};
