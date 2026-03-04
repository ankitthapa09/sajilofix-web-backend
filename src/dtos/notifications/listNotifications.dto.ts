import { z } from "zod";

const toOptionalInt = (defaultValue: number) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.floor(parsed) : undefined;
  }, z.number().int().positive().default(defaultValue));

const toOptionalBoolean = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return undefined;
}, z.boolean().optional());

export const listNotificationsQuerySchema = z.object({
  page: toOptionalInt(1),
  limit: toOptionalInt(20),
  isRead: toOptionalBoolean,
});

export type ListNotificationsQueryInput = z.infer<typeof listNotificationsQuerySchema>;
