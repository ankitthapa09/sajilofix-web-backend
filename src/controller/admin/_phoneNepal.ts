import { HttpError } from "../../errors/httpError";

export function normalizeNepalPhone(phoneRaw: string) {
  const raw = phoneRaw.trim();

  if (/^\d{10}$/.test(raw)) {
    return {
      phoneCountryCode: "+977",
      phoneNationalNumber: raw,
      phoneE164: `+977${raw}`,
    };
  }

  if (/^\+977\d{10}$/.test(raw)) {
    return {
      phoneCountryCode: "+977",
      phoneNationalNumber: raw.slice(4),
      phoneE164: raw,
    };
  }

  throw new HttpError(400, "Phone number must be 10 digits or +977 followed by 10 digits");
}
