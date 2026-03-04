import type { NextFunction, Request, Response } from "express";
import { updateMyProfilePhoto } from "../../services/profile.service";

export async function updateMePhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.userId;
    const role = req.auth?.role;
    const user = await updateMyProfilePhoto(userId ?? "", role, req.file);

    return res.status(200).json({
      user: {
        ...user,
      },
    });
  } catch (err) {
    return next(err);
  }
}
