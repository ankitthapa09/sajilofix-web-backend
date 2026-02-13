import type { NextFunction, Request, Response } from "express";
import { AdminUserModel, AuthorityUserModel, CitizenUserModel } from "../../models/userCollections.model";

type UserRole = "admin" | "authority" | "citizen";

function toRow(role: "admin" | "authority" | "citizen", doc: any) {
  const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
  return {
    id: doc._id.toString(),
    fullName: doc.fullName,
    email: doc.email,
    role,
    profilePhoto:
      typeof doc.profilePhoto === "string" && doc.profilePhoto.trim()
        ? doc.profilePhoto.trim()
        : undefined,
    department: typeof doc.department === "string" && doc.department.trim() ? doc.department : "—",
    status: doc.status === "suspended" ? ("suspended" as const) : ("active" as const),
    joinedDate: createdAt.toISOString().slice(0, 10),
    lastActive: "—",
    activity: "—",
    _createdAtSort: createdAt.getTime(),
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveRoles(role?: string, tab?: string): UserRole[] {
  const all: UserRole[] = ["admin", "authority", "citizen"];
  let roles = all;

  if (tab === "citizens") roles = roles.filter((r) => r === "citizen");
  if (tab === "authorities") roles = roles.filter((r) => r === "authority");

  if (role === "admin" || role === "authority" || role === "citizen") {
    roles = roles.filter((r) => r === role);
  }

  return roles;
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const rawPage = Number.parseInt(req.query.page as string, 10);
    const rawLimit = Number.parseInt(req.query.limit as string, 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 10;
    const skip = (page - 1) * limit;

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const role = typeof req.query.role === "string" ? req.query.role.trim().toLowerCase() : "";
    const tab = typeof req.query.tab === "string" ? req.query.tab.trim().toLowerCase() : "";
    const status = typeof req.query.status === "string" ? req.query.status.trim().toLowerCase() : "";

    const allowedRoles = resolveRoles(role, tab);

    const filter: Record<string, unknown> = {};
    if (status === "active" || status === "suspended") {
      filter.status = status;
    }
    if (search) {
      const regex = new RegExp(escapeRegExp(search), "i");
      filter.$or = [{ fullName: regex }, { email: regex }];
    }

    if (allowedRoles.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 1,
        },
      });
    }

    const roleModels = [
      { role: "admin" as const, model: AdminUserModel },
      { role: "authority" as const, model: AuthorityUserModel },
      { role: "citizen" as const, model: CitizenUserModel },
    ].filter((entry) => allowedRoles.includes(entry.role));

    const [docsByRole, counts] = await Promise.all([
      Promise.all(
        roleModels.map((entry) =>
          entry.model.find(filter, { passwordHash: 0 }).sort({ createdAt: -1 }).lean().exec()
        )
      ),
      Promise.all(roleModels.map((entry) => entry.model.countDocuments(filter).exec())),
    ]);

    const rows = docsByRole
      .flatMap((docs, index) => docs.map((doc) => toRow(roleModels[index].role, doc)))
      .sort((a, b) => b._createdAtSort - a._createdAtSort)
      .slice(skip, skip + limit)
      .map(({ _createdAtSort, ...row }) => row);

    const total = counts.reduce((sum, value) => sum + value, 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      success: true,
      data: rows,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (err) {
    return next(err);
  }
}
