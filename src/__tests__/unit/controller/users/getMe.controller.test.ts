import { getMe } from "../../../../controller/users/getMe.controller";
import { getMyProfile } from "../../../../services/profile.service";

jest.mock("../../../../services/profile.service", () => ({
  getMyProfile: jest.fn(),
}));

function makeRes() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe("Unit - Controller - Users getMe", () => {
  const getMyProfileMock = getMyProfile as jest.MockedFunction<typeof getMyProfile>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("calls getMyProfile with auth userId and role", async () => {
    const req = { auth: { userId: "u1", role: "citizen" } } as any;
    const res = makeRes();
    const next = jest.fn();
    getMyProfileMock.mockResolvedValue({ id: "u1", fullName: "Test User" } as any);

    await getMe(req, res as any, next);

    expect(getMyProfileMock).toHaveBeenCalledWith("u1", "citizen");
  });

  test("returns 200 with user payload", async () => {
    const req = { auth: { userId: "u1", role: "citizen" } } as any;
    const res = makeRes();
    const next = jest.fn();
    getMyProfileMock.mockResolvedValue({ id: "u1", fullName: "Test User" } as any);

    await getMe(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      user: {
        id: "u1",
        fullName: "Test User",
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("forwards error to next", async () => {
    const req = { auth: { userId: "", role: "citizen" } } as any;
    const res = makeRes();
    const next = jest.fn();
    const err = new Error("unauthorized");
    getMyProfileMock.mockRejectedValue(err);

    await getMe(req, res as any, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});
