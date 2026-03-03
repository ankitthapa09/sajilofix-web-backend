import type { Model } from "mongoose";
import {
  AdminUserModel,
  AuthorityUserModel,
  CitizenUserModel,
  modelForRole,
  type User,
  type UserRole,
} from "../models/userCollections.model";
import type { AdminManagedRole } from "../types/adminUser.types";

type UserModel = Model<User>;

const ROLE_MODELS: Record<AdminManagedRole, UserModel> = {
  admin: AdminUserModel,
  authority: AuthorityUserModel,
  citizen: CitizenUserModel,
};

export const AdminUserRepository = {
  findById: async (id: string, role: Extract<UserRole, "authority" | "citizen">) => {
    return modelForRole(role).findById(id).exec();
  },

  findByIdLean: async (id: string, role: Extract<UserRole, "authority" | "citizen">) => {
    return modelForRole(role).findById(id, { passwordHash: 0 }).lean().exec();
  },

  updateByIdLean: async (
    id: string,
    role: Extract<UserRole, "authority" | "citizen">,
    updates: Partial<User>
  ) => {
    return modelForRole(role)
      .findByIdAndUpdate(id, { $set: updates }, { new: true })
      .select({ passwordHash: 0 })
      .lean()
      .exec();
  },

  deleteById: async (id: string, role: Extract<UserRole, "authority" | "citizen">) => {
    return modelForRole(role).findByIdAndDelete(id).exec();
  },

  createAuthority: async (data: Partial<User>) => {
    return AuthorityUserModel.create({ ...data, role: "authority" });
  },

  createCitizen: async (data: Partial<User>) => {
    return CitizenUserModel.create({ ...data, role: "citizen" });
  },

  findByEmailInRole: async (email: string, role: AdminManagedRole, excludeId?: string) => {
    const query: Record<string, unknown> = excludeId ? { email, _id: { $ne: excludeId } } : { email };
    return ROLE_MODELS[role].findOne(query).lean().exec();
  },

  findByPhoneInRole: async (phoneE164: string, role: AdminManagedRole, excludeId?: string) => {
    const queryAny: Record<string, unknown> = { $or: [{ phoneE164 }, { phone: phoneE164 }] };
    const query: Record<string, unknown> = excludeId ? { ...queryAny, _id: { $ne: excludeId } } : queryAny;
    return ROLE_MODELS[role].findOne(query).lean().exec();
  },

  listRoleUsers: async (role: AdminManagedRole, filter: Record<string, unknown>) => {
    return ROLE_MODELS[role].find(filter, { passwordHash: 0 }).sort({ createdAt: -1 }).lean().exec();
  },

  countRoleUsers: async (role: AdminManagedRole, filter: Record<string, unknown>) => {
    return ROLE_MODELS[role].countDocuments(filter).exec();
  },
};
