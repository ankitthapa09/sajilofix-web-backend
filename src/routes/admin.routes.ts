import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/requireAdmin.middleware";
import { listUsers } from "../controller/admin/listUsers.controller";

export const adminRouter = Router();

// GET /api/admin/users
adminRouter.get("/users", requireAuth, requireAdmin, listUsers);
