export interface PlaceholderRouteModule {
  readonly id:
    | "workspace-overview"
    | "tickets"
    | "pages"
    | "files"
    | "members"
    | "share-links"
    | "settings";
  readonly path: string;
  readonly title: string;
  readonly summary: string;
  readonly placeholder: true;
}

export interface SidebarNavigationItem {
  readonly routeId: PlaceholderRouteModule["id"];
  readonly label: string;
  readonly href: PlaceholderRouteModule["path"];
}

export interface SidebarNavigationSection {
  readonly id: "workspace" | "collaboration" | "administration";
  readonly title: string;
  readonly items: readonly SidebarNavigationItem[];
}
