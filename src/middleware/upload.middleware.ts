import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import type { Request } from "express";
import { HttpError } from "../errors/httpError";

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
const PROFILE_PHOTOS_DIR = path.join(UPLOADS_ROOT, "profile_photos");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      ensureDir(PROFILE_PHOTOS_DIR);
      cb(null, PROFILE_PHOTOS_DIR);
    } catch (err) {
      cb(err as Error, PROFILE_PHOTOS_DIR);
    }
  },
  filename: (req: Request, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = ext && ext.length <= 10 ? ext : "";
    const userPart = (req.auth?.userId ?? "anon").replace(/[^a-zA-Z0-9_-]/g, "_");
    const name = `${userPart}-${Date.now()}-${crypto.randomUUID()}${safeExt}`;
    cb(null, name);
  },
});

export const profilePhotoUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new HttpError(400, "Only image uploads are allowed"));
    }
    return cb(null, true);
  },
});

export const PROFILE_PHOTO_RELATIVE_DIR = "profile_photos";
