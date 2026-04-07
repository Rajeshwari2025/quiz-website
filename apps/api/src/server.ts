import http from "node:http";
import { env } from "./config/env";
import { createApp } from "./app";
import { createSocketServer } from "./lib/socket";

async function bootstrap() {
  const app = await createApp();
  const server = http.createServer(app);
  createSocketServer(server);

  server.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
