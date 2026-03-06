import fs from "fs";
import path from "path";
import { deleteProfilePhotoFileIfExists } from "../../../services/fileStorage.service";

describe("Unit - Services - deleteProfilePhotoFileIfExists", () => {
  const unlinkMock = jest.spyOn(fs.promises, "unlink");
  const warnMock = jest.spyOn(console, "warn").mockImplementation(() => undefined);

  beforeEach(() => {
    unlinkMock.mockReset();
    warnMock.mockClear();
  });

  afterAll(() => {
    unlinkMock.mockRestore();
    warnMock.mockRestore();
  });

  test("does nothing when profile photo is undefined", async () => {
    await deleteProfilePhotoFileIfExists(undefined);

    expect(unlinkMock).not.toHaveBeenCalled();
  });

  test("does nothing for empty string", async () => {
    await deleteProfilePhotoFileIfExists("   ");

    expect(unlinkMock).not.toHaveBeenCalled();
  });

  test("ignores non-profile photos path", async () => {
    await deleteProfilePhotoFileIfExists("IssuePhotos/photo.jpg");

    expect(unlinkMock).not.toHaveBeenCalled();
  });

  test("deletes valid relative profile photo path", async () => {
    unlinkMock.mockResolvedValue(undefined);
    await deleteProfilePhotoFileIfExists("profile_photos/a.jpg");

    expect(unlinkMock).toHaveBeenCalledWith(path.join(process.cwd(), "uploads", "profile_photos/a.jpg"));
  });

  test("deletes path prefixed with /uploads", async () => {
    unlinkMock.mockResolvedValue(undefined);
    await deleteProfilePhotoFileIfExists("/uploads/profile_photos/b.jpg");

    expect(unlinkMock).toHaveBeenCalledWith(path.join(process.cwd(), "uploads", "profile_photos/b.jpg"));
  });

  test("suppresses ENOENT deletion error", async () => {
    unlinkMock.mockRejectedValue(Object.assign(new Error("not found"), { code: "ENOENT" }));
    await deleteProfilePhotoFileIfExists("profile_photos/missing.jpg");

    expect(warnMock).not.toHaveBeenCalled();
  });

  test("warns on non-ENOENT deletion error", async () => {
    unlinkMock.mockRejectedValue(Object.assign(new Error("permission denied"), { code: "EACCES" }));
    await deleteProfilePhotoFileIfExists("profile_photos/locked.jpg");

    expect(warnMock).toHaveBeenCalledTimes(1);
  });
});