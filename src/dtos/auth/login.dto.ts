import { z } from "zod";


export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),

  // Front-end ma user select garna parne bhayeko bhayera aaile ko lagi yo optional xa bhanna chahanxu 
  userType: z.enum(["citizen", "admin"]).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
