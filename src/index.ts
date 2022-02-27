import { json } from "body-parser";
import express from "express";
import expressValidator from 'express-validator';

import { getEnv } from "./core/infrastructure/env";
import { initializeDI } from "./core/services/dependency-injection";
import { apiRouter } from "./routes/router";

export async function app() {
  const server = express();

  initializeDI(getEnv(process.env));

  server.use(expressValidator());
  server.use(json({ limit: "10kb" }));

  server.use("/api", apiRouter());
  server.use("/api", function (req: any, res: any, next: any) {
    next(
      JSON.stringify({
        error: {},
        message: `Api endpoint not found: /api${req.url}`,
      })
    );
  });

  return server;
}

async function run() {
  const port = process.env.PORT || 3000;
  const myapp = await app();

  // Start up the Node server in dev
  myapp.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

(async () => await run())();
