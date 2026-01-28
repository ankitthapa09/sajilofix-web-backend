import mongoose, { type InferSchemaType, type Model } from "mongoose";

export const USER_ROLES = ["admin", "authority", "citizen"] as const;
export type UserRole = (typeof USER_ROLES)[number];

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

    profilePhoto: { type: String, trim: true },
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof userSchema>;

export const UserModel: Model<User> =
  mongoose.models.User || mongoose.model<User>("User", userSchema);
