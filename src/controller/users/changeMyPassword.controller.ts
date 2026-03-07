import type { NextFunction, Request, Response } from "express";
import type { ChangeMyPasswordInput } from "../../dtos/users/changeMyPassword.dto";
import { changeMyPassword } from "../../services/profile.service";

export async function changeMyPasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.userId;
    const role = req.auth?.role;
    const body = req.body as ChangeMyPasswordInput;

    await changeMyPassword(userId ?? "", role, body.currentPassword, body.newPassword);

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    return next(err);
  }
}
