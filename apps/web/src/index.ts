import { appShell } from "./layout/shell";
import { placeholderRouteModules } from "./routes";

export const webAppScaffold = {
  appShell,
  routes: placeholderRouteModules,
  stylesEntry: "src/styles/global.css",
} as const;
