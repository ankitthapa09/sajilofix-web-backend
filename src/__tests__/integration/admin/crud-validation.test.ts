import request from "supertest";
import mongoose from "mongoose";
import app from "../../../app";
import { AuthorityUserModel, CitizenUserModel } from "../../../models/userCollections.model";
import { makeAuthorityEmail, makeEmail, makePhone, signToken } from "../../helpers/test.util";

describe("Integration - Admin - DTO Validation and CRUD", () => {
  const adminToken = signToken("admin", "test-admin-crud");

  const authorityCrudEmail = makeAuthorityEmail("test-authority-crud");
  const authorityCrudPhone = makePhone(4);

  const citizenCrudEmail = makeEmail("test-citizen-crud");
  const citizenCrudPhone = makePhone(5);

  let createdAuthorityId = "";
  let createdCitizenId = "";

  const baseAuthorityPayload = {
    fullName: "Test Authority",
    email: authorityCrudEmail,
    password: "Authority@1234",
    phone: authorityCrudPhone,
    wardNumber: "2",
    municipality: "Lalitpur",
    department: "Roads",
    status: "active" as const,
  };

  const baseCitizenPayload = {
    fullName: "Test Citizen CRUD",
    email: citizenCrudEmail,
    password: "Citizen@1234",
    phone: citizenCrudPhone,
    wardNumber: "7",
    municipality: "Kathmandu",
    status: "active" as const,
  };

  beforeAll(async () => {
    await Promise.all([
      AuthorityUserModel.deleteOne({ email: authorityCrudEmail }),
      CitizenUserModel.deleteOne({ email: citizenCrudEmail }),
    ]);
  });

  afterAll(async () => {
    await Promise.all([
      AuthorityUserModel.deleteOne({ email: authorityCrudEmail }),
      CitizenUserModel.deleteOne({ email: citizenCrudEmail }),
    ]);
  });

  const invalidAuthorityCases = [
    { name: "missing fullName", payload: { ...baseAuthorityPayload, fullName: "" } },
    { name: "invalid email", payload: { ...baseAuthorityPayload, email: "bad-email" } },
    { name: "invalid phone", payload: { ...baseAuthorityPayload, phone: "123" } },
    { name: "citizen email in authority create", payload: { ...baseAuthorityPayload, email: makeEmail("authority-bad-role") } },
  ];

  test.each(invalidAuthorityCases)("create authority invalid -> $name", async ({ payload }) => {
    const response = await request(app)
      .post("/api/admin/authorities")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect([400, 409]).toContain(response.status);
  });

  const invalidCitizenCases = [
    { name: "missing fullName", payload: { ...baseCitizenPayload, fullName: "" } },
    { name: "invalid email", payload: { ...baseCitizenPayload, email: "bad-email" } },
    { name: "authority email in citizen create", payload: { ...baseCitizenPayload, email: makeAuthorityEmail("citizen-bad-role") } },
  ];

  test.each(invalidCitizenCases)("create citizen invalid -> $name", async ({ payload }) => {
    const response = await request(app)
      .post("/api/admin/citizens")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect([400, 409]).toContain(response.status);
  });

  test("create authority success", async () => {
    const response = await request(app)
      .post("/api/admin/authorities")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(baseAuthorityPayload);

    expect(response.status).toBe(201);
    createdAuthorityId = response.body?.data?.id;
    expect(createdAuthorityId).toBeTruthy();
  });

  test("get authority by id success", async () => {
    const response = await request(app)
      .get(`/api/admin/authorities/${createdAuthorityId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(createdAuthorityId);
  });

  test("update authority success", async () => {
    const response = await request(app)
      .patch(`/api/admin/authorities/${createdAuthorityId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ fullName: "Test Authority Updated", department: "Traffic" });

    expect(response.status).toBe(200);
  });

  test("update authority empty payload", async () => {
    const response = await request(app)
      .patch(`/api/admin/authorities/${createdAuthorityId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(response.status).toBe(400);
  });

  test("get authority not found", async () => {
    const response = await request(app)
      .get(`/api/admin/authorities/${new mongoose.Types.ObjectId().toString()}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });

  test("delete authority success", async () => {
    const response = await request(app)
      .delete(`/api/admin/authorities/${createdAuthorityId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  test("delete authority not found", async () => {
    const response = await request(app)
      .delete(`/api/admin/authorities/${new mongoose.Types.ObjectId().toString()}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });

  test("create citizen success", async () => {
    const response = await request(app)
      .post("/api/admin/citizens")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(baseCitizenPayload);

    expect(response.status).toBe(201);
    createdCitizenId = response.body?.data?.id;
    expect(createdCitizenId).toBeTruthy();
  });

  test("get citizen by id success", async () => {
    const response = await request(app)
      .get(`/api/admin/citizens/${createdCitizenId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(createdCitizenId);
  });

  test("update citizen success", async () => {
    const response = await request(app)
      .patch(`/api/admin/citizens/${createdCitizenId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ fullName: "Test Citizen Updated", status: "suspended", citizenshipNumber: "01-01-75-99999" });

    expect(response.status).toBe(200);
  });

  test("update citizen empty payload", async () => {
    const response = await request(app)
      .patch(`/api/admin/citizens/${createdCitizenId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(response.status).toBe(400);
  });

  test("get citizen not found", async () => {
    const response = await request(app)
      .get(`/api/admin/citizens/${new mongoose.Types.ObjectId().toString()}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });

  test("delete citizen success", async () => {
    const response = await request(app)
      .delete(`/api/admin/citizens/${createdCitizenId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  test("delete citizen not found", async () => {
    const response = await request(app)
      .delete(`/api/admin/citizens/${new mongoose.Types.ObjectId().toString()}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });

  test("admin users list success", async () => {
    const response = await request(app)
      .get("/api/admin/users?page=1&limit=5")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(Array.isArray(response.body?.data)).toBe(true);
  });
});
