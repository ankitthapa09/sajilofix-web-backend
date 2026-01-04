import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { UserModel } from "../../models/user.model";
import { HttpError } from "../../errors/httpError";
import type { RegisterInput } from "../../dtos/auth/register.dto";
import { roleFromEmail } from "../../services/roleFromEmail.service";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as RegisterInput;

    // Roles are determined by email. Self-register must be citizen.
    const role = roleFromEmail(body.email);
    if (role !== "citizen") {
      throw new HttpError(403, "Only citizens can self-register. Authority accounts are created by admin.");
    }

    const email = body.email.toLowerCase();

    const existingByEmail = await UserModel.findOne({ email }).lean();
    if (existingByEmail) throw new HttpError(409, "Email already in use");

    const existingByPhone = await UserModel.findOne({ phone: body.phone }).lean();
    if (existingByPhone) throw new HttpError(409, "Phone already in use");

    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await UserModel.create({
      fullName: body.fullName,
      email,
      phone: body.phone,
      wardNumber: body.wardNumber,
      municipality: body.municipality,
      passwordHash,
      role,
    });

    return res.status(201).json({
      message: "Registered successfully",
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        wardNumber: user.wardNumber,
        municipality: user.municipality,
        role: user.role,
      },
    });
  } catch (err) {
    return next(err);
  }
}
