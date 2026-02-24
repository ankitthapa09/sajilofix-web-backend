import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../errors/httpError";
import { updateIssueStatus } from "../../services/issue.service";
import type { UpdateIssueStatusInput } from "../../dtos/issues/updateIssueStatus.dto";

export async function updateIssueStatusController(req: Request, res: Response, next: NextFunction) {
  try {
    const role = req.auth?.role;
    if (role !== "authority" && role !== "admin") {
      throw new HttpError(403, "Forbidden");
    }

    const issueId = req.params.id;
    const body = req.body as UpdateIssueStatusInput;

    const result = await updateIssueStatus(issueId, body.status);

    return res.status(200).json({
      success: true,
      message: "Issue status updated",
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}
