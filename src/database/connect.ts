import mongoose from "mongoose";
import { env } from "../config/env";

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(env.MONGO_URI);

  console.log("MongoDB connected");
}
