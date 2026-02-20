import { z } from "zod";

const locationSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().min(2, "Location address is required"),
  district: z.string().min(1, "District is required"),
  municipality: z.string().min(1, "Municipality is required"),
  ward: z.string().min(1, "Ward is required"),
  landmark: z.string().optional(),
});

export const createIssueSchema = z.object({
  category: z.enum([
    "road",
    "lighting",
    "waste",
    "water",
    "drainage",
    "parks",
    "traffic",
    "other",
  ]),
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description is required"),
  urgency: z.enum(["low", "medium", "high", "urgent"]),
  location: locationSchema,
  photos: z.array(z.string()).optional(),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
