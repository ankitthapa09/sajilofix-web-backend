import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../errors/httpError";
import { UserRepository } from "../../repositories/user.repository";
import type { UpdateMeInput } from "../../dtos/users/updateMe.dto";

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

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.userId;
    const role = req.auth?.role;
    if (!userId) throw new HttpError(401, "Unauthorized");

    const body = req.body as UpdateMeInput;

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
      wardNumber: wardNumber,
      municipality: body.municipality?.trim(),
      district: body.district?.trim(),
      tole: body.tole?.trim(),
      dob: body.dob?.trim(),
      citizenshipNumber: body.citizenshipNumber?.trim(),
    });

    if (Object.keys(updates).length === 0) {
      return res.status(200).json({
        user: {
          id: existingUser._id.toString(),
          fullName: existingUser.fullName,
          email: existingUser.email,
          phone: existingUser.phone,
          phoneCountryCode: existingUser.phoneCountryCode,
          phoneNationalNumber: existingUser.phoneNationalNumber,
          wardNumber: existingUser.wardNumber,
          municipality: existingUser.municipality,
          district: existingUser.district,
          tole: existingUser.tole,
          dob: existingUser.dob,
          citizenshipNumber: existingUser.citizenshipNumber,
          profilePhoto: existingUser.profilePhoto,
          role: existingUser.role,
        },
      });
    }

    const user = await UserRepository.updateById(userId, updates as any, role as any);
    if (!user) throw new HttpError(404, "User not found");

    return res.status(200).json({
      user: {
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
      },
    });
  } catch (err) {
    return next(err);
  }
}
