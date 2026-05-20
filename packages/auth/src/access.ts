export interface AccessCheckPlaceholder {
  readonly ready: false;
  readonly nextPhase: "auth-foundation";
}

export function createAccessCheckPlaceholder(): AccessCheckPlaceholder {
  return {
    ready: false,
    nextPhase: "auth-foundation",
  };
}
