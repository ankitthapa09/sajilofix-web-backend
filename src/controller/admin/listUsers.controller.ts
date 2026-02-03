import type { NextFunction, Request, Response } from "express";
import { AdminUserModel, AuthorityUserModel, CitizenUserModel } from "../../models/userCollections.model";

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
  };
}

export async function listUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const [admins, authorities, citizens] = await Promise.all([
      AdminUserModel.find({}, { passwordHash: 0 }).sort({ createdAt: -1 }).lean().exec(),
      AuthorityUserModel.find({}, { passwordHash: 0 }).sort({ createdAt: -1 }).lean().exec(),
      CitizenUserModel.find({}, { passwordHash: 0 }).sort({ createdAt: -1 }).lean().exec(),
    ]);

    const rows = [
      ...admins.map((u) => toRow("admin", u)),
      ...authorities.map((u) => toRow("authority", u)),
      ...citizens.map((u) => toRow("citizen", u)),
    ];

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (err) {
    return next(err);
  }
}
