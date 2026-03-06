import { listUsers } from "../../../../controller/admin/listUsers.controller";
import { listAdminUsers } from "../../../../services/adminUser.service";

jest.mock("../../../../services/adminUser.service", () => ({
  listAdminUsers: jest.fn(),
}));

function makeRes() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe("Unit - Controller - Admin listUsers", () => {
  const listAdminUsersMock = listAdminUsers as jest.MockedFunction<typeof listAdminUsers>;

  beforeEach(() => {
    jest.clearAllMocks();
    listAdminUsersMock.mockResolvedValue({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } } as any);
  });

  test("uses default page and limit when query missing", async () => {
    const req = { query: {} } as any;
    const res = makeRes();
    const next = jest.fn();

    await listUsers(req, res as any, next);

    expect(listAdminUsersMock).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: undefined,
      role: undefined,
      tab: undefined,
      status: undefined,
    });
  });

  test("uses provided positive page and limit", async () => {
    const req = { query: { page: "3", limit: "15" } } as any;
    const res = makeRes();
    const next = jest.fn();

    await listUsers(req, res as any, next);

    expect(listAdminUsersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 3,
        limit: 15,
      })
    );
  });

  test("falls back to defaults for non-numeric page and limit", async () => {
    const req = { query: { page: "abc", limit: "def" } } as any;
    const res = makeRes();
    const next = jest.fn();

    await listUsers(req, res as any, next);

    expect(listAdminUsersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
      })
    );
  });

  test("falls back to defaults for non-positive page and limit", async () => {
    const req = { query: { page: "0", limit: "-1" } } as any;
    const res = makeRes();
    const next = jest.fn();

    await listUsers(req, res as any, next);

    expect(listAdminUsersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
      })
    );
  });

  test("passes string filters to service", async () => {
    const req = {
      query: {
        search: "ram",
        role: "authority",
        tab: "authorities",
        status: "active",
      },
    } as any;
    const res = makeRes();
    const next = jest.fn();

    await listUsers(req, res as any, next);

    expect(listAdminUsersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "ram",
        role: "authority",
        tab: "authorities",
        status: "active",
      })
    );
  });

  test("returns 200 with success/data/meta", async () => {
    const req = { query: {} } as any;
    const res = makeRes();
    const next = jest.fn();
    listAdminUsersMock.mockResolvedValue({
      data: [{ id: "u1" }],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    } as any);

    await listUsers(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [{ id: "u1" }],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("forwards service error to next", async () => {
    const req = { query: {} } as any;
    const res = makeRes();
    const next = jest.fn();
    const err = new Error("service failed");
    listAdminUsersMock.mockRejectedValue(err);

    await listUsers(req, res as any, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});