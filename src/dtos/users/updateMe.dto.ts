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

export const updateMeSchema = z
  .object({
    fullName: z.string().min(3, "Full name must be at least 3 characters").max(50).optional(),

    // Phone can be updated either as `phone` (10 digits or +977XXXXXXXXXX)
    // or as the split parts.
    phone: phoneSchema.optional(),
    phoneCountryCode: phoneCountryCodeSchema.optional(),
    phoneNationalNumber: phoneNationalNumberSchema.optional(),

    wardNumber: z.string().min(1, "Ward number is required").optional(),
    ward: z.string().min(1, "Ward number is required").optional(),

    municipality: z.string().min(1, "Municipality/City is required").optional(),
    district: z.string().min(1, "District is required").optional(),
    tole: z.string().min(1, "Tole is required").optional(),
    dob: z.string().min(1, "Date of birth is required").optional(),
    citizenshipNumber: z.string().min(1, "Citizenship number is required").optional(),
  })
  .refine((data) => {
    const hasCountry = Boolean(data.phoneCountryCode);
    const hasNational = Boolean(data.phoneNationalNumber);
    // If updating via split parts, require both.
    return (hasCountry && hasNational) || (!hasCountry && !hasNational);
  }, {
    message: "Provide both phoneCountryCode and phoneNationalNumber",
    path: ["phoneCountryCode"],
  });

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
