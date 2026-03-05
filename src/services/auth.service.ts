import bcrypt from "bcryptjs";
import jwt, { type Secret } from "jsonwebtoken";
import { UserRepository } from "../repositories/user.repository";
import { HttpError } from "../errors/httpError";
import type { LoginInput } from "../dtos/auth/login.dto";
import type { RegisterInput } from "../dtos/auth/register.dto";
import { roleFromEmail } from "./roleFromEmail.service";
import { env } from "../config/env";
import type { LoginResult, RegisterResult } from "../types/auth.types";
import { createNotifications } from "./notification.service";

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

function toAuthPayload(user: any) {
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
    tole: user.tole ?? undefined,
    dob: user.dob ?? undefined,
    citizenshipNumber: user.citizenshipNumber ?? undefined,
    profilePhoto: user.profilePhoto,
    role: user.role,
  };
}

export async function loginUser(body: LoginInput): Promise<LoginResult> {
  const email = body.email.toLowerCase();
  const derivedRole = roleFromEmail(email);
  const user = await UserRepository.findByEmail(email, derivedRole);

  if (!user) throw new HttpError(401, "Invalid email or password");

  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) throw new HttpError(401, "Invalid email or password");

  if (user.role !== derivedRole) {
    throw new HttpError(403, "Unauthorized: role does not match email rules");
  }

  const token = jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.JWT_SECRET as unknown as Secret,
    { expiresIn: env.JWT_EXPIRES_IN as unknown as jwt.SignOptions["expiresIn"] }
  );

  return {
    token,
    user: toAuthPayload(user),
  };
}

export async function registerCitizen(body: RegisterInput): Promise<RegisterResult> {
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

  const user = await UserRepository.create(
    {
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
    },
    role,
  );

  try {
    const admins = await UserRepository.listActiveUserIdsByRoles(["admin"]);
    if (admins.length) {
      await createNotifications(
        admins.map((admin) => ({
          recipientUserId: admin.userId,
          recipientRole: "admin",
          type: "system",
          title: "New user registration",
          message: `${user.fullName} has registered as a citizen user.`,
          entityType: "system",
          metadata: {
            role: user.role,
            email: user.email,
            userId: user._id.toString(),
          },
        }))
      );
    }
  } catch (error) {
    console.error("Failed to create new registration notification", error);
  }

  return {
    user: {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      phoneCountryCode: user.phoneCountryCode,
      phoneNationalNumber: user.phoneNationalNumber,
      wardNumber: user.wardNumber,
      municipality: user.municipality,
      district: user.district ?? undefined,
      tole: user.tole ?? undefined,
      dob: user.dob ?? undefined,
      citizenshipNumber: user.citizenshipNumber ?? undefined,
      role: user.role,
    },
  };
}
