import type { NextFunction, Request, Response } from "express";
import { createCitizenAccount } from "../../services/adminUser.service";
import type { CreateCitizenInput } from "../../dtos/admin/createCitizen.dto";

export async function createCitizen(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as CreateCitizenInput;
    const doc = await createCitizenAccount(body);

    return res.status(201).json({
      success: true,
      message: "Citizen account created",
      data: doc,
    });
  } catch (err) {
    return next(err);
  }
}
