import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { HttpError } from "../../errors/httpError";
import {
  AdminUserModel,
  AuthorityUserModel,
  CitizenUserModel,
} from "../../models/userCollections.model";
import { roleFromEmail } from "../../services/roleFromEmail.service";
import type { CreateCitizenInput } from "../../dtos/admin/createCitizen.dto";
import { normalizeNepalPhone } from "./_phoneNepal";

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

export async function createCitizen(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as CreateCitizenInput;

    const email = body.email.toLowerCase();
    const derivedRole = roleFromEmail(email);
    if (derivedRole !== "citizen") {
      throw new HttpError(400, "Email cannot be an admin/authority email for citizen accounts");
    }

    if (await emailExistsAnywhere(email)) {
      throw new HttpError(409, "Email already in use");
    }

    const { phoneCountryCode, phoneNationalNumber, phoneE164 } = normalizeNepalPhone(body.phone);

    if (await phoneExistsAnywhere(phoneE164)) {
      throw new HttpError(409, "Phone already in use");
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const doc = await CitizenUserModel.create({
      fullName: body.fullName.trim(),
      email,
      phone: phoneE164,
      phoneCountryCode,
      phoneNationalNumber,
      phoneE164,
      wardNumber: body.wardNumber.trim(),
      municipality: body.municipality.trim(),

      district: body.district?.trim(),
      tole: body.tole?.trim(),
      dob: body.dob?.trim(),
      citizenshipNumber: body.citizenshipNumber?.trim(),

      passwordHash,
      role: "citizen",
      status: body.status,
    });

    return res.status(201).json({
      success: true,
      message: "Citizen account created",
      data: {
        id: doc._id.toString(),
        fullName: doc.fullName,
        email: doc.email,
        role: doc.role,
        status: (doc as any).status,
        joinedDate: doc.createdAt
          ? new Date(doc.createdAt).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
      },
    });
  } catch (err) {
    return next(err);
  }
}
