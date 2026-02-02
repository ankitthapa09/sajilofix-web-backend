import type { NextFunction, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { HttpError } from "../../errors/httpError";
import { UserRepository } from "../../repositories/user.repository";
import { PROFILE_PHOTO_RELATIVE_DIR } from "../../middleware/upload.middleware";

function normalizeProfilePhotoToUploadsRelativePath(stored: string) {
  const v = (stored ?? "").trim().replace(/^\/+/, "");
  if (!v) return "";

  // Accept both formats:
  // - profile_photos/<file>
  // - uploads/profile_photos/<file>
  if (v.startsWith("uploads/")) {
    return v.substring("uploads/".length);
  }
  return v;
}

function safeUploadsPath(relativePath: string) {
  const uploadsRoot = path.join(process.cwd(), "uploads");
  const abs = path.join(uploadsRoot, relativePath);
  const normalizedUploadsRoot = path.normalize(uploadsRoot + path.sep);
  const normalizedAbs = path.normalize(abs);

  if (!normalizedAbs.startsWith(normalizedUploadsRoot)) {
    throw new HttpError(400, "Invalid profile photo path");
  }

  return normalizedAbs;
}

export async function deleteMePhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.userId;
    const role = req.auth?.role;
    if (!userId) throw new HttpError(401, "Unauthorized");

    const existingUser = await UserRepository.findById(userId, role as any);
    if (!existingUser) throw new HttpError(404, "User not found");

    const existingPhoto = (existingUser.profilePhoto ?? "").trim();
    const uploadsRelative = normalizeProfilePhotoToUploadsRelativePath(existingPhoto);

    if (uploadsRelative && uploadsRelative.startsWith(`${PROFILE_PHOTO_RELATIVE_DIR}/`)) {
      try {
        const absPath = safeUploadsPath(uploadsRelative);
        await fs.promises.unlink(absPath);
      } catch (err: any) {
        if (err?.code !== "ENOENT") {
          // Best-effort delete; ignore file errors other than missing file.
          // eslint-disable-next-line no-console
          console.warn("Failed to delete profile photo file:", err);
        }
      }
    }

    const user = await UserRepository.clearProfilePhoto(userId, role as any);
    if (!user) throw new HttpError(404, "User not found");

    return res.status(200).json({
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        wardNumber: user.wardNumber,
        municipality: user.municipality,
        profilePhoto: user.profilePhoto,
        role: user.role,
      },
    });
  } catch (err) {
    return next(err);
  }
}
