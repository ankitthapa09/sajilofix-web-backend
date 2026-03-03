import type { UserRole } from "../models/userCollections.model";

export type AuthUserPayload = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  phoneNationalNumber: string;
  wardNumber: string;
  municipality: string;
  district?: string;
  tole?: string;
  dob?: string;
  citizenshipNumber?: string;
  profilePhoto?: string;
  role: UserRole;
};

export type LoginResult = {
  token: string;
  user: AuthUserPayload;
};

export type RegisterResult = {
  user: Omit<AuthUserPayload, "profilePhoto">;
};
