import type { NextFunction, Request, Response } from "express";
import type { LoginInput } from "../../dtos/auth/login.dto";
import { loginUser } from "../../services/auth.service";

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as LoginInput;
    const result = await loginUser(body);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: result.token,
      data: {
        ...result.user,
      },
    });
  } catch (err) {
    return next(err);
  }
}
