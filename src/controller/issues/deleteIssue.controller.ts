import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../errors/httpError";
import { deleteIssueReport } from "../../services/issue.service";

export async function deleteIssue(req: Request, res: Response, next: NextFunction) {
  try {
    const role = req.auth?.role;
    if (role !== "admin" && role !== "authority") {
      throw new HttpError(403, "Forbidden");
    }

    const issueId = req.params.id;
    const data = await deleteIssueReport(issueId);

    return res.status(200).json({
      success: true,
      message: "Issue deleted",
      data,
    });
  } catch (err) {
    return next(err);
  }
}
