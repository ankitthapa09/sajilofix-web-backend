import mongoose from "mongoose";
import { connectDatabase } from "../database/connect";

jest.setTimeout(30000);

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await mongoose.connection.close();
});
