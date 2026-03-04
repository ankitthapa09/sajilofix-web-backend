import bcrypt from "bcryptjs";
import { HttpError } from "../errors/httpError";
import type { User } from "../models/userCollections.model";
import { AdminUserRepository } from "../repositories/adminUser.repository";
import { roleFromEmail } from "./roleFromEmail.service";
import { normalizeNepalPhone } from "../utils/phone.util";
import type { CreateAuthorityInput } from "../dtos/admin/createAuthority.dto";
import type { CreateCitizenInput } from "../dtos/admin/createCitizen.dto";
import type { UpdateAuthorityInput } from "../dtos/admin/updateAuthority.dto";
import type { UpdateCitizenInput } from "../dtos/admin/updateCitizen.dto";
import type {
  AdminManagedRole,
  AdminUserProfile,
  CreateAdminUserResult,
  ListUsersQuery,
  ListUsersResult,
  UserListRow,
} from "../types/adminUser.types";

type UserSortRow = UserListRow & { _createdAtSort: number };

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveRoles(role?: string, tab?: string): AdminManagedRole[] {
  const all: AdminManagedRole[] = ["admin", "authority", "citizen"];
  let roles = all;

  if (tab === "citizens") roles = roles.filter((r) => r === "citizen");
  if (tab === "authorities") roles = roles.filter((r) => r === "authority");

  if (role === "admin" || role === "authority" || role === "citizen") {
    roles = roles.filter((r) => r === role);
  }

  return roles;
}

function toRow(role: AdminManagedRole, doc: any): UserSortRow {
  const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
  return {
    id: doc._id.toString(),
    fullName: doc.fullName,
    email: doc.email,
    role,
    profilePhoto: typeof doc.profilePhoto === "string" && doc.profilePhoto.trim() ? doc.profilePhoto.trim() : undefined,
    department: typeof doc.department === "string" && doc.department.trim() ? doc.department : "—",
    status: doc.status === "suspended" ? "suspended" : "active",
    joinedDate: createdAt.toISOString().slice(0, 10),
    lastActive: "—",
    activity: "—",
    _createdAtSort: createdAt.getTime(),
  };
}

async function emailExistsAnywhere(email: string, exclude?: { role: "authority" | "citizen"; id: string }) {
  const checks: Promise<unknown>[] = [
    AdminUserRepository.findByEmailInRole(email, "admin"),
    AdminUserRepository.findByEmailInRole(email, "authority", exclude?.role === "authority" ? exclude.id : undefined),
    AdminUserRepository.findByEmailInRole(email, "citizen", exclude?.role === "citizen" ? exclude.id : undefined),
  ];
  const [a, b, c] = await Promise.all(checks);
  return Boolean(a || b || c);
}

async function phoneExistsAnywhere(phoneE164: string, exclude?: { role: "authority" | "citizen"; id: string }) {
  const checks: Promise<unknown>[] = [
    AdminUserRepository.findByPhoneInRole(phoneE164, "admin"),
    AdminUserRepository.findByPhoneInRole(
      phoneE164,
      "authority",
      exclude?.role === "authority" ? exclude.id : undefined,
    ),
    AdminUserRepository.findByPhoneInRole(
      phoneE164,
      "citizen",
      exclude?.role === "citizen" ? exclude.id : undefined,
    ),
  ];
  const [a, b, c] = await Promise.all(checks);
  return Boolean(a || b || c);
}

