import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../errors/httpError";
import { createIssueReport } from "../../services/issue.service";
import type { CreateIssueInput } from "../../dtos/issues/createIssue.dto";

export async function createIssue(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as CreateIssueInput;
    const reporterId = req.auth?.userId;

    if (!reporterId) {
      throw new HttpError(401, "Unauthorized");
    }

    const result = await createIssueReport(body, reporterId);

    return res.status(201).json({
      success: true,
      message: "Issue reported successfully",
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}
