import { z } from "zod";

// Note: Role is NOT accepted from the client. Self-registration is citizen-only.
export const registerSchema = z
  .object({
    fullName: z.string().min(3, "Full name must be at least 3 characters").max(50),
    email: z.string().email("Please enter a valid email address").transform((v) => v.toLowerCase()),
    phone: z
      .string()
      .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits"),

    wardNumber: z.string().min(1, "Ward number is required"),
    municipality: z.string().min(1, "Municipality/City is required"),

    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),

    agreeToTerms: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.agreeToTerms === true, {
    message: "You must agree to the terms and conditions",
    path: ["agreeToTerms"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
