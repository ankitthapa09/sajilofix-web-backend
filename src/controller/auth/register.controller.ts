import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { UserRepository } from "../../repositories/user.repository";
import { HttpError } from "../../errors/httpError";
import type { RegisterInput } from "../../dtos/auth/register.dto";
import { roleFromEmail } from "../../services/roleFromEmail.service";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as RegisterInput;

    // Roles are determined by email.
    // Citizens must register before login
    const role = roleFromEmail(body.email);
    if (role !== "citizen") {
      throw new HttpError(403, "Only citizens can self-register. Authority accounts are created by admin.");
    }

    const email = body.email.toLowerCase();

    const existingByEmail = await UserRepository.findByEmail(email);
    if (existingByEmail) throw new HttpError(409, "Email already in use");

    const existingByPhone = await UserRepository.findByPhone(body.phone);
    if (existingByPhone) throw new HttpError(409, "Phone already in use");

    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await UserRepository.create({
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
