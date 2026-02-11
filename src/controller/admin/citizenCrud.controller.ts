import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { HttpError } from "../../errors/httpError";
import { AdminUserModel, AuthorityUserModel, CitizenUserModel } from "../../models/userCollections.model";
import { roleFromEmail } from "../../services/roleFromEmail.service";
import type { UpdateCitizenInput } from "../../dtos/admin/updateCitizen.dto";
import { deleteProfilePhotoFileIfExists } from "./_profilePhotoFs";
import { normalizeNepalPhone } from "./_phoneNepal";

async function emailExistsOutsideCitizen(email: string, excludeId: string) {
  const [inCitizen, inAdmin, inAuthority] = await Promise.all([
    CitizenUserModel.findOne({ email, _id: { $ne: excludeId } }).lean().exec(),
    AdminUserModel.findOne({ email }).lean().exec(),
    AuthorityUserModel.findOne({ email }).lean().exec(),
  ]);
  return Boolean(inCitizen || inAdmin || inAuthority);
}

async function phoneExistsOutsideCitizen(phoneE164: string, excludeId: string) {
  const queryAny = { $or: [{ phoneE164 }, { phone: phoneE164 }] };
  const [inCitizen, inAdmin, inAuthority] = await Promise.all([
    CitizenUserModel.findOne({ ...queryAny, _id: { $ne: excludeId } }).lean().exec(),
    AdminUserModel.findOne(queryAny).lean().exec(),
    AuthorityUserModel.findOne(queryAny).lean().exec(),
  ]);
  return Boolean(inCitizen || inAdmin || inAuthority);
}

export async function getCitizenById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const user = await CitizenUserModel.findById(id, { passwordHash: 0 }).lean().exec();
    if (!user) throw new HttpError(404, "Citizen not found");

    return res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        wardNumber: user.wardNumber,
        municipality: user.municipality,
        district: (user as any).district,
        tole: (user as any).tole,
        dob: (user as any).dob,
        citizenshipNumber: (user as any).citizenshipNumber,
        status: (user as any).status,
        profilePhoto: (user as any).profilePhoto,
        role: "citizen",
        createdAt: (user as any).createdAt,
        updatedAt: (user as any).updatedAt,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function updateCitizenById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const body = req.body as UpdateCitizenInput;

    const existing = await CitizenUserModel.findById(id).exec();
    if (!existing) throw new HttpError(404, "Citizen not found");

    const update: Record<string, any> = {};

    if (body.fullName !== undefined) update.fullName = body.fullName.trim();
    if (body.wardNumber !== undefined) update.wardNumber = body.wardNumber.trim();
    if (body.municipality !== undefined) update.municipality = body.municipality.trim();
    if (body.district !== undefined) update.district = body.district.trim();
    if (body.tole !== undefined) update.tole = body.tole.trim();
    if (body.dob !== undefined) update.dob = body.dob.trim();
    if (body.citizenshipNumber !== undefined) update.citizenshipNumber = body.citizenshipNumber.trim();
    if (body.status !== undefined) update.status = body.status;

    if (body.email !== undefined) {
      const email = body.email.toLowerCase();
      const derivedRole = roleFromEmail(email);
      if (derivedRole !== "citizen") {
        throw new HttpError(400, "Email cannot be an admin/authority email for citizen accounts");
      }
      if (await emailExistsOutsideCitizen(email, id)) {
        throw new HttpError(409, "Email already in use");
      }
      update.email = email;
    }

    if (body.phone !== undefined) {
      const { phoneCountryCode, phoneNationalNumber, phoneE164 } = normalizeNepalPhone(body.phone);
      if (await phoneExistsOutsideCitizen(phoneE164, id)) {
        throw new HttpError(409, "Phone already in use");
      }
      update.phoneCountryCode = phoneCountryCode;
      update.phoneNationalNumber = phoneNationalNumber;
      update.phoneE164 = phoneE164;
      update.phone = phoneE164;
    }

    if (body.password !== undefined) {
      update.passwordHash = await bcrypt.hash(body.password, 10);
    }

    const user = await CitizenUserModel.findByIdAndUpdate(id, { $set: update }, { new: true })
      .select({ passwordHash: 0 })
      .lean()
      .exec();

    if (!user) throw new HttpError(404, "Citizen not found");

    return res.status(200).json({
      success: true,
      message: "Citizen updated",
      data: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        wardNumber: user.wardNumber,
        municipality: user.municipality,
        district: (user as any).district,
        tole: (user as any).tole,
        dob: (user as any).dob,
        citizenshipNumber: (user as any).citizenshipNumber,
        status: (user as any).status,
        profilePhoto: (user as any).profilePhoto,
        role: "citizen",
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function deleteCitizenById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const existing = await CitizenUserModel.findById(id).lean().exec();
    if (!existing) throw new HttpError(404, "Citizen not found");

    await deleteProfilePhotoFileIfExists((existing as any).profilePhoto);
    await CitizenUserModel.findByIdAndDelete(id).exec();

    return res.status(200).json({
      success: true,
      message: "Citizen deleted",
    });
  } catch (err) {
    return next(err);
  }
}
