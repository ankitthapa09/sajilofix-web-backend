import { Router } from "express";
import { validateBody } from "../middleware/validate.middleware";
import { registerSchema } from "../dtos/auth/register.dto";
import { loginSchema } from "../dtos/auth/login.dto";
import { register } from "../controller/auth/register.controller";
import { login } from "../controller/auth/login.controller";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), register);
authRouter.post("/login", validateBody(loginSchema), login);
