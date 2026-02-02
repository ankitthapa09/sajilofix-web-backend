import mongoose, { type InferSchemaType, type Model } from "mongoose";

export const USER_ROLES = ["admin", "authority", "citizen"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["active", "suspended"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },

    // phone no as unique identification aaile ko lagi
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },

    phoneCountryCode: {
      type: String,
      required: true,
      trim: true,
    },

    phoneNationalNumber: {
      type: String,
      required: true,
      trim: true,
    },

    phoneE164: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },

    wardNumber: { type: String, required: true, trim: true },
    municipality: { type: String, required: true, trim: true },

    district: { type: String, trim: true },
    tole: { type: String, trim: true },
    dob: { type: String, trim: true },
    citizenshipNumber: { type: String, trim: true },

    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      default: "citizen" satisfies UserRole,
      index: true,
    },

    // Used mainly for authority accounts in the admin dashboard.
    department: { type: String, trim: true },

    status: {
      type: String,
      enum: USER_STATUSES,
      required: true,
      default: "active" satisfies UserStatus,
      index: true,
    },

    profilePhoto: { type: String, trim: true },
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof userSchema>;

export const AdminUserModel: Model<User> =
  mongoose.models.AdminUser || mongoose.model<User>("AdminUser", userSchema, "admin");

export const AuthorityUserModel: Model<User> =
  mongoose.models.AuthorityUser ||
  mongoose.model<User>("AuthorityUser", userSchema, "authority");

export const CitizenUserModel: Model<User> =
  mongoose.models.CitizenUser || mongoose.model<User>("CitizenUser", userSchema, "citizen");

export const ALL_USER_MODELS: Array<Model<User>> = [AdminUserModel, AuthorityUserModel, CitizenUserModel];

export function modelForRole(role: UserRole): Model<User> {
  switch (role) {
    case "admin":
      return AdminUserModel;
    case "authority":
      return AuthorityUserModel;
    case "citizen":
      return CitizenUserModel;
  }
}
