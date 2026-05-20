import type { ReactElement } from "react";

import { ScreenPlaceholder } from "../components/screen-placeholder.ts";
import type { PlaceholderRouteModule, PlaceholderScreenProps } from "../navigation/types.ts";

function renderFilesScreen({ workspaceSlug }: PlaceholderScreenProps): ReactElement {
  return ScreenPlaceholder({
    workspaceSlug,
    routePath: `/workspaces/${workspaceSlug}/files`,
    title: "Files",
    description: "A simple file and attachment surface that stays intentionally lightweight for MVP.",
    primaryActionLabel: "Upload File",
    bodyTitle: "Files list shell",
    bodyDescription: "This placeholder keeps file metadata, attachment listings, and permission-aware actions in a single workspace-scoped surface.",
  });
}

export const filesRoute: PlaceholderRouteModule = {
  id: "files",
  pathTemplate: "/workspaces/:workspaceSlug/files",
  title: "Files",
  summary: "List workspace files and attachments with space for permission-aware actions later.",
  navigationLabel: "Files",
  placeholder: true,
  buildPath: (workspaceSlug) => `/workspaces/${workspaceSlug}/files`,
  renderScreen: renderFilesScreen,
};
