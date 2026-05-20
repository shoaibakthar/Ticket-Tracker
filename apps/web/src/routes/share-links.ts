import type { ReactElement } from "react";

import { ScreenPlaceholder } from "../components/screen-placeholder.ts";
import type { PlaceholderRouteModule, PlaceholderScreenProps } from "../navigation/types.ts";

function renderShareLinksScreen({ workspaceSlug }: PlaceholderScreenProps): ReactElement {
  return ScreenPlaceholder({
    workspaceSlug,
    routePath: `/workspaces/${workspaceSlug}/share-links`,
    title: "Share Links",
    description: "A deliberate, high-trust management surface for scoped, read-only sharing.",
    primaryActionLabel: "Create Share Link",
    bodyTitle: "Share link management shell",
    bodyDescription: "This area will later emphasize resource scope, read-only defaults, expiration, and revocation without casual or misleading interactions.",
  });
}

export const shareLinksRoute: PlaceholderRouteModule = {
  id: "share-links",
  pathTemplate: "/workspaces/:workspaceSlug/share-links",
  title: "Share Links",
  summary: "Manage controlled share links with clear read-only and revocation intent.",
  navigationLabel: "Share Links",
  placeholder: true,
  buildPath: (workspaceSlug) => `/workspaces/${workspaceSlug}/share-links`,
  renderScreen: renderShareLinksScreen,
};
