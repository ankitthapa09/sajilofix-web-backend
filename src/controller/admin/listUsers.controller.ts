import type { NextFunction, Request, Response } from "express";
import { listAdminUsers } from "../../services/adminUser.service";

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const rawPage = Number.parseInt(req.query.page as string, 10);
    const rawLimit = Number.parseInt(req.query.limit as string, 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 10;

    const result = await listAdminUsers({
      page,
      limit,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      role: typeof req.query.role === "string" ? req.query.role : undefined,
      tab: typeof req.query.tab === "string" ? req.query.tab : undefined,
      status: typeof req.query.status === "string" ? req.query.status : undefined,
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (err) {
    return next(err);
  }
}
