import type { UserRole, UserStatus } from "../models/userCollections.model";

export type AdminManagedRole = Extract<UserRole, "admin" | "authority" | "citizen">;

export type ListUsersQuery = {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  tab?: string;
  status?: string;
};

export type UserListRow = {
  id: string;
  fullName: string;
  email: string;
  role: AdminManagedRole;
  profilePhoto?: string;
  department: string;
  status: UserStatus;
  joinedDate: string;
  lastActive: string;
  activity: string;
};

export type ListUsersResult = {
  data: UserListRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type AdminUserProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  wardNumber: string;
  municipality: string;
  role: "authority" | "citizen";
  status: UserStatus;
  profilePhoto?: string;
  createdAt?: Date;
  updatedAt?: Date;
  department?: string;
  district?: string;
  tole?: string;
  dob?: string;
  citizenshipNumber?: string;
};

export type CreateAdminUserResult = {
  id: string;
  fullName: string;
  email: string;
  role: "authority" | "citizen";
  status: UserStatus;
  joinedDate: string;
  department?: string;
};
