import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../errors/httpError";
import { searchLocationsInNepal } from "../../services/geocoding.service";

export async function searchLocations(req: Request, res: Response, next: NextFunction) {
  try {
    const qRaw = String(req.query.q ?? "").trim();
    const limitRaw = String(req.query.limit ?? "").trim();
    const limit = limitRaw ? Number(limitRaw) : 6;

    if (!qRaw) {
      throw new HttpError(400, "q query param is required");
    }

    if (!Number.isFinite(limit) || limit <= 0) {
      throw new HttpError(400, "limit must be a positive number");
    }

    const data = await searchLocationsInNepal(qRaw, limit);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
}
