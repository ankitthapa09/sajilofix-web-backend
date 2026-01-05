import express from "express";
import { connectDatabase } from "./database/connect";
import { env } from "./config/env";
import { authRouter } from "./routes/auth.routes";
import { errorMiddleware } from "./middleware/error.middleware";

async function bootstrap() {
  await connectDatabase();

  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/auth", authRouter);

  app.use(errorMiddleware);

  app.listen(env.PORT, () => {
    
    console.log(`API listening on :${env.PORT}`);
  });
}

bootstrap().catch((err) => {

  console.error(err);
  process.exit(1);
});
