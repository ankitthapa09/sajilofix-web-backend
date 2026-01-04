import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { type Secret } from "jsonwebtoken";
import { UserModel } from "../../models/user.model";
import { HttpError } from "../../errors/httpError";
import type { LoginInput } from "../../dtos/auth/login.dto";

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as LoginInput;

    const email = body.email.toLowerCase();
    const user = await UserModel.findOne({ email });

    if (!user) throw new HttpError(401, "Invalid email or password");

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new HttpError(401, "Invalid email or password");

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new HttpError(500, "JWT_SECRET is not configured");

    const token = jwt.sign(
      { sub: user._id.toString(), role: user.role },
      secret as Secret,
      { expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as unknown as jwt.SignOptions["expiresIn"] }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return next(err);
  }
}
