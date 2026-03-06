import { roleFromEmail } from "../../../services/roleFromEmail.service";

describe("Unit - Services - roleFromEmail", () => {
  test("returns admin for default admin email", () => {
    expect(roleFromEmail("admin@sajilofix.com")).toBe("admin");
  });

  test("matches default admin email case-insensitively with spaces", () => {
    expect(roleFromEmail("  ADMIN@SAJILOFIX.COM  ")).toBe("admin");
  });

  test("returns authority for default authority domain", () => {
    expect(roleFromEmail("officer@sajilofix.gov.np")).toBe("authority");
  });

  test("matches authority domain case-insensitively", () => {
    expect(roleFromEmail("Officer@SAJILOFIX.GOV.NP")).toBe("authority");
  });

  test("returns citizen for non-admin non-authority email", () => {
    expect(roleFromEmail("citizen@gmail.com")).toBe("citizen");
  });

  test("applies custom admin rules", () => {
    expect(
      roleFromEmail("chief@municipality.gov.np", {
        adminEmails: ["chief@municipality.gov.np"],
        authorityEmailDomains: ["gov.np"],
      })
    ).toBe("admin");
  });

  test("applies custom authority rules", () => {
    expect(
      roleFromEmail("staff@city.local", {
        adminEmails: [],
        authorityEmailDomains: ["city.local"],
      })
    ).toBe("authority");
  });
});