import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../../../app";
import { CitizenUserModel } from "../../../models/userCollections.model";
import { makeAuthorityEmail, makeEmail, makePhone } from "../../helpers/test.util";

type RegisterPayload = {
  fullName?: string;
  email?: string;
  phone?: string;
  phoneCountryCode?: string;
  phoneNationalNumber?: string;
  wardNumber?: string;
  municipality?: string;
  district?: string;
  tole?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: boolean;
  roleIndex?: number;
};

describe("Integration - Auth - Register and Login Tests", () => {
  const authCitizenEmail = makeEmail("test-citizen-login");
  const authCitizenPhone = makePhone(1);
  const authCitizenPassword = "Test@1234";

  const registerSuccessEmailA = makeEmail("test-register-a");
  const registerSuccessEmailB = makeEmail("test-register-b");
  const registerSuccessPhoneA = makePhone(2);
  const registerSuccessPhoneB = makePhone(3);

  const baseRegisterPayload: RegisterPayload = {
    fullName: "Test Citizen",
    email: makeEmail("test-temp"),
    phone: makePhone(10),
    wardNumber: "5",
    municipality: "Kathmandu",
    district: "Kathmandu",
    tole: "Baneshwor",
    password: "Test@1234",
    confirmPassword: "Test@1234",
    agreeToTerms: true,
  };

  beforeAll(async () => {
    await CitizenUserModel.deleteMany({
      email: {
        $in: [authCitizenEmail, registerSuccessEmailA, registerSuccessEmailB],
      },
    });

    const passwordHash = await bcrypt.hash(authCitizenPassword, 10);
    await CitizenUserModel.create({
      fullName: "Test Login User",
      email: authCitizenEmail,
      phone: `+977${authCitizenPhone}`,
      phoneCountryCode: "+977",
      phoneNationalNumber: authCitizenPhone,
      phoneE164: `+977${authCitizenPhone}`,
      wardNumber: "4",
      municipality: "Kathmandu",
      passwordHash,
      role: "citizen",
      status: "active",
    });
  });

  afterAll(async () => {
    await CitizenUserModel.deleteMany({
      email: {
        $in: [authCitizenEmail, registerSuccessEmailA, registerSuccessEmailB],
      },
    });
  });

  const invalidRegisterCases: Array<{ name: string; payload: RegisterPayload; expectedStatus: number }> = [
    {
      name: "missing full name",
      payload: { ...baseRegisterPayload, email: makeEmail("reg-missing-name"), fullName: "" },
      expectedStatus: 400,
    },
    {
      name: "invalid email format",
      payload: { ...baseRegisterPayload, email: "invalid-email" },
      expectedStatus: 400,
    },
    {
      name: "missing municipality",
      payload: { ...baseRegisterPayload, email: makeEmail("reg-no-muni"), municipality: "" },
      expectedStatus: 400,
    },
    {
      name: "missing ward number",
      payload: { ...baseRegisterPayload, email: makeEmail("reg-no-ward"), wardNumber: "" },
      expectedStatus: 400,
    },
    {
      name: "missing phone and phone parts",
      payload: {
        ...baseRegisterPayload,
        email: makeEmail("reg-no-phone"),
        phone: undefined,
        phoneCountryCode: undefined,
        phoneNationalNumber: undefined,
      },
      expectedStatus: 400,
    },
    {
      name: "password mismatch",
      payload: {
        ...baseRegisterPayload,
        email: makeEmail("reg-pass-mismatch"),
        confirmPassword: "Different@123",
      },
      expectedStatus: 400,
    },
    {
      name: "terms not agreed",
      payload: {
        ...baseRegisterPayload,
        email: makeEmail("reg-no-terms"),
        agreeToTerms: false,
      },
      expectedStatus: 400,
    },
    {
      name: "authority email self-register forbidden",
      payload: {
        ...baseRegisterPayload,
        email: makeAuthorityEmail("reg-authority-forbidden"),
      },
      expectedStatus: 403,
    },
  ];

  test.each(invalidRegisterCases)("POST /api/auth/register -> $name", async ({ payload, expectedStatus }) => {
    const response = await request(app).post("/api/auth/register").send(payload);
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty("message");
  });

  test("register success with raw phone", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        ...baseRegisterPayload,
        email: registerSuccessEmailA,
        phone: registerSuccessPhoneA,
        phoneCountryCode: undefined,
        phoneNationalNumber: undefined,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("success", true);
  });

  test("register success with phone parts", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        ...baseRegisterPayload,
        email: registerSuccessEmailB,
        phone: undefined,
        phoneCountryCode: "+977",
        phoneNationalNumber: registerSuccessPhoneB,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("success", true);
  });

  test("register duplicate email conflict", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        ...baseRegisterPayload,
        email: registerSuccessEmailA,
        phone: makePhone(30),
      });

    expect(response.status).toBe(409);
  });

  test("register duplicate phone conflict", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        ...baseRegisterPayload,
        email: makeEmail("reg-dup-phone"),
        phone: registerSuccessPhoneA,
      });

    expect(response.status).toBe(409);
  });

  const invalidLoginCases: Array<{ name: string; payload: Record<string, unknown> }> = [
    { name: "missing email", payload: { password: "Test@1234" } },
    { name: "invalid email", payload: { email: "bad-email", password: "Test@1234" } },
    { name: "missing password", payload: { email: authCitizenEmail } },
  ];

  test.each(invalidLoginCases)("POST /api/auth/login invalid -> $name", async ({ payload }) => {
    const response = await request(app).post("/api/auth/login").send(payload);
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  test("login with unknown email", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: makeEmail("unknown-login"), password: "Test@1234" });
    expect(response.status).toBe(401);
  });

  test("login with wrong password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: authCitizenEmail, password: "Wrong@1234" });
    expect(response.status).toBe(401);
  });

  test("login success", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: authCitizenEmail, password: authCitizenPassword });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
  });

  test("login accepts optional userType", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: authCitizenEmail, password: authCitizenPassword, userType: "citizen" });
    expect(response.status).toBe(200);
  });
});
