import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../errors/httpError";
import { ISSUE_PHOTOS_RELATIVE_DIR } from "../../middleware/upload.middleware";
import { createIssueReport } from "../../services/issue.service";
import type { CreateIssueInput } from "../../dtos/issues/createIssue.dto";

export async function createIssue(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as CreateIssueInput;
    const reporterId = req.auth?.userId;

    if (!reporterId) {
      throw new HttpError(401, "Unauthorized");
    }

    const files = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];
    const photoPaths = files.map((file) => `${ISSUE_PHOTOS_RELATIVE_DIR}/${file.filename}`);

    const result = await createIssueReport(
      {
        ...body,
        photos: photoPaths.length ? photoPaths : body.photos,
      },
      reporterId
    );

    return res.status(201).json({
      success: true,
      message: "Issue reported successfully",
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}
