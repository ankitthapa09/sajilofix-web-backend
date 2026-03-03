import type { NextFunction, Request, Response } from "express";
import { deleteMyProfilePhoto } from "../../services/profile.service";

export async function deleteMePhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.userId;
    const role = req.auth?.role;
    const user = await deleteMyProfilePhoto(userId ?? "", role);

    return res.status(200).json({
      user: {
        ...user,
      },
    });
  } catch (err) {
    return next(err);
  }
}
