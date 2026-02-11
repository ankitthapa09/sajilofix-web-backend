import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { profilePhotoUpload } from "../middleware/upload.middleware";
import { updateMePhoto } from "../controller/users/updateMePhoto.controller";
import { getMe } from "../controller/users/getMe.controller";
import { deleteMePhoto } from "../controller/users/deleteMePhoto.controller";
import { validateBody } from "../middleware/validate.middleware";
import { updateMeSchema } from "../dtos/users/updateMe.dto";
import { updateMe } from "../controller/users/updateMe.controller";

export const userRouter = Router();

// GET /api/users/me
userRouter.get("/me", requireAuth, getMe);

// PATCH /api/users/me
userRouter.patch("/me", requireAuth, validateBody(updateMeSchema), updateMe);

// PUT /api/users/me/photo
userRouter.put("/me/photo", requireAuth, profilePhotoUpload.single("photo"), updateMePhoto);

// DELETE /api/users/me/photo
userRouter.delete("/me/photo", requireAuth, deleteMePhoto);
