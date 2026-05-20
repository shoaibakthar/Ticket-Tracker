import { appShell } from "./layout/shell";
import { overviewRoute } from "./routes/overview";
import { ticketsRoute } from "./routes/tickets";

export const webAppScaffold = {
  appShell,
  routes: [overviewRoute, ticketsRoute],
  stylesEntry: "src/styles/global.css",
} as const;
