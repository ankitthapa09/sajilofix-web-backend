import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/requireAdmin.middleware";
import { listUsers } from "../controller/admin/listUsers.controller";
import { validateBody } from "../middleware/validate.middleware";
import { createAuthoritySchema } from "../dtos/admin/createAuthority.dto";
import { createAuthority } from "../controller/admin/createAuthority.controller";

export const adminRouter = Router();

// GET /api/admin/users
adminRouter.get("/users", requireAuth, requireAdmin, listUsers);

// POST /api/admin/authorities
adminRouter.post(
	"/authorities",
	requireAuth,
	requireAdmin,
	validateBody(createAuthoritySchema),
	createAuthority
);
