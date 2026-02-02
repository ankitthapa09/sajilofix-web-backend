import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../errors/httpError";
import { UserRepository } from "../../repositories/user.repository";

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.userId;
    const role = req.auth?.role;
    if (!userId) throw new HttpError(401, "Unauthorized");

    const user = await UserRepository.findById(userId, role as any);
    if (!user) throw new HttpError(404, "User not found");

    return res.status(200).json({
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        wardNumber: user.wardNumber,
        municipality: user.municipality,
        profilePhoto: user.profilePhoto,
        role: user.role,
      },
    });
  } catch (err) {
    return next(err);
  }
}
