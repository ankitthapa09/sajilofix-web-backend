import type { NextFunction, Request, Response } from "express";
import { getMyProfile } from "../../services/profile.service";

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.userId;
    const role = req.auth?.role;
    const user = await getMyProfile(userId ?? "", role);

    return res.status(200).json({
      user: {
        ...user,
      },
    });
  } catch (err) {
    return next(err);
  }
}