function toProfile(role: "authority" | "citizen", user: any): AdminUserProfile {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    wardNumber: user.wardNumber,
    municipality: user.municipality,
    district: user.district,
    tole: user.tole,
    dob: user.dob,
    citizenshipNumber: user.citizenshipNumber,
    department: user.department,
    status: user.status === "suspended" ? "suspended" : "active",
    profilePhoto: user.profilePhoto,
    role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function listAdminUsers(input: ListUsersQuery): Promise<ListUsersResult> {
  const page = input.page > 0 ? input.page : 1;
  const limit = input.limit > 0 ? input.limit : 10;
  const skip = (page - 1) * limit;

  const search = input.search?.trim() ?? "";
  const role = input.role?.trim().toLowerCase() ?? "";
  const tab = input.tab?.trim().toLowerCase() ?? "";
  const status = input.status?.trim().toLowerCase() ?? "";

  const allowedRoles = resolveRoles(role, tab);

  if (allowedRoles.length === 0) {
    return {
      data: [],
      meta: { total: 0, page, limit, totalPages: 1 },
    };
  }

  const filter: Record<string, unknown> = {};
  if (status === "active" || status === "suspended") {
    filter.status = status;
  }

  if (search) {
    const regex = new RegExp(escapeRegExp(search), "i");
    filter.$or = [{ fullName: regex }, { email: regex }];
  }

  const [docsByRole, counts] = await Promise.all([
    Promise.all(allowedRoles.map((roleName) => AdminUserRepository.listRoleUsers(roleName, filter))),
    Promise.all(allowedRoles.map((roleName) => AdminUserRepository.countRoleUsers(roleName, filter))),
  ]);

  const rows = docsByRole
    .flatMap((docs, index) => docs.map((doc) => toRow(allowedRoles[index], doc)))
    .sort((a, b) => b._createdAtSort - a._createdAtSort)
    .slice(skip, skip + limit)
    .map(({ _createdAtSort, ...row }) => row);

  const total = counts.reduce((sum, count) => sum + count, 0);

  return {
    data: rows,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function createAuthorityAccount(body: CreateAuthorityInput): Promise<CreateAdminUserResult> {
  const email = body.email.toLowerCase();
  const derivedRole = roleFromEmail(email);
  if (derivedRole !== "authority") {
    throw new HttpError(
      400,
      "Email does not match authority rules. Use an authority domain email (e.g. *@sajilofix.gov.np).",
    );
  }

  if (await emailExistsAnywhere(email)) {
    throw new HttpError(409, "Email already in use");
  }

  const { phoneCountryCode, phoneNationalNumber, phoneE164 } = normalizeNepalPhone(body.phone);
  if (await phoneExistsAnywhere(phoneE164)) {
    throw new HttpError(409, "Phone already in use");
  }

  const passwordHash = await bcrypt.hash(body.password, 10);
  const doc = await AdminUserRepository.createAuthority({
    fullName: body.fullName.trim(),
    email,
    phone: phoneE164,
    phoneCountryCode,
    phoneNationalNumber,
    phoneE164,
    wardNumber: body.wardNumber.trim(),
    municipality: body.municipality.trim(),
    passwordHash,
    department: body.department.trim(),
    status: body.status,
  });

  return {
    id: doc._id.toString(),
    fullName: doc.fullName,
    email: doc.email,
    role: "authority",
    department: doc.department ?? undefined,
    status: doc.status,
    joinedDate: doc.createdAt ? new Date(doc.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
}

export async function createCitizenAccount(body: CreateCitizenInput): Promise<CreateAdminUserResult> {
  const email = body.email.toLowerCase();
  const derivedRole = roleFromEmail(email);
  if (derivedRole !== "citizen") {
    throw new HttpError(400, "Email cannot be an admin/authority email for citizen accounts");
  }

  if (await emailExistsAnywhere(email)) {
    throw new HttpError(409, "Email already in use");
  }

  const { phoneCountryCode, phoneNationalNumber, phoneE164 } = normalizeNepalPhone(body.phone);
  if (await phoneExistsAnywhere(phoneE164)) {
    throw new HttpError(409, "Phone already in use");
  }

  const passwordHash = await bcrypt.hash(body.password, 10);
  const doc = await AdminUserRepository.createCitizen({
    fullName: body.fullName.trim(),
    email,
    phone: phoneE164,
    phoneCountryCode,
    phoneNationalNumber,
    phoneE164,
    wardNumber: body.wardNumber.trim(),
    municipality: body.municipality.trim(),
    district: body.district?.trim(),
    tole: body.tole?.trim(),
    dob: body.dob?.trim(),
    citizenshipNumber: body.citizenshipNumber?.trim(),
    passwordHash,
    status: body.status,
  });

  return {
    id: doc._id.toString(),
    fullName: doc.fullName,
    email: doc.email,
    role: "citizen",
    status: doc.status,
    joinedDate: doc.createdAt ? new Date(doc.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
}

export async function getAuthorityProfile(id: string): Promise<AdminUserProfile> {
  const user = await AdminUserRepository.findByIdLean(id, "authority");
  if (!user) throw new HttpError(404, "Authority not found");
  return toProfile("authority", user);
}

export async function getCitizenProfile(id: string): Promise<AdminUserProfile> {
  const user = await AdminUserRepository.findByIdLean(id, "citizen");
  if (!user) throw new HttpError(404, "Citizen not found");
  return toProfile("citizen", user);
}

export async function updateAuthorityProfile(id: string, body: UpdateAuthorityInput): Promise<AdminUserProfile> {
  const existing = await AdminUserRepository.findById(id, "authority");
  if (!existing) throw new HttpError(404, "Authority not found");

  const updates: Partial<User> = {};
  if (body.fullName !== undefined) updates.fullName = body.fullName.trim();
  if (body.wardNumber !== undefined) updates.wardNumber = body.wardNumber.trim();
  if (body.municipality !== undefined) updates.municipality = body.municipality.trim();
  if (body.department !== undefined) updates.department = body.department.trim();
  if (body.status !== undefined) updates.status = body.status;

  if (body.email !== undefined) {
    const email = body.email.toLowerCase();
    const derivedRole = roleFromEmail(email);
    if (derivedRole !== "authority") {
      throw new HttpError(
        400,
        "Email does not match authority rules. Use an authority domain email (e.g. *@sajilofix.gov.np).",
      );
    }
    if (await emailExistsAnywhere(email, { role: "authority", id })) {
      throw new HttpError(409, "Email already in use");
    }
    updates.email = email;
  }

  if (body.phone !== undefined) {
    const { phoneCountryCode, phoneNationalNumber, phoneE164 } = normalizeNepalPhone(body.phone);
    if (await phoneExistsAnywhere(phoneE164, { role: "authority", id })) {
      throw new HttpError(409, "Phone already in use");
    }
    updates.phoneCountryCode = phoneCountryCode;
    updates.phoneNationalNumber = phoneNationalNumber;
    updates.phoneE164 = phoneE164;
    updates.phone = phoneE164;
  }

  if (body.password !== undefined) {
    updates.passwordHash = await bcrypt.hash(body.password, 10);
  }

  const user = await AdminUserRepository.updateByIdLean(id, "authority", updates);
  if (!user) throw new HttpError(404, "Authority not found");

  return toProfile("authority", user);
}

export async function updateCitizenProfile(id: string, body: UpdateCitizenInput): Promise<AdminUserProfile> {
  const existing = await AdminUserRepository.findById(id, "citizen");
  if (!existing) throw new HttpError(404, "Citizen not found");

  const updates: Partial<User> = {};
  if (body.fullName !== undefined) updates.fullName = body.fullName.trim();
  if (body.wardNumber !== undefined) updates.wardNumber = body.wardNumber.trim();
  if (body.municipality !== undefined) updates.municipality = body.municipality.trim();
  if (body.district !== undefined) updates.district = body.district.trim();
  if (body.tole !== undefined) updates.tole = body.tole.trim();
  if (body.dob !== undefined) updates.dob = body.dob.trim();
  if (body.citizenshipNumber !== undefined) updates.citizenshipNumber = body.citizenshipNumber.trim();
  if (body.status !== undefined) updates.status = body.status;

  if (body.email !== undefined) {
    const email = body.email.toLowerCase();
    const derivedRole = roleFromEmail(email);
    if (derivedRole !== "citizen") {
      throw new HttpError(400, "Email cannot be an admin/authority email for citizen accounts");
    }
    if (await emailExistsAnywhere(email, { role: "citizen", id })) {
      throw new HttpError(409, "Email already in use");
    }
    updates.email = email;
  }

  if (body.phone !== undefined) {
    const { phoneCountryCode, phoneNationalNumber, phoneE164 } = normalizeNepalPhone(body.phone);
    if (await phoneExistsAnywhere(phoneE164, { role: "citizen", id })) {
      throw new HttpError(409, "Phone already in use");
    }
    updates.phoneCountryCode = phoneCountryCode;
    updates.phoneNationalNumber = phoneNationalNumber;
    updates.phoneE164 = phoneE164;
    updates.phone = phoneE164;
  }

  if (body.password !== undefined) {
    updates.passwordHash = await bcrypt.hash(body.password, 10);
  }

  const user = await AdminUserRepository.updateByIdLean(id, "citizen", updates);
  if (!user) throw new HttpError(404, "Citizen not found");

  return toProfile("citizen", user);
}

export async function deleteAuthorityAccount(id: string): Promise<{ profilePhoto?: string }> {
  const existing = await AdminUserRepository.findByIdLean(id, "authority");
  if (!existing) throw new HttpError(404, "Authority not found");

  await AdminUserRepository.deleteById(id, "authority");
  return { profilePhoto: existing.profilePhoto as string | undefined };
}

export async function deleteCitizenAccount(id: string): Promise<{ profilePhoto?: string }> {
  const existing = await AdminUserRepository.findByIdLean(id, "citizen");
  if (!existing) throw new HttpError(404, "Citizen not found");

  await AdminUserRepository.deleteById(id, "citizen");
  return { profilePhoto: existing.profilePhoto as string | undefined };
}
