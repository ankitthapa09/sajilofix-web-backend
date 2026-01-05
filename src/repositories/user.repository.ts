import type { Document } from "mongoose";
import { UserModel } from "../models/user.model";

export type UserDoc = Document & {
  _id: any;
  fullName: string;
  email: string;
  phone: string;
  wardNumber: string;
  municipality: string;
  passwordHash: string;
  role: string;
};

export const UserRepository = {
  findByEmail: async (email: string) => {
    return UserModel.findOne({ email }).exec();
  },

  findByPhone: async (phone: string) => {
    return UserModel.findOne({ phone }).exec();
  },

  create: async (data: Partial<UserDoc>) => {
    return UserModel.create(data as any);
  },
};
