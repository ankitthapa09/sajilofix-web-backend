import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { type Secret } from "jsonwebtoken";
import { UserRepository } from "../../repositories/user.repository";
import { HttpError } from "../../errors/httpError";
import type { LoginInput } from "../../dtos/auth/login.dto";
import { roleFromEmail } from "../../services/roleFromEmail.service";
import { env } from "../../config/env";

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as LoginInput;

    const email = body.email.toLowerCase();
    const user = await UserRepository.findByEmail(email);

    if (!user) throw new HttpError(401, "Invalid email or password");

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new HttpError(401, "Invalid email or password");

    
    const derivedRole = roleFromEmail(email);
    if (user.role !== derivedRole) {
      throw new HttpError(403, "Unauthorized: role does not match email rules");
    }

    const token = jwt.sign(
      { sub: user._id.toString(), role: user.role },
      env.JWT_SECRET as unknown as Secret,
      { expiresIn: env.JWT_EXPIRES_IN as unknown as jwt.SignOptions["expiresIn"] }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        phoneCountryCode: user.phoneCountryCode,
        phoneNationalNumber: user.phoneNationalNumber,
        wardNumber: user.wardNumber,
        municipality: user.municipality,
        district: user.district,
        tole: user.tole,
        dob: user.dob,
        citizenshipNumber: user.citizenshipNumber,
        role: user.role,
      },
    });
  } catch (err) {
    return next(err);
  }
}
