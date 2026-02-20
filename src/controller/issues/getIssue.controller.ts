import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../errors/httpError";
import { getIssueReport } from "../../services/issue.service";

export async function getIssue(req: Request, res: Response, next: NextFunction) {
  try {
    const reporterId = req.auth?.userId;
    if (!reporterId) {
      throw new HttpError(401, "Unauthorized");
    }

    const issueId = req.params.id;
    const data = await getIssueReport(issueId, reporterId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
}
