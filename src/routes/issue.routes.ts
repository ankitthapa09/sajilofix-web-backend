import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { issuePhotoUpload } from "../middleware/upload.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { createIssueSchema } from "../dtos/issues/createIssue.dto";
import { createIssue } from "../controller/issues/createIssue.controller";

export const issueRouter = Router();

// POST /api/issues
issueRouter.post(
	"/",
	requireAuth,
	issuePhotoUpload.array("photos", 3),
	validateBody(createIssueSchema),
	createIssue
);
