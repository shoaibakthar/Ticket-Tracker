import { Hono } from "hono";

import type { ApiAppContext } from "./lib/context";
import { validateEnv } from "./middleware/validate-env";
import { resolveRequestSessionContext } from "./middleware/resolve-request-session";
import { registerRoutes } from "./routes";

const app = new Hono<ApiAppContext>();

app.use("*", validateEnv);
app.use("/api/v1/*", resolveRequestSessionContext);
registerRoutes(app);

export default app;
