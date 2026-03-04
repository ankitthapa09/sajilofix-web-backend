import type { NextFunction, Request, Response } from "express";
import type { UpdateAuthorityInput } from "../../dtos/admin/updateAuthority.dto";
import { deleteProfilePhotoFileIfExists } from "../../services/fileStorage.service";
import {
  deleteAuthorityAccount,
  getAuthorityProfile,
  updateAuthorityProfile,
} from "../../services/adminUser.service";

export async function getAuthorityById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const user = await getAuthorityProfile(id);

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        wardNumber: user.wardNumber,
        municipality: user.municipality,
        department: user.department,
        status: user.status,
        profilePhoto: user.profilePhoto,
        role: "authority",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
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
    const user = await updateAuthorityProfile(id, body);

    return res.status(200).json({
      success: true,
      message: "Authority updated",
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        wardNumber: user.wardNumber,
        municipality: user.municipality,
        department: user.department,
        status: user.status,
        profilePhoto: user.profilePhoto,
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
    const result = await deleteAuthorityAccount(id);
    await deleteProfilePhotoFileIfExists(result.profilePhoto);

    return res.status(200).json({
      success: true,
      message: "Authority deleted",
    });
  } catch (err) {
    return next(err);
  }
}
