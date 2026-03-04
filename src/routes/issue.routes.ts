import { Router, type NextFunction, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { issuePhotoUpload } from "../middleware/upload.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { createIssueSchema } from "../dtos/issues/createIssue.dto";
import { createIssue } from "../controller/issues/createIssue.controller";
import { getIssue } from "../controller/issues/getIssue.controller";
import { listIssues } from "../controller/issues/listIssues.controller";
import { listPriorityIssues } from "../controller/issues/listPriorityIssues.controller";
import { reverseGeocode } from "../controller/issues/reverseGeocode.controller";
import { updateIssueStatusController } from "../controller/issues/updateIssueStatus.controller";
import { updateIssueStatusSchema } from "../dtos/issues/updateIssueStatus.dto";

export const issueRouter = Router();

function normalizeCreateIssueBody(req: Request) {
	const body = req.body as Record<string, unknown>;

	const pick = (key: string) => {
		const direct = body[key];
		if (direct !== undefined) return direct;
		const dot = body[`location.${key}`];
		if (dot !== undefined) return dot;
		const bracket = body[`location[${key}]`];
		if (bracket !== undefined) return bracket;
		return undefined;
	};

	const toString = (value: unknown) => {
		if (Array.isArray(value)) return String(value[0] ?? "");
		if (value === undefined || value === null) return "";
		return String(value);
	};

	const toNumber = (value: unknown) => {
		const raw = toString(value).trim();
		if (!raw) return undefined;
		const num = Number(raw);
		return Number.isFinite(num) ? num : undefined;
	};

	const locationRaw = body.location;
	let locationObj: Record<string, unknown> | undefined;

	if (typeof locationRaw === "string") {
		try {
			locationObj = JSON.parse(locationRaw) as Record<string, unknown>;
		} catch {
			locationObj = undefined;
		}
	} else if (locationRaw && typeof locationRaw === "object") {
		locationObj = locationRaw as Record<string, unknown>;
	}

	const landmarkRaw = toString(locationObj?.landmark ?? pick("landmark")).trim();
	const location = {
		latitude: toNumber(locationObj?.latitude ?? pick("latitude")),
		longitude: toNumber(locationObj?.longitude ?? pick("longitude")),
		address: toString(locationObj?.address ?? pick("address")),
		district: toString(locationObj?.district ?? pick("district")),
		municipality: toString(locationObj?.municipality ?? pick("municipality")),
		ward: toString(locationObj?.ward ?? pick("ward")),
		landmark: landmarkRaw ? landmarkRaw : undefined,
	};

	body.location = location;
	req.body = body;
}

function normalizeIssueBodyMiddleware(req: Request, _res: Response, next: NextFunction) {
	normalizeCreateIssueBody(req);
	next();
}

// POST /api/issues
issueRouter.post(
	"/",
	requireAuth,
	issuePhotoUpload.array("photos", 3),
	normalizeIssueBodyMiddleware,
	validateBody(createIssueSchema),
	createIssue
);

// GET /api/issues
issueRouter.get("/", requireAuth, listIssues);

// GET /api/issues/priority
issueRouter.get("/priority", requireAuth, listPriorityIssues);

// GET /api/issues/reverse-geocode?lat=..&lng=..
issueRouter.get("/reverse-geocode", requireAuth, reverseGeocode);

// GET /api/issues/:id
issueRouter.get("/:id", requireAuth, getIssue);

// PATCH /api/issues/:id/status
issueRouter.patch(
	"/:id/status",
	requireAuth,
	validateBody(updateIssueStatusSchema),
	updateIssueStatusController
);
