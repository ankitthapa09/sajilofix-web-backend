import { createIssue } from "../../../controller/issues/createIssue.controller";
import { listIssues } from "../../../controller/issues/listIssues.controller";
import { HttpError } from "../../../errors/httpError";
import { ISSUE_PHOTOS_RELATIVE_DIR } from "../../../middleware/upload.middleware";
import { createIssueReport, listAllIssueReports, listIssueReports } from "../../../services/issue.service";

jest.mock("../../../services/issue.service", () => ({
  createIssueReport: jest.fn(),
  listAllIssueReports: jest.fn(),
  listIssueReports: jest.fn(),
}));

function makeRes() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe("Unit - Controller - Issues", () => {
  const createIssueReportMock = createIssueReport as jest.MockedFunction<typeof createIssueReport>;
  const listAllIssueReportsMock = listAllIssueReports as jest.MockedFunction<typeof listAllIssueReports>;
  const listIssueReportsMock = listIssueReports as jest.MockedFunction<typeof listIssueReports>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("createIssue forwards unauthorized when auth missing", async () => {
    const req = { body: { title: "Pothole" } } as any;
    const res = makeRes();
    const next = jest.fn();

    await createIssue(req, res as any, next);

    expect(createIssueReportMock).not.toHaveBeenCalled();
    const err = next.mock.calls[0][0] as HttpError;
    expect(err).toBeInstanceOf(HttpError);
    expect(err.statusCode).toBe(401);
  });

  test("createIssue maps uploaded files to photos", async () => {
    const req = {
      auth: { userId: "u1" },
      body: { title: "Pothole", photos: ["old.jpg"] },
      files: [{ filename: "a.png" }, { filename: "b.png" }],
    } as any;
    const res = makeRes();
    const next = jest.fn();
    createIssueReportMock.mockResolvedValue({ id: "i1" } as any);

    await createIssue(req, res as any, next);

    expect(createIssueReportMock).toHaveBeenCalledWith(
      {
        title: "Pothole",
        photos: [`${ISSUE_PHOTOS_RELATIVE_DIR}/a.png`, `${ISSUE_PHOTOS_RELATIVE_DIR}/b.png`],
      },
      "u1"
    );
  });

  test("createIssue keeps body photos when no files provided", async () => {
    const req = {
      auth: { userId: "u1" },
      body: { title: "Crack", photos: ["photo1.jpg"] },
      files: null,
    } as any;
    const res = makeRes();
    const next = jest.fn();
    createIssueReportMock.mockResolvedValue({ id: "i2" } as any);

    await createIssue(req, res as any, next);

    expect(createIssueReportMock).toHaveBeenCalledWith(
      {
        title: "Crack",
        photos: ["photo1.jpg"],
      },
      "u1"
    );
  });

  test("createIssue returns 201 response", async () => {
    const req = {
      auth: { userId: "u1" },
      body: { title: "Street light", photos: [] },
      files: [],
    } as any;
    const res = makeRes();
    const next = jest.fn();
    createIssueReportMock.mockResolvedValue({ id: "i3" } as any);

    await createIssue(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Issue reported successfully",
      data: { id: "i3" },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("createIssue forwards service error", async () => {
    const req = {
      auth: { userId: "u1" },
      body: { title: "Water leak" },
      files: [],
    } as any;
    const res = makeRes();
    const next = jest.fn();
    const err = new Error("create failed");
    createIssueReportMock.mockRejectedValue(err);

    await createIssue(req, res as any, next);

    expect(next).toHaveBeenCalledWith(err);
  });

  test("listIssues forwards unauthorized when user missing", async () => {
    const req = { auth: undefined, query: {} } as any;
    const res = makeRes();
    const next = jest.fn();

    await listIssues(req, res as any, next);

    expect(listIssueReportsMock).not.toHaveBeenCalled();
    expect(listAllIssueReportsMock).not.toHaveBeenCalled();
    const err = next.mock.calls[0][0] as HttpError;
    expect(err).toBeInstanceOf(HttpError);
    expect(err.statusCode).toBe(401);
  });

  test("listIssues uses listIssueReports for citizen without all scope", async () => {
    const req = { auth: { userId: "u1", role: "citizen" }, query: {} } as any;
    const res = makeRes();
    const next = jest.fn();
    listIssueReportsMock.mockResolvedValue([{ id: "i1" }] as any);

    await listIssues(req, res as any, next);

    expect(listIssueReportsMock).toHaveBeenCalledWith("u1");
    expect(listAllIssueReportsMock).not.toHaveBeenCalled();
  });

  test("listIssues uses listAllIssueReports when scope is all", async () => {
    const req = { auth: { userId: "u1", role: "citizen" }, query: { scope: "all" } } as any;
    const res = makeRes();
    const next = jest.fn();
    listAllIssueReportsMock.mockResolvedValue([{ id: "i2" }] as any);

    await listIssues(req, res as any, next);

    expect(listAllIssueReportsMock).toHaveBeenCalledTimes(1);
    expect(listIssueReportsMock).not.toHaveBeenCalled();
  });

  test("listIssues uses listAllIssueReports for authority", async () => {
    const req = { auth: { userId: "u2", role: "authority" }, query: {} } as any;
    const res = makeRes();
    const next = jest.fn();
    listAllIssueReportsMock.mockResolvedValue([{ id: "i3" }] as any);

    await listIssues(req, res as any, next);

    expect(listAllIssueReportsMock).toHaveBeenCalledTimes(1);
  });

  test("listIssues uses listAllIssueReports for admin", async () => {
    const req = { auth: { userId: "u3", role: "admin" }, query: {} } as any;
    const res = makeRes();
    const next = jest.fn();
    listAllIssueReportsMock.mockResolvedValue([{ id: "i4" }] as any);

    await listIssues(req, res as any, next);

    expect(listAllIssueReportsMock).toHaveBeenCalledTimes(1);
  });

  test("listIssues returns 200 response", async () => {
    const req = { auth: { userId: "u1", role: "citizen" }, query: {} } as any;
    const res = makeRes();
    const next = jest.fn();
    listIssueReportsMock.mockResolvedValue([{ id: "i5" }] as any);

    await listIssues(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [{ id: "i5" }],
    });
  });

  test("listIssues forwards service error", async () => {
    const req = { auth: { userId: "u1", role: "citizen" }, query: {} } as any;
    const res = makeRes();
    const next = jest.fn();
    const err = new Error("list failed");
    listIssueReportsMock.mockRejectedValue(err);

    await listIssues(req, res as any, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});