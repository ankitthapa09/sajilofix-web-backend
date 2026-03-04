import { z } from "zod";

export const markNotificationReadParamsSchema = z.object({
  id: z.string().trim().min(1, "Notification id is required"),
});

export type MarkNotificationReadParamsInput = z.infer<typeof markNotificationReadParamsSchema>;
