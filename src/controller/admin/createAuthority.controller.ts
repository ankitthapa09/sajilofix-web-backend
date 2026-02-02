import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { HttpError } from "../../errors/httpError";
import {
  AdminUserModel,
  AuthorityUserModel,
  CitizenUserModel,
} from "../../models/userCollections.model";
import { roleFromEmail } from "../../services/roleFromEmail.service";
import type { CreateAuthorityInput } from "../../dtos/admin/createAuthority.dto";

function normalizeNepalPhone(phoneRaw: string) {
  const raw = phoneRaw.trim();

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

async function emailExistsAnywhere(email: string) {
  const [a, b, c] = await Promise.all([
    AdminUserModel.findOne({ email }).lean().exec(),
    AuthorityUserModel.findOne({ email }).lean().exec(),
    CitizenUserModel.findOne({ email }).lean().exec(),
  ]);
  return Boolean(a || b || c);
}

async function phoneExistsAnywhere(phoneE164: string) {
  const query = { $or: [{ phoneE164 }, { phone: phoneE164 }] };
  const [a, b, c] = await Promise.all([
    AdminUserModel.findOne(query).lean().exec(),
    AuthorityUserModel.findOne(query).lean().exec(),
    CitizenUserModel.findOne(query).lean().exec(),
  ]);
  return Boolean(a || b || c);
}

export async function createAuthority(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as CreateAuthorityInput;

    const email = body.email.toLowerCase();
    const derivedRole = roleFromEmail(email);
    if (derivedRole !== "authority") {
      throw new HttpError(
        400,
        "Email does not match authority rules. Use an authority domain email (e.g. *@sajilofix.gov.np).",
      );
    }

    if (await emailExistsAnywhere(email)) {
      throw new HttpError(409, "Email already in use");
    }

    const { phoneCountryCode, phoneNationalNumber, phoneE164 } = normalizeNepalPhone(body.phone);

    if (await phoneExistsAnywhere(phoneE164)) {
      throw new HttpError(409, "Phone already in use");
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const doc = await AuthorityUserModel.create({
      fullName: body.fullName.trim(),
      email,
      phone: phoneE164,
      phoneCountryCode,
      phoneNationalNumber,
      phoneE164,
      wardNumber: body.wardNumber.trim(),
      municipality: body.municipality.trim(),
      passwordHash,
      role: "authority",
      department: body.department.trim(),
      status: body.status,
    });

    return res.status(201).json({
      success: true,
      message: "Authority account created",
      data: {
        id: doc._id.toString(),
        fullName: doc.fullName,
        email: doc.email,
        role: doc.role,
        department: (doc as any).department,
        status: (doc as any).status,
        joinedDate: doc.createdAt ? new Date(doc.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      },
    });
  } catch (err) {
    return next(err);
  }
}
