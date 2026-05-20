import { filesRoute } from "./files";
import { membersRoute } from "./members";
import { overviewRoute } from "./overview";
import { pagesRoute } from "./pages";
import { settingsRoute } from "./settings";
import { shareLinksRoute } from "./share-links";
import { ticketsRoute } from "./tickets";

export const placeholderRouteModules = [
  overviewRoute,
  ticketsRoute,
  pagesRoute,
  filesRoute,
  membersRoute,
  shareLinksRoute,
  settingsRoute,
] as const;
