import type { ReactElement } from "react";

export type PlaceholderRouteId =
  | "workspace-overview"
  | "tickets"
  | "pages"
  | "files"
  | "members"
  | "share-links"
  | "settings";

export interface PlaceholderScreenProps {
  readonly workspaceSlug: string;
}

export interface PlaceholderRouteModule {
  readonly id: PlaceholderRouteId;
  readonly pathTemplate: string;
  readonly title: string;
  readonly summary: string;
  readonly navigationLabel: string;
  readonly placeholder: true;
  readonly buildPath: (workspaceSlug: string) => string;
  readonly renderScreen: (props: PlaceholderScreenProps) => ReactElement;
}

export interface SidebarNavigationItem {
  readonly routeId: PlaceholderRouteId;
  readonly label: string;
  readonly href: string;
  readonly current: boolean;
}

export interface SidebarNavigationSection {
  readonly id: "workspace" | "collaboration" | "administration";
  readonly title: string;
  readonly items: readonly SidebarNavigationItem[];
}

export interface RenderedShellOptions {
  readonly workspaceSlug?: string;
  readonly activeRouteId?: PlaceholderRouteId;
}
