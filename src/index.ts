import express from "express";
import path from "path";
import { connectDatabase } from "./database/connect";
import { env } from "./config/env";
import { authRouter } from "./routes/auth.routes";
import { userRouter } from "./routes/user.routes";
import { adminRouter } from "./routes/admin.routes";
import { errorMiddleware } from "./middleware/error.middleware";

async function bootstrap() {
  await connectDatabase();

  const app = express();
  app.use(express.json());


  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/admin", adminRouter);

  app.use(errorMiddleware);

  app.listen(env.PORT, () => {
    
    console.log(`API listening on :${env.PORT}`);
  });
}

bootstrap().catch((err) => {

  console.error(err);
  process.exit(1);
});
