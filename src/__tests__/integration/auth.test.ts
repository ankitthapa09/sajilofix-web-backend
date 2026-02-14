import request from "supertest";
import app from "../../app";
import {
  AdminUserModel,
  AuthorityUserModel,
  CitizenUserModel,
} from "../../models/userCollections.model";
import "@types/jest";

describe("Authentication Integration Tests", () => {
  const testUser = {
    fullName: "Test User",
    email: "testuser12@example.com",
    phone: "9800000000",
    wardNumber: "5",
    municipality: "Kathmandu",
    password: "Test@1234",
    confirmPassword: "Test@1234",
    agreeToTerms: true,
  };

  beforeAll(async () => {
    await Promise.all([
      AdminUserModel.deleteOne({ email: testUser.email }),
      AuthorityUserModel.deleteOne({ email: testUser.email }),
      CitizenUserModel.deleteOne({ email: testUser.email }),
    ]);
  });

  afterAll(async () => {
    await Promise.all([
      AdminUserModel.deleteOne({ email: testUser.email }),
      AuthorityUserModel.deleteOne({ email: testUser.email }),
      CitizenUserModel.deleteOne({ email: testUser.email }),
    ]);
  });

  describe("POST /api/auth/register", () => {
    test("should register a new user", async () => {
      const response = await request(app).post("/api/auth/register").send(testUser);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message", "Registered successfully");
    });
  });

  describe("POST /api/auth/login", () => {
    test("should login an existing user", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: testUser.password,
      });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Login successful");
      expect(response.body).toHaveProperty("token");
    });
  });
});
