import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { connectDatabase } from "../database/connect";
import { AdminUserModel, AuthorityUserModel, CitizenUserModel } from "../models/userCollections.model";
import { roleFromEmail } from "../services/roleFromEmail.service";

function requireScriptEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var for seed script: ${name}`);
  return value;
}

function normalizeAdminPhoneNational(value: string): string {
  const digits = value.trim();
  if (!/^\d{10}$/.test(digits)) {
    throw new Error("ADMIN_PHONE_NATIONAL must be exactly 10 digits (Nepal number without +977)");
  }
  return digits;
}

async function main() {
  await connectDatabase();

  const email = (process.env.ADMIN_EMAIL ?? "admin@sajilofix.com").trim().toLowerCase();
  const password = requireScriptEnv("ADMIN_PASSWORD");

  const derivedRole = roleFromEmail(email);
  if (derivedRole !== "admin") {
    throw new Error(
      `ADMIN_EMAIL must match admin email rule. Current email '${email}' derives role '${derivedRole}'.`,
    );
  }

  const fullName = (process.env.ADMIN_FULL_NAME ?? "SajiloFix Admin").trim();
  const municipality = (process.env.ADMIN_MUNICIPALITY ?? "Kathmandu").trim();
  const wardNumber = (process.env.ADMIN_WARD_NUMBER ?? "1").trim();

  const phoneNationalNumber = normalizeAdminPhoneNational(
    process.env.ADMIN_PHONE_NATIONAL ?? "9800000000",
  );
  const phoneCountryCode = "+977";
  const phoneE164 = `${phoneCountryCode}${phoneNationalNumber}`;

  const forceUpdate = (process.env.ADMIN_FORCE_UPDATE ?? "false").toLowerCase() === "true";

  const adminByEmail = await AdminUserModel.findOne({ email }).exec();
  const authorityByEmail = await AuthorityUserModel.findOne({ email }).exec();
  const citizenByEmail = await CitizenUserModel.findOne({ email }).exec();
  const existingByEmail = adminByEmail ?? authorityByEmail ?? citizenByEmail;

  const existingByPhone =
    (await AdminUserModel.findOne({ $or: [{ phoneE164 }, { phone: phoneE164 }] }).exec()) ??
    (await AuthorityUserModel.findOne({ $or: [{ phoneE164 }, { phone: phoneE164 }] }).exec()) ??
    (await CitizenUserModel.findOne({ $or: [{ phoneE164 }, { phone: phoneE164 }] }).exec());

  if (
    existingByPhone &&
    (!existingByEmail || existingByPhone._id.toString() !== existingByEmail._id.toString())
  ) {
    throw new Error(
      `Phone ${phoneE164} is already used by another account. Set ADMIN_PHONE_NATIONAL to a unique 10-digit number.`,
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (existingByEmail && !adminByEmail) {
    throw new Error(
      `Email '${email}' already exists in a non-admin collection. Delete it first or choose a different ADMIN_EMAIL.`,
    );
  }

  if (existingByEmail) {
    if (!forceUpdate) {
      console.log(`Admin already exists for ${email}. No changes made.`);
      return;
    }

    adminByEmail!.set({
      fullName,
      passwordHash,
      role: "admin",
      phone: phoneE164,
      phoneCountryCode,
      phoneNationalNumber,
      phoneE164,
      wardNumber,
      municipality,
    });

    await adminByEmail!.save();
    console.log(`Admin updated for ${email}.`);
    return;
  }

  await AdminUserModel.create({
    fullName,
    email,
    phone: phoneE164,
    phoneCountryCode,
    phoneNationalNumber,
    phoneE164,
    wardNumber,
    municipality,
    passwordHash,
    role: "admin",
  });

  console.log(`Admin created for ${email}.`);
}

main()
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });
