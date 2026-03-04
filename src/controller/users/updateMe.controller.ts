import type { NextFunction, Request, Response } from "express";
import type { UpdateMeInput } from "../../dtos/users/updateMe.dto";
import { updateMyProfile } from "../../services/profile.service";

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.userId;
    const role = req.auth?.role;
    const body = req.body as UpdateMeInput;
    const user = await updateMyProfile(userId ?? "", role, body);

    return res.status(200).json({
      user: {
        ...user,
      },
    });
  } catch (err) {
    return next(err);
  }
}
