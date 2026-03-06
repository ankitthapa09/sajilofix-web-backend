import { login } from "../../../controller/auth/login.controller";
import { register } from "../../../controller/auth/register.controller";
import { loginUser, registerCitizen } from "../../../services/auth.service";

jest.mock("../../../services/auth.service", () => ({
  loginUser: jest.fn(),
  registerCitizen: jest.fn(),
}));

function makeRes() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe("Unit - Controller - Auth", () => {
  const loginUserMock = loginUser as jest.MockedFunction<typeof loginUser>;
  const registerCitizenMock = registerCitizen as jest.MockedFunction<typeof registerCitizen>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("login calls loginUser with request body", async () => {
    const req = { body: { email: "user@example.com", password: "Test@1234" } } as any;
    const res = makeRes();
    const next = jest.fn();
    loginUserMock.mockResolvedValue({ token: "jwt-token", user: { id: "u1", email: "user@example.com" } } as any);

    await login(req, res as any, next);

    expect(loginUserMock).toHaveBeenCalledWith(req.body);
  });

  test("login returns 200 and response payload", async () => {
    const req = { body: { email: "user@example.com", password: "Test@1234" } } as any;
    const res = makeRes();
    const next = jest.fn();
    loginUserMock.mockResolvedValue({ token: "jwt-token", user: { id: "u1", email: "user@example.com" } } as any);

    await login(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Login successful",
      token: "jwt-token",
      data: { id: "u1", email: "user@example.com" },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("login forwards error to next", async () => {
    const req = { body: { email: "user@example.com", password: "bad" } } as any;
    const res = makeRes();
    const next = jest.fn();
    const err = new Error("login failed");
    loginUserMock.mockRejectedValue(err);

    await login(req, res as any, next);

    expect(next).toHaveBeenCalledWith(err);
  });

  test("register calls registerCitizen with request body", async () => {
    const req = { body: { fullName: "Test User", email: "test@example.com" } } as any;
    const res = makeRes();
    const next = jest.fn();
    registerCitizenMock.mockResolvedValue({ user: { id: "u2", email: "test@example.com" } } as any);

    await register(req, res as any, next);

    expect(registerCitizenMock).toHaveBeenCalledWith(req.body);
  });

  test("register returns 201 and response payload", async () => {
    const req = { body: { fullName: "Test User", email: "test@example.com" } } as any;
    const res = makeRes();
    const next = jest.fn();
    registerCitizenMock.mockResolvedValue({ user: { id: "u2", email: "test@example.com" } } as any);

    await register(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Registered successfully",
      data: { id: "u2", email: "test@example.com" },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("register forwards error to next", async () => {
    const req = { body: { fullName: "Test User", email: "exists@example.com" } } as any;
    const res = makeRes();
    const next = jest.fn();
    const err = new Error("register failed");
    registerCitizenMock.mockRejectedValue(err);

    await register(req, res as any, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});