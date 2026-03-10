import request from "supertest";
import mongoose from "mongoose";
import app from "../../../app";
import { signToken } from "../../helpers/test.util";

describe("Integration - Admin - Auth Guards", () => {
  const adminToken = signToken("admin", "test-admin-guards");
  const citizenToken = signToken("citizen", "test-citizen-guards");

  const authorityPayload = {
    fullName: "Guard Authority",
    email: "guard-authority@sajilofix.gov.np",
    password: "Authority@1234",
    phone: "9800000099",
    wardNumber: "2",
    municipality: "Lalitpur",
    department: "Roads",
    status: "active" as const,
  };

  const citizenPayload = {
    fullName: "Guard Citizen",
    email: "guard-citizen@gmail.com",
    password: "Citizen@1234",
    phone: "9800000098",
    wardNumber: "7",
    municipality: "Kathmandu",
    status: "active" as const,
  };

  const noAuthCases = [
    { method: "get", path: "/api/admin/users" },
    { method: "post", path: "/api/admin/authorities", payload: authorityPayload },
    { method: "post", path: "/api/admin/citizens", payload: citizenPayload },
    { method: "delete", path: `/api/admin/authorities/${new mongoose.Types.ObjectId().toString()}` },
  ] as const;

  test.each(noAuthCases)("admin endpoint without auth -> $method $path", async (testCase) => {
    const { method, path } = testCase;
    let req = request(app)[method](path);
    if ("payload" in testCase && testCase.payload) req = req.send(testCase.payload);
    const response = await req;
    expect(response.status).toBe(401);
  });

  test("admin endpoint with malformed Authorization header", async () => {
    const response = await request(app)
      .get("/api/admin/users")
      .set("Authorization", "Token bad");
    expect(response.status).toBe(401);
  });

  test("citizen token cannot list admin users", async () => {
    const response = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${citizenToken}`);
    expect(response.status).toBe(403);
  });

  test("citizen token cannot create authority", async () => {
    const response = await request(app)
      .post("/api/admin/authorities")
      .set("Authorization", `Bearer ${citizenToken}`)
      .send(authorityPayload);
    expect(response.status).toBe(403);
  });

  test("admin token can access users list endpoint", async () => {
    const response = await request(app)
      .get("/api/admin/users?page=1&limit=5")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });
});
