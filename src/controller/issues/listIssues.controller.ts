import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../errors/httpError";
import { listAllIssueReports, listIssueReports } from "../../services/issue.service";

export async function listIssues(req: Request, res: Response, next: NextFunction) {
  try {
    const reporterId = req.auth?.userId;
    const role = req.auth?.role;
    const scope = typeof req.query.scope === "string" ? req.query.scope.trim().toLowerCase() : "";
    const includeAll = scope === "all";
    if (!reporterId) {
      throw new HttpError(401, "Unauthorized");
    }

    const data = includeAll || role === "authority" || role === "admin"
      ? await listAllIssueReports()
      : await listIssueReports(reporterId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
}
