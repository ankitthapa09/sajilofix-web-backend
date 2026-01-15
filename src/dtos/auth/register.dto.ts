import { z } from "zod";

const phoneNationalNumberSchema = z
  .string()
  .regex(/^\d{10}$/, "Phone number must be exactly 10 digits");

const phoneCountryCodeSchema = z
  .string()
  .regex(/^\+977$/, "Country code must be +977");

const phoneSchema = z
  .string()
  .regex(/^(?:\d{10}|\+977\d{10})$/, "Phone number must be 10 digits or +977 followed by 10 digits");

// Note: Role is NOT accepted from the client. Self-registration is citizen-only.
export const registerSchema = z
  .object({
    fullName: z.string().min(3, "Full name must be at least 3 characters").max(50),
    email: z.string().email("Please enter a valid email address").transform((v) => v.toLowerCase()),

    phone: phoneSchema.optional(),
    phoneCountryCode: phoneCountryCodeSchema.optional(),
    phoneNationalNumber: phoneNationalNumberSchema.optional(),

    wardNumber: z.string().min(1, "Ward number is required").optional(),
    ward: z.string().min(1, "Ward number is required").optional(),
    municipality: z.string().min(1, "Municipality/City is required"),
    district: z.string().min(1, "District is required").optional(),
    tole: z.string().min(1, "Tole is required").optional(),
    dob: z.string().min(1, "Date of birth is required").optional(),
    citizenshipNumber: z.string().min(1, "Citizenship number is required").optional(),

    roleIndex: z.number().int().min(0).max(1).optional(),

    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password").optional(),

    agreeToTerms: z.boolean().optional(),
  })
  .refine((data) => (data.confirmPassword ? data.password === data.confirmPassword : true), {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.agreeToTerms !== false, {
    message: "You must agree to the terms and conditions",
    path: ["agreeToTerms"],
  })
  .refine((data) => {
    const hasParts = Boolean(data.phoneCountryCode && data.phoneNationalNumber);
    const hasPhone = Boolean(data.phone && data.phone.trim().length > 0);
    return hasParts || hasPhone;
  }, {
    message: "Phone number is required",
    path: ["phone"],
  })
  .refine((data) => Boolean((data.wardNumber ?? data.ward)?.trim()), {
    message: "Ward number is required",
    path: ["wardNumber"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
