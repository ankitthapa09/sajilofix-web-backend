import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { HttpError } from "../../errors/httpError";
import { AdminUserModel, AuthorityUserModel, CitizenUserModel } from "../../models/userCollections.model";
import { roleFromEmail } from "../../services/roleFromEmail.service";
import type { UpdateAuthorityInput } from "../../dtos/admin/updateAuthority.dto";
import { deleteProfilePhotoFileIfExists } from "./_profilePhotoFs";
import { normalizeNepalPhone } from "./_phoneNepal";

async function emailExistsOutsideAuthority(email: string, excludeId: string) {
  const [inAuthority, inAdmin, inCitizen] = await Promise.all([
    AuthorityUserModel.findOne({ email, _id: { $ne: excludeId } }).lean().exec(),
    AdminUserModel.findOne({ email }).lean().exec(),
    CitizenUserModel.findOne({ email }).lean().exec(),
  ]);
  return Boolean(inAuthority || inAdmin || inCitizen);
}

async function phoneExistsOutsideAuthority(phoneE164: string, excludeId: string) {
  const queryAny = { $or: [{ phoneE164 }, { phone: phoneE164 }] };
  const [inAuthority, inAdmin, inCitizen] = await Promise.all([
    AuthorityUserModel.findOne({ ...queryAny, _id: { $ne: excludeId } }).lean().exec(),
    AdminUserModel.findOne(queryAny).lean().exec(),
    CitizenUserModel.findOne(queryAny).lean().exec(),
  ]);
  return Boolean(inAuthority || inAdmin || inCitizen);
}

export async function getAuthorityById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const user = await AuthorityUserModel.findById(id, { passwordHash: 0 }).lean().exec();
    if (!user) throw new HttpError(404, "Authority not found");

    return res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        wardNumber: user.wardNumber,
        municipality: user.municipality,
        department: (user as any).department,
        status: (user as any).status,
        profilePhoto: (user as any).profilePhoto,
        role: "authority",
        createdAt: (user as any).createdAt,
        updatedAt: (user as any).updatedAt,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function updateAuthorityById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const body = req.body as UpdateAuthorityInput;

    const existing = await AuthorityUserModel.findById(id).exec();
    if (!existing) throw new HttpError(404, "Authority not found");

    const update: Record<string, any> = {};

    if (body.fullName !== undefined) update.fullName = body.fullName.trim();
    if (body.wardNumber !== undefined) update.wardNumber = body.wardNumber.trim();
    if (body.municipality !== undefined) update.municipality = body.municipality.trim();
    if (body.department !== undefined) update.department = body.department.trim();
    if (body.status !== undefined) update.status = body.status;

    if (body.email !== undefined) {
      const email = body.email.toLowerCase();
      const derivedRole = roleFromEmail(email);
      if (derivedRole !== "authority") {
        throw new HttpError(
          400,
          "Email does not match authority rules. Use an authority domain email (e.g. *@sajilofix.gov.np).",
        );
      }
      if (await emailExistsOutsideAuthority(email, id)) {
        throw new HttpError(409, "Email already in use");
      }
      update.email = email;
    }

    if (body.phone !== undefined) {
      const { phoneCountryCode, phoneNationalNumber, phoneE164 } = normalizeNepalPhone(body.phone);
      if (await phoneExistsOutsideAuthority(phoneE164, id)) {
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

    const user = await AuthorityUserModel.findByIdAndUpdate(id, { $set: update }, { new: true })
      .select({ passwordHash: 0 })
      .lean()
      .exec();

    if (!user) throw new HttpError(404, "Authority not found");

    return res.status(200).json({
      success: true,
      message: "Authority updated",
      data: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        wardNumber: user.wardNumber,
        municipality: user.municipality,
        department: (user as any).department,
        status: (user as any).status,
        profilePhoto: (user as any).profilePhoto,
        role: "authority",
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function deleteAuthorityById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const existing = await AuthorityUserModel.findById(id).lean().exec();
    if (!existing) throw new HttpError(404, "Authority not found");

    await deleteProfilePhotoFileIfExists((existing as any).profilePhoto);
    await AuthorityUserModel.findByIdAndDelete(id).exec();

    return res.status(200).json({
      success: true,
      message: "Authority deleted",
    });
  } catch (err) {
    return next(err);
  }
}
