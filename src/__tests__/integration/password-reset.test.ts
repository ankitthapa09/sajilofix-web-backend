import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import app from "../../app";
import { CitizenUserModel } from "../../models/userCollections.model";
import { env } from "../../config/env";

describe("Password Reset Integration Tests", () => {
  const userEmail = "resetuser1@gmail.com";
  const initialPassword = "Init@1234";
  const newPassword = "New@12345";
  let userId = "";

  beforeAll(async () => {
    await CitizenUserModel.deleteOne({ email: userEmail });

    const passwordHash = await bcrypt.hash(initialPassword, 10);
    const doc = await CitizenUserModel.create({
      fullName: "Reset User",
      email: userEmail,
      phone: "+9779800000004",
      phoneCountryCode: "+977",
      phoneNationalNumber: "9800000004",
      phoneE164: "+9779800000004",
      wardNumber: "4",
      municipality: "Kathmandu",
      passwordHash,
      role: "citizen",
      status: "active",
    });

    userId = doc._id.toString();
  });

  afterAll(async () => {
    await CitizenUserModel.deleteOne({ email: userEmail });
  });

  test("should reset password with a valid token", async () => {
    const token = jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: "10m" });

    const response = await request(app)
      .post(`/api/auth/reset-password/${token}`)
      .send({
        newPassword,
        confirmPassword: newPassword,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Password has been reset successfully.");
  });

  test("should login with the new password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: userEmail,
        password: newPassword,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Login successful");
    expect(response.body).toHaveProperty("token");
  });
});
