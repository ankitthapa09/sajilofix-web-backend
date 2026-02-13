import { z } from "zod";

export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .transform((value) => value.toLowerCase().trim()),
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const resetPasswordBodySchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordBodyInput = z.infer<typeof resetPasswordBodySchema>;
