import request from "supertest";
import bcrypt from "bcryptjs";
import jwt, { type Secret } from "jsonwebtoken";
import app from "../../../app";
import { env } from "../../../config/env";
import { CitizenUserModel } from "../../../models/userCollections.model";
import { makeEmail, makePhone } from "../../helpers/test.util";

describe("Integration - Auth - Password Reset Tests", () => {
  const userEmail = makeEmail("test-reset");
  const initialPassword = "Init@1234";
  const newPassword = "NewPass@1234";
  const userPhone = makePhone(50);
  let userId = "";

  beforeAll(async () => {
    await CitizenUserModel.deleteOne({ email: userEmail });

    const passwordHash = await bcrypt.hash(initialPassword, 10);
    const doc = await CitizenUserModel.create({
      fullName: "Test Reset User",
      email: userEmail,
      phone: `+977${userPhone}`,
      phoneCountryCode: "+977",
      phoneNationalNumber: userPhone,
      phoneE164: `+977${userPhone}`,
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

  test("request password reset invalid email", async () => {
    const response = await request(app)
      .post("/api/auth/request-password-reset")
      .send({ email: "not-an-email" });
    expect(response.status).toBe(400);
  });

  test("request password reset unknown user", async () => {
    const response = await request(app)
      .post("/api/auth/request-password-reset")
      .send({ email: makeEmail("unknown-reset") });
    expect(response.status).toBe(404);
  });

  test("reset password invalid token", async () => {
    const response = await request(app)
      .post("/api/auth/reset-password/invalid-token")
      .send({ newPassword, confirmPassword: newPassword });
    expect(response.status).toBe(400);
  });

  test("reset password mismatched confirmPassword", async () => {
    const token = jwt.sign({ id: userId }, env.JWT_SECRET as unknown as Secret, { expiresIn: "10m" });
    const response = await request(app)
      .post(`/api/auth/reset-password/${token}`)
      .send({ newPassword, confirmPassword: "Mismatch@1234" });
    expect(response.status).toBe(400);
  });

  test("reset password missing confirmPassword", async () => {
    const token = jwt.sign({ id: userId }, env.JWT_SECRET as unknown as Secret, { expiresIn: "10m" });
    const response = await request(app)
      .post(`/api/auth/reset-password/${token}`)
      .send({ newPassword });
    expect(response.status).toBe(400);
  });

  test("reset password short new password", async () => {
    const token = jwt.sign({ id: userId }, env.JWT_SECRET as unknown as Secret, { expiresIn: "10m" });
    const response = await request(app)
      .post(`/api/auth/reset-password/${token}`)
      .send({ newPassword: "123", confirmPassword: "123" });
    expect(response.status).toBe(400);
  });

  test("reset password valid token", async () => {
    const token = jwt.sign({ id: userId }, env.JWT_SECRET as unknown as Secret, { expiresIn: "10m" });
    const response = await request(app)
      .post(`/api/auth/reset-password/${token}`)
      .send({ newPassword, confirmPassword: newPassword });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
  });

  test("login works with new password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: userEmail, password: newPassword });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
  });
});
