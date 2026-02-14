import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../../app";
import {
  AdminUserModel,
  AuthorityUserModel,
  CitizenUserModel,
} from "../../models/userCollections.model";

describe("Admin CRUD Integration Tests", () => {
  const adminUser = {
    fullName: "Admin Test",
    email: "admin@sajilofix.com",
    password: "Admin@1234",
    phone: "9800000001",
    phoneCountryCode: "+977",
    phoneNationalNumber: "9800000001",
    phoneE164: "+9779800000001",
    wardNumber: "1",
    municipality: "Kathmandu",
    role: "admin" as const,
    status: "active" as const,
  };

  const authorityPayload = {
    fullName: "Authority Test",
    email: "authority1@sajilofix.gov.np",
    password: "Auth@1234",
    phone: "9800000002",
    wardNumber: "2",
    municipality: "Lalitpur",
    department: "Road Department",
    status: "active" as const,
  };

  const citizenPayload = {
    fullName: "Citizen Test",
    email: "citizen1@gmail.com",
    password: "Citizen@1234",
    phone: "9800000003",
    wardNumber: "3",
    municipality: "Bhaktapur",
    status: "active" as const,
  };

  let token = "";
  let authorityId = "";
  let citizenId = "";

  beforeAll(async () => {
    await Promise.all([
      AdminUserModel.deleteOne({ email: adminUser.email }),
      AuthorityUserModel.deleteOne({ email: authorityPayload.email }),
      CitizenUserModel.deleteOne({ email: citizenPayload.email }),
    ]);

    const passwordHash = await bcrypt.hash(adminUser.password, 10);
    await AdminUserModel.create({
      fullName: adminUser.fullName,
      email: adminUser.email,
      phone: adminUser.phone,
      phoneCountryCode: adminUser.phoneCountryCode,
      phoneNationalNumber: adminUser.phoneNationalNumber,
      phoneE164: adminUser.phoneE164,
      wardNumber: adminUser.wardNumber,
      municipality: adminUser.municipality,
      passwordHash,
      role: adminUser.role,
      status: adminUser.status,
    });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: adminUser.email,
      password: adminUser.password,
    });

    token = loginResponse.body?.token ?? "";
  });

  afterAll(async () => {
    await Promise.all([
      AdminUserModel.deleteOne({ email: adminUser.email }),
      AuthorityUserModel.deleteOne({ email: authorityPayload.email }),
      CitizenUserModel.deleteOne({ email: citizenPayload.email }),
    ]);
  });

  test("should login admin for tests", () => {
    expect(token).toBeTruthy();
  });

  test("should create authority", async () => {
    const response = await request(app)
      .post("/api/admin/authorities")
      .set("Authorization", `Bearer ${token}`)
      .send(authorityPayload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("message", "Authority account created");
    expect(response.body?.data?.id).toBeTruthy();
    authorityId = response.body.data.id;
  });

  test("should get authority by id", async () => {
    const response = await request(app)
      .get(`/api/admin/authorities/${authorityId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(authorityId);
    expect(response.body?.data?.role).toBe("authority");
  });

  test("should update authority", async () => {
    const response = await request(app)
      .patch(`/api/admin/authorities/${authorityId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ fullName: "Authority Updated", department: "Traffic" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Authority updated");
  });

  test("should delete authority", async () => {
    const response = await request(app)
      .delete(`/api/admin/authorities/${authorityId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Authority deleted");
  });

  test("should create citizen", async () => {
    const response = await request(app)
      .post("/api/admin/citizens")
      .set("Authorization", `Bearer ${token}`)
      .send(citizenPayload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("message", "Citizen account created");
    expect(response.body?.data?.id).toBeTruthy();
    citizenId = response.body.data.id;
  });

  test("should get citizen by id", async () => {
    const response = await request(app)
      .get(`/api/admin/citizens/${citizenId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(citizenId);
    expect(response.body?.data?.role).toBe("citizen");
  });

  test("should update citizen", async () => {
    const response = await request(app)
      .patch(`/api/admin/citizens/${citizenId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ fullName: "Citizen Updated", status: "suspended" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Citizen updated");
  });

  test("should delete citizen", async () => {
    const response = await request(app)
      .delete(`/api/admin/citizens/${citizenId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Citizen deleted");
  });
});
