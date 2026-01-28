import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../errors/httpError";
import { UserRepository } from "../../repositories/user.repository";
import { PROFILE_PHOTO_RELATIVE_DIR } from "../../middleware/upload.middleware";

export async function updateMePhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.userId;
    if (!userId) throw new HttpError(401, "Unauthorized");

    const file = req.file;
    if (!file) throw new HttpError(400, "Missing file field 'photo'");

    const profilePhoto = `${PROFILE_PHOTO_RELATIVE_DIR}/${file.filename}`;

    const user = await UserRepository.setProfilePhoto(userId, profilePhoto);
    if (!user) throw new HttpError(404, "User not found");

    return res.status(200).json({
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        wardNumber: user.wardNumber,
        municipality: user.municipality,
        profilePhoto: user.profilePhoto,
        role: user.role,
      },
    });
  } catch (err) {
    return next(err);
  }
}
