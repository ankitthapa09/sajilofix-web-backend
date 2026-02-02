import fs from "fs";
import path from "path";
import { HttpError } from "../../errors/httpError";

function normalizeProfilePhotoToUploadsRelativePath(stored: string) {
  const v = (stored ?? "").trim().replace(/^\/+/, "");
  if (!v) return "";

  // Accept both formats:
  // - uploads/profile_photos/<file>
  // - /uploads/profile_photos/<file>
  // - profile_photos/<file>
  if (v.startsWith("uploads/")) return v.substring("uploads/".length);
  if (v.startsWith("/uploads/")) return v.substring("/uploads/".length);
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

export async function deleteProfilePhotoFileIfExists(profilePhoto: string | undefined) {
  const existingPhoto = (profilePhoto ?? "").trim();
  const uploadsRelative = normalizeProfilePhotoToUploadsRelativePath(existingPhoto);
  if (!uploadsRelative) return;

  // Only delete files inside uploads/profile_photos
  if (!uploadsRelative.startsWith("profile_photos/")) return;

  try {
    const absPath = safeUploadsPath(uploadsRelative);
    await fs.promises.unlink(absPath);
  } catch (err: any) {
    if (err?.code !== "ENOENT") {
      // eslint-disable-next-line no-console
      console.warn("Failed to delete profile photo file:", err);
    }
  }
}
