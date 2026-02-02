import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/requireAdmin.middleware";
import { listUsers } from "../controller/admin/listUsers.controller";
import { validateBody } from "../middleware/validate.middleware";
import { createAuthoritySchema } from "../dtos/admin/createAuthority.dto";
import { createAuthority } from "../controller/admin/createAuthority.controller";
import { createCitizenSchema } from "../dtos/admin/createCitizen.dto";
import { createCitizen } from "../controller/admin/createCitizen.controller";
import {
	deleteAuthorityById,
	getAuthorityById,
	updateAuthorityById,
} from "../controller/admin/authorityCrud.controller";
import {
	deleteCitizenById,
	getCitizenById,
	updateCitizenById,
} from "../controller/admin/citizenCrud.controller";
import { updateAuthoritySchema } from "../dtos/admin/updateAuthority.dto";
import { updateCitizenSchema } from "../dtos/admin/updateCitizen.dto";

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

// POST /api/admin/citizens
adminRouter.post(
	"/citizens",
	requireAuth,
	requireAdmin,
	validateBody(createCitizenSchema),
	createCitizen
);

// GET /api/admin/authorities/:id
adminRouter.get("/authorities/:id", requireAuth, requireAdmin, getAuthorityById);

// PATCH /api/admin/authorities/:id
adminRouter.patch(
	"/authorities/:id",
	requireAuth,
	requireAdmin,
	validateBody(updateAuthoritySchema),
	updateAuthorityById
);

// DELETE /api/admin/authorities/:id
adminRouter.delete("/authorities/:id", requireAuth, requireAdmin, deleteAuthorityById);

// GET /api/admin/citizens/:id
adminRouter.get("/citizens/:id", requireAuth, requireAdmin, getCitizenById);

// PATCH /api/admin/citizens/:id
adminRouter.patch(
	"/citizens/:id",
	requireAuth,
	requireAdmin,
	validateBody(updateCitizenSchema),
	updateCitizenById
);

// DELETE /api/admin/citizens/:id
adminRouter.delete("/citizens/:id", requireAuth, requireAdmin, deleteCitizenById);
