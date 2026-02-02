import { z } from "zod";
import { USER_STATUSES } from "../../models/userCollections.model";

export const updateCitizenSchema = z
  .object({
    fullName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    wardNumber: z.string().optional(),
    municipality: z.string().optional(),
    district: z.string().optional(),
    tole: z.string().optional(),
    dob: z.string().optional(),
    citizenshipNumber: z.string().optional(),
    status: z.enum(USER_STATUSES).optional(),
    password: z.string().min(8).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "Provide at least one field to update",
  });

export type UpdateCitizenInput = z.infer<typeof updateCitizenSchema>;
