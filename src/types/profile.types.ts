import type { UserRole, UserStatus } from "../models/userCollections.model";

export type ProfilePayload = {
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
  status?: UserStatus;
};
