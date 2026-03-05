import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../errors/httpError";
import { getIssueReporterProfileForAuthority } from "../../services/issue.service";

export async function getIssueReporterProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const role = req.auth?.role;
    if (role !== "authority" && role !== "admin") {
      throw new HttpError(403, "Forbidden");
    }

    const reporterId = req.params.reporterId;
    const data = await getIssueReporterProfileForAuthority(reporterId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
}
