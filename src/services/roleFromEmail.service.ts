import type { UserRole } from "../models/userCollections.model";

export type RoleRules = {
  adminEmails: string[];
  authorityEmailDomains: string[];
};

export const DEFAULT_ROLE_RULES: RoleRules = {
  
  adminEmails: ["admin@sajilofix.com"],
  
  authorityEmailDomains: ["sajilofix.gov.np"],
};

export function roleFromEmail(emailRaw: string, rules: RoleRules = DEFAULT_ROLE_RULES): UserRole {
  const email = emailRaw.trim().toLowerCase();

  if (rules.adminEmails.map((e) => e.toLowerCase()).includes(email)) return "admin";

  const domain = email.split("@")[1] ?? "";
  if (rules.authorityEmailDomains.map((d) => d.toLowerCase()).includes(domain)) return "authority";

  return "citizen";
}
