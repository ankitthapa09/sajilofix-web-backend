import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../errors/httpError";
import { reverseGeocodeCoordinates } from "../../services/geocoding.service";

export async function reverseGeocode(req: Request, res: Response, next: NextFunction) {
  try {
    const latRaw = String(req.query.lat ?? "").trim();
    const lngRaw = String(req.query.lng ?? "").trim();

    const latitude = Number(latRaw);
    const longitude = Number(lngRaw);

    if (!latRaw || !lngRaw || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new HttpError(400, "lat and lng query params are required");
    }

    const data = await reverseGeocodeCoordinates(latitude, longitude);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
}
