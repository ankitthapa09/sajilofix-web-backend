import { listNotificationsController } from "../../../../controller/notifications/listNotifications.controller";
import { HttpError } from "../../../../errors/httpError";
import { listMyNotifications } from "../../../../services/notification.service";

jest.mock("../../../../services/notification.service", () => ({
  listMyNotifications: jest.fn(),
}));

function makeRes() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe("Unit - Controller - Notifications list", () => {
  const listMyNotificationsMock = listMyNotifications as jest.MockedFunction<typeof listMyNotifications>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("forwards unauthorized when user is missing", async () => {
    const req = { auth: undefined, query: {} } as any;
    const res = makeRes();
    const next = jest.fn();

    await listNotificationsController(req, res as any, next);

    expect(listMyNotificationsMock).not.toHaveBeenCalled();
    const err = next.mock.calls[0][0] as HttpError;
    expect(err).toBeInstanceOf(HttpError);
    expect(err.statusCode).toBe(401);
  });

  test("calls service with user id and query options", async () => {
    const req = {
      auth: { userId: "u1" },
      query: { page: "2", limit: "20", isRead: "true" },
    } as any;
    const res = makeRes();
    const next = jest.fn();
    listMyNotificationsMock.mockResolvedValue({ items: [] } as any);

    await listNotificationsController(req, res as any, next);

    expect(listMyNotificationsMock).toHaveBeenCalledWith("u1", {
      page: "2",
      limit: "20",
      isRead: "true",
    });
  });

  test("returns 200 with success and data", async () => {
    const req = { auth: { userId: "u1" }, query: {} } as any;
    const res = makeRes();
    const next = jest.fn();
    listMyNotificationsMock.mockResolvedValue({ items: [{ id: "n1" }] } as any);

    await listNotificationsController(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { items: [{ id: "n1" }] },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("forwards service error to next", async () => {
    const req = { auth: { userId: "u1" }, query: {} } as any;
    const res = makeRes();
    const next = jest.fn();
    const err = new Error("notification failed");
    listMyNotificationsMock.mockRejectedValue(err);

    await listNotificationsController(req, res as any, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});