import { z } from "zod";

const phoneSchema = z
  .string()
  .regex(/^(?:\d{10}|\+977\d{10})$/, "Phone number must be 10 digits or +977 followed by 10 digits");

export const createCitizenSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters").max(50),
  email: z.string().email("Please enter a valid email address").transform((v) => v.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),

  phone: phoneSchema,

  wardNumber: z.string().min(1, "Ward number is required"),
  municipality: z.string().min(1, "Municipality/City is required"),

  district: z.string().optional(),
  tole: z.string().optional(),
  dob: z.string().optional(),
  citizenshipNumber: z.string().optional(),

  status: z.enum(["active", "suspended"]).default("active"),
});

export type CreateCitizenInput = z.infer<typeof createCitizenSchema>;
