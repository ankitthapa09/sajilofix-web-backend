import { HttpError } from "../errors/httpError";

const NEPAL_BOUNDS = {
  minLat: 26.347,
  maxLat: 30.447,
  minLng: 80.058,
  maxLng: 88.201,
};

type ReverseGeoAddress = {
  address: string;
  district?: string;
  municipality?: string;
  ward?: string;
  landmark?: string;
  latitude: number;
  longitude: number;
};

type NominatimResponse = {
  display_name?: string;
  address?: {
    ward?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city_district?: string;
    municipality?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state_district?: string;
    state?: string;
    amenity?: string;
    building?: string;
  };
};

type NominatimSearchResponseItem = {
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: NominatimResponse["address"];
};

function extractWard(value?: string) {
  if (!value) return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;

  if (/^\d{1,3}$/.test(normalized)) {
    return normalized;
  }

  const patterns = [
    /\b(?:ward|wd|wada|woda|वडा)\s*(?:no\.?|number|नं\.?)?\s*[-:]?\s*(\d{1,3})\b/i,
    /\b(\d{1,3})\s*(?:st|nd|rd|th)?\s*(?:ward|wd|wada|वडा)\b/i,
    /(?:^|[\s,])[A-Za-z\u0900-\u097F.'’]+\s*[-–]\s*(\d{1,3})\b/u,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) return match[1];
  }

  return undefined;
}

function normalizeLocationFromNominatim(lat: number, lng: number, data: NominatimResponse): ReverseGeoAddress {
  const addressObj = data.address ?? {};

  const municipality = addressObj.municipality || addressObj.city || addressObj.town || addressObj.village;
  const district = addressObj.state_district || addressObj.county || addressObj.city_district || addressObj.state;
  const ward =
    extractWard(addressObj.ward) ||
    extractWard(addressObj.city_district) ||
    extractWard(addressObj.suburb) ||
    extractWard(addressObj.neighbourhood) ||
    extractWard(data.display_name);
  const landmark = addressObj.amenity || addressObj.building || addressObj.neighbourhood || addressObj.suburb;

  const conciseAddress = [addressObj.road, addressObj.neighbourhood || addressObj.suburb, municipality, district]
    .filter(Boolean)
    .join(", ");

  return {
    address: conciseAddress || data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    district: district || undefined,
    municipality: municipality || undefined,
    ward: ward || undefined,
    landmark: landmark || undefined,
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lng.toFixed(6)),
  };
}

export async function reverseGeocodeCoordinates(latitude: number, longitude: number): Promise<ReverseGeoAddress> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new HttpError(400, "Invalid coordinates");
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new HttpError(400, "Coordinates out of range");
  }

  if (
    latitude < NEPAL_BOUNDS.minLat ||
    latitude > NEPAL_BOUNDS.maxLat ||
    longitude < NEPAL_BOUNDS.minLng ||
    longitude > NEPAL_BOUNDS.maxLng
  ) {
    throw new HttpError(400, "Coordinates must be within Nepal");
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "SajiloFix-Web/1.0",
      "Accept-Language": "en",
    },
  });

  if (!response.ok) {
    throw new HttpError(502, "Geocoding service unavailable");
  }

  const payload = (await response.json()) as NominatimResponse;
  return normalizeLocationFromNominatim(latitude, longitude, payload);
}

export async function searchLocationsInNepal(query: string, limit = 6): Promise<ReverseGeoAddress[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) {
    throw new HttpError(400, "Search query must be at least 2 characters");
  }

  const boundedLimit = Math.min(Math.max(1, limit), 10);
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", normalizedQuery);
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "np");
  url.searchParams.set("limit", String(boundedLimit));

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "SajiloFix-Web/1.0",
      "Accept-Language": "en",
    },
  });

  if (!response.ok) {
    throw new HttpError(502, "Location search service unavailable");
  }

  const payload = (await response.json()) as NominatimSearchResponseItem[];
  const seen = new Set<string>();

  return payload
    .map((item) => {
      const latitude = Number(item.lat ?? "");
      const longitude = Number(item.lon ?? "");
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      if (
        latitude < NEPAL_BOUNDS.minLat ||
        latitude > NEPAL_BOUNDS.maxLat ||
        longitude < NEPAL_BOUNDS.minLng ||
        longitude > NEPAL_BOUNDS.maxLng
      ) {
        return null;
      }

      const key = `${latitude.toFixed(5)}:${longitude.toFixed(5)}`;
      if (seen.has(key)) return null;
      seen.add(key);

      return normalizeLocationFromNominatim(latitude, longitude, {
        display_name: item.display_name,
        address: item.address,
      });
    })
    .filter((item): item is ReverseGeoAddress => item !== null);
}
