import { Router } from "express";
import { validateBody } from "../middleware/validate.middleware";
import { registerSchema } from "../dtos/auth/register.dto";
import { register } from "../controller/auth/register.controller";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), register);
