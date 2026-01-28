import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { profilePhotoUpload } from "../middleware/upload.middleware";
import { updateMePhoto } from "../controller/users/updateMePhoto.controller";

export const userRouter = Router();

// PUT /api/users/me/photo
userRouter.put("/me/photo", requireAuth, profilePhotoUpload.single("photo"), updateMePhoto);
