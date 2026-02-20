import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../errors/httpError";
import { listIssueReports } from "../../services/issue.service";

export async function listIssues(req: Request, res: Response, next: NextFunction) {
  try {
    const reporterId = req.auth?.userId;
    if (!reporterId) {
      throw new HttpError(401, "Unauthorized");
    }

    const data = await listIssueReports(reporterId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
}
