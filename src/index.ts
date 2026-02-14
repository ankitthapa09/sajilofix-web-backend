import { connectDatabase } from "./database/connect";
import { env } from "./config/env";
import app from "./app";

async function bootstrap() {
  await connectDatabase();

  app.listen(env.PORT, () => {
    
    console.log(`API listening on :${env.PORT}`);
  });
}

bootstrap().catch((err) => {

  console.error(err);
  process.exit(1);
});
