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

  listByReporter: async (reporterId: string) => {
    return IssueReportModel.find({ reporterId }).sort({ createdAt: -1 }).exec();
  },

  updateStatus: async (id: string, status: string) => {
    return IssueReportModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
  },
};
