import type { NextFunction, Request, Response } from "express";
import type { RegisterInput } from "../../dtos/auth/register.dto";
import { registerCitizen } from "../../services/auth.service";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as RegisterInput;
    const result = await registerCitizen(body);

    return res.status(201).json({
      success: true,
      message: "Registered successfully",
      data: result.user,
    });
  } catch (err) {
    return next(err);
  }
}
