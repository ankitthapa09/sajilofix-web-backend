import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { UserRepository } from "../../repositories/user.repository";
import { HttpError } from "../../errors/httpError";
import type { RegisterInput } from "../../dtos/auth/register.dto";
import { roleFromEmail } from "../../services/roleFromEmail.service";

function normalizeNepalPhone(body: RegisterInput) {
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

    const existingByEmail = await UserRepository.findByEmail(email, role);
    if (existingByEmail) throw new HttpError(409, "Email already in use");

    const { phoneCountryCode, phoneNationalNumber, phoneE164 } = normalizeNepalPhone(body);

    const existingByPhone = await UserRepository.findByPhone(phoneE164);
    if (existingByPhone) throw new HttpError(409, "Phone already in use");

    const passwordHash = await bcrypt.hash(body.password, 10);

    const wardNumber = (body.wardNumber ?? body.ward ?? "").trim();
    if (!wardNumber) throw new HttpError(400, "Ward number is required");

    const user = await UserRepository.create({
      fullName: body.fullName,
      email,
      phone: phoneE164,
      phoneCountryCode,
      phoneNationalNumber,
      phoneE164,
      wardNumber,
      municipality: body.municipality,
      district: body.district,
      tole: body.tole,
      dob: body.dob,
      citizenshipNumber: body.citizenshipNumber,
      passwordHash,
    }, role);

    return res.status(201).json({
      success: true,
      message: "Registered successfully",
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
