import { z } from "zod";

export const updateIssueStatusSchema = z.object({
  status: z.enum(["pending", "in_progress", "resolved", "rejected"]),
});

export type UpdateIssueStatusInput = z.infer<typeof updateIssueStatusSchema>;
