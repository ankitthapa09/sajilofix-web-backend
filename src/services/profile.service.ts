import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { HttpError } from "../errors/httpError";
import { UserRepository } from "../repositories/user.repository";
import { PROFILE_PHOTO_RELATIVE_DIR } from "../middleware/upload.middleware";
import type { UpdateMeInput } from "../dtos/users/updateMe.dto";
import type { ProfilePayload } from "../types/profile.types";

function normalizeNepalPhone(body: UpdateMeInput) {
  if (body.phoneCountryCode && body.phoneNationalNumber) {
    if (body.phoneCountryCode !== "+977") {
      throw new HttpError(400, "Country code must be +977");
    }
    if (!/^\d{10}$/.test(body.phoneNationalNumber)) {
      throw new HttpError(400, "Phone number must be exactly 10 digits");
    }

    const phoneE164 = `${body.phoneCountryCode}${body.phoneNationalNumber}`;
    return {
      phoneCountryCode: body.phoneCountryCode,
      phoneNationalNumber: body.phoneNationalNumber,
      phoneE164,
    };
  }

  const raw = body.phone?.trim() ?? "";
  if (!raw) return null;

  if (/^\d{10}$/.test(raw)) {
    return {
      phoneCountryCode: "+977",
      phoneNationalNumber: raw,
      phoneE164: `+977${raw}`,
    };
  }

  if (/^\+977\d{10}$/.test(raw)) {
    return {
      phoneCountryCode: "+977",
      phoneNationalNumber: raw.slice(4),
      phoneE164: raw,
    };
  }

  throw new HttpError(400, "Phone number must be 10 digits or +977 followed by 10 digits");
}

function pickDefined<T extends Record<string, unknown>>(obj: T) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function toProfilePayload(user: any, includeStatus = false): ProfilePayload {
  return {
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
    profilePhoto: user.profilePhoto,
    role: user.role,
    status: includeStatus ? user.status : undefined,
  };
}

function normalizeProfilePhotoToUploadsRelativePath(stored: string) {
  const v = (stored ?? "").trim().replace(/^\/+/, "");
  if (!v) return "";
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

export async function getMyProfile(userId: string, role?: string): Promise<ProfilePayload> {
  if (!userId) throw new HttpError(401, "Unauthorized");
  const user = await UserRepository.findById(userId, role as any);
  if (!user) throw new HttpError(404, "User not found");
  return toProfilePayload(user, true);
}

export async function updateMyProfile(userId: string, role: string | undefined, body: UpdateMeInput): Promise<ProfilePayload> {
  if (!userId) throw new HttpError(401, "Unauthorized");

  const existingUser = await UserRepository.findById(userId, role as any);
  if (!existingUser) throw new HttpError(404, "User not found");

  const wardNumber = (body.wardNumber ?? body.ward)?.trim();
  const phoneParts = normalizeNepalPhone(body);

  if (phoneParts) {
    const existingByPhone = await UserRepository.findByPhone(phoneParts.phoneE164);
    if (existingByPhone && existingByPhone._id.toString() !== userId) {
      throw new HttpError(409, "Phone already in use");
    }
  }

  const updates = pickDefined({
    fullName: body.fullName?.trim(),
    phone: phoneParts?.phoneE164,
    phoneCountryCode: phoneParts?.phoneCountryCode,
    phoneNationalNumber: phoneParts?.phoneNationalNumber,
    phoneE164: phoneParts?.phoneE164,
    wardNumber,
    municipality: body.municipality?.trim(),
    district: body.district?.trim(),
    tole: body.tole?.trim(),
    dob: body.dob?.trim(),
    citizenshipNumber: body.citizenshipNumber?.trim(),
  });

  if (Object.keys(updates).length === 0) {
    return toProfilePayload(existingUser);
  }

  const user = await UserRepository.updateById(userId, updates as any, role as any);
  if (!user) throw new HttpError(404, "User not found");

  return toProfilePayload(user);
}

export async function updateMyProfilePhoto(
  userId: string,
  role: string | undefined,
  file: Express.Multer.File | undefined,
): Promise<ProfilePayload> {
  if (!userId) throw new HttpError(401, "Unauthorized");
  if (!file) throw new HttpError(400, "Missing file field 'photo'");

  const profilePhoto = `/uploads/${PROFILE_PHOTO_RELATIVE_DIR}/${file.filename}`;
  const user = await UserRepository.setProfilePhoto(userId, profilePhoto, role as any);
  if (!user) throw new HttpError(404, "User not found");

  return toProfilePayload(user);
}

export async function deleteMyProfilePhoto(userId: string, role: string | undefined): Promise<ProfilePayload> {
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
        console.warn("Failed to delete profile photo file:", err);
      }
    }
  }

  const user = await UserRepository.clearProfilePhoto(userId, role as any);
  if (!user) throw new HttpError(404, "User not found");

  return toProfilePayload(user);
}

export async function changeMyPassword(
  userId: string,
  role: string | undefined,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  if (!userId) throw new HttpError(401, "Unauthorized");

  const user = await UserRepository.findById(userId, role as any);
  if (!user) throw new HttpError(404, "User not found");

  const currentOk = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!currentOk) {
    throw new HttpError(400, "Current password is incorrect");
  }

  const nextHash = await bcrypt.hash(newPassword, 10);
  await UserRepository.updateById(userId, { passwordHash: nextHash } as any, role as any);
}
