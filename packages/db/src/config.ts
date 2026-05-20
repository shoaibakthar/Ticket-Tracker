export interface DatabaseBindingPlaceholder {
  readonly kind: "cloudflare-d1";
  readonly configured: false;
}

export const databaseBindingPlaceholder: DatabaseBindingPlaceholder = {
  kind: "cloudflare-d1",
  configured: false,
};
