import { describe, expect, it } from "vitest";

import { appShell } from "./layout/shell";
import { placeholderRouteModules } from "./routes";

describe("web app shell scaffold", () => {
  it("includes the expected placeholder route modules", () => {
    expect(placeholderRouteModules.map((route) => route.id)).toEqual([
      "workspace-overview",
      "tickets",
      "pages",
      "files",
      "members",
      "share-links",
      "settings",
    ]);
  });

  it("exposes sidebar sections for workspace navigation", () => {
    expect(appShell.sidebar.map((section) => section.id)).toEqual([
      "workspace",
      "collaboration",
      "administration",
    ]);
  });
});
