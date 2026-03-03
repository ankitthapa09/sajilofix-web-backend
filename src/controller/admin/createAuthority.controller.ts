import type { NextFunction, Request, Response } from "express";
import { createAuthorityAccount } from "../../services/adminUser.service";
import type { CreateAuthorityInput } from "../../dtos/admin/createAuthority.dto";

export async function createAuthority(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as CreateAuthorityInput;
    const doc = await createAuthorityAccount(body);

    return res.status(201).json({
      success: true,
      message: "Authority account created",
      data: doc,
    });
  } catch (err) {
    return next(err);
  }
}
