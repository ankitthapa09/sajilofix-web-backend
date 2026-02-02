import type { Document, Model } from "mongoose";
import {
  AdminUserModel,
  AuthorityUserModel,
  CitizenUserModel,
  modelForRole,
  type User,
  type UserRole,
} from "../models/userCollections.model";

export type UserDoc = Document & {
  _id: any;
  fullName: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  phoneNationalNumber: string;
  phoneE164: string;
  wardNumber: string;
  municipality: string;
  district?: string;
  tole?: string;
  dob?: string;
  citizenshipNumber?: string;
  passwordHash: string;
  role: UserRole;
  profilePhoto?: string;
};

async function findInMany<T>(models: Array<Model<any>>, finder: (m: Model<any>) => Promise<T | null>) {
  for (const m of models) {
    // eslint-disable-next-line no-await-in-loop
    const v = await finder(m);
    if (v) return v;
  }
  return null;
}

const ROLE_MODELS: Array<Model<User>> = [AdminUserModel, AuthorityUserModel, CitizenUserModel];

export const UserRepository = {
  findById: async (id: string, role?: UserRole) => {
    const models = role ? [modelForRole(role)] : ROLE_MODELS;
    return findInMany(models, (m) => m.findById(id).exec());
  },

  findByEmail: async (email: string, role: UserRole) => {
    return modelForRole(role).findOne({ email }).exec();
  },

  findByPhone: async (phoneE164: string) => {
    return findInMany(ROLE_MODELS, (m) =>
      m.findOne({ $or: [{ phoneE164 }, { phone: phoneE164 }] }).exec()
    );
  },

  create: async (data: Partial<UserDoc>, role: UserRole) => {
    const model = modelForRole(role);
    return model.create({
      ...data,
      role,
    } as any);
  },

  setProfilePhoto: async (userId: string, profilePhoto: string, role?: UserRole) => {
    const models = role ? [modelForRole(role)] : ROLE_MODELS;
    return findInMany(models, (m) =>
      m
        .findByIdAndUpdate(userId, { $set: { profilePhoto } }, { new: true })
        .exec()
    );
  },

  clearProfilePhoto: async (userId: string, role?: UserRole) => {
    const models = role ? [modelForRole(role)] : ROLE_MODELS;
    return findInMany(models, (m) =>
      m
        .findByIdAndUpdate(userId, { $unset: { profilePhoto: 1 } }, { new: true })
        .exec()
    );
  },
};
