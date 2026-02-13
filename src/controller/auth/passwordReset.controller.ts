import type { NextFunction, Request, Response } from "express";
import type {
  RequestPasswordResetInput,
  ResetPasswordBodyInput,
} from "../../dtos/auth/passwordReset.dto";
import { requestPasswordReset, resetPassword } from "../../services/passwordReset.service";

export async function sendPasswordResetLink(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as RequestPasswordResetInput;
    await requestPasswordReset(body.email);

    return res.status(200).json({
      success: true,
      message: "If the email is registered, a reset link has been sent.",
    });
  } catch (error) {
    return next(error);
  }
}

export async function handlePasswordReset(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.params;
    const body = req.body as ResetPasswordBodyInput;

    await resetPassword(token, body.newPassword);

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    return next(error);
  }
}
