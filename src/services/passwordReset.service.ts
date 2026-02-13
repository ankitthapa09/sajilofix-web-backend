import bcrypt from "bcryptjs";
import jwt, { type Secret } from "jsonwebtoken";
import type { StringValue } from "ms";
import { HttpError } from "../errors/httpError";
import { UserRepository } from "../repositories/user.repository";
import { sendEmail } from "../config/email";
import { env } from "../config/env";
type ResetTokenPayload = {
  id: string;
};

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new HttpError(400, "Email is required");
  }

  const user = await UserRepository.findByEmailAcrossRoles(normalizedEmail);
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  const expiresIn = env.PASSWORD_RESET_EXPIRES_IN as StringValue;

  const token = jwt.sign(
    { id: user._id.toString() },
    env.JWT_SECRET as Secret,
    { expiresIn }
  );

  const resetLink = `${env.CLIENT_URL}/reset-password?token=${token}`;
  const html = `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire soon.</p>`;

  await sendEmail(user.email, "Password Reset", html);

  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };
}

export async function resetPassword(token: string, newPassword: string) {
  if (!token || !newPassword) {
    throw new HttpError(400, "Token and new password are required");
  }

  let decoded: ResetTokenPayload;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET as Secret) as ResetTokenPayload;
  } catch (error) {
    throw new HttpError(400, "Invalid or expired token");
  }

  const user = await UserRepository.findById(decoded.id);
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await UserRepository.updateById(user._id.toString(), { passwordHash: hashedPassword }, user.role);

  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };
}
