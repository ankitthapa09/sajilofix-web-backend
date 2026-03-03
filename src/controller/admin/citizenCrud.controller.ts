import type { NextFunction, Request, Response } from "express";
import type { UpdateCitizenInput } from "../../dtos/admin/updateCitizen.dto";
import { deleteProfilePhotoFileIfExists } from "../../services/fileStorage.service";
import {
  deleteCitizenAccount,
  getCitizenProfile,
  updateCitizenProfile,
} from "../../services/adminUser.service";

export async function getCitizenById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const user = await getCitizenProfile(id);

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        wardNumber: user.wardNumber,
        municipality: user.municipality,
        district: user.district,
        tole: user.tole,
        dob: user.dob,
        citizenshipNumber: user.citizenshipNumber,
        status: user.status,
        profilePhoto: user.profilePhoto,
        role: "citizen",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
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
    const user = await updateCitizenProfile(id, body);

    return res.status(200).json({
      success: true,
      message: "Citizen updated",
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        wardNumber: user.wardNumber,
        municipality: user.municipality,
        district: user.district,
        tole: user.tole,
        dob: user.dob,
        citizenshipNumber: user.citizenshipNumber,
        status: user.status,
        profilePhoto: user.profilePhoto,
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
    const result = await deleteCitizenAccount(id);
    await deleteProfilePhotoFileIfExists(result.profilePhoto);

    return res.status(200).json({
      success: true,
      message: "Citizen deleted",
    });
  } catch (err) {
    return next(err);
  }
}
