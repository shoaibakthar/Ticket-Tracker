import { Hono } from "hono";

import { validateEnv } from "./middleware/validate-env";
import { registerRoutes } from "./routes";
import type { ApiEnv } from "./lib/env";

const app = new Hono<{ Bindings: ApiEnv }>();

app.use("*", validateEnv);
registerRoutes(app);

export default app;
