import mongoose from "mongoose";
import { connectDatabase } from "../database/connect";

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await mongoose.connection.close();
});
