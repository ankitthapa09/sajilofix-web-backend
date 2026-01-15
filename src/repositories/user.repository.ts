import type { Document } from "mongoose";
import { UserModel } from "../models/user.model";

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
  role: string;
};

export const UserRepository = {
  findByEmail: async (email: string) => {
    return UserModel.findOne({ email }).exec();
  },

  findByPhone: async (phoneE164: string) => {
    return UserModel.findOne({ $or: [{ phoneE164 }, { phone: phoneE164 }] }).exec();
  },

  create: async (data: Partial<UserDoc>) => {
    return UserModel.create(data as any);
  },
};
