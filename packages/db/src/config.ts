export interface DatabaseBindingPlaceholder {
  readonly kind: "cloudflare-d1";
  readonly configured: false;
}

export const databaseBindingPlaceholder: DatabaseBindingPlaceholder = {
  kind: "cloudflare-d1",
  configured: false,
};

export const databaseConfigPlaceholder = {
  dialect: "sqlite",
  driver: "cloudflare-d1",
  runtime: "cloudflare-workers",
  migrationDirectory: "packages/db/migrations",
  sessionModel: "hybrid-friendly-placeholder",
} as const;
