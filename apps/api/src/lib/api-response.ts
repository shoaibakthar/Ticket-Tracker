import type { Context } from "hono";

import type { ApiAppContext } from "./context";

export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation_error"
  | "conflict"
  | "internal_error";

export function respondWithError(
  context: Context<ApiAppContext>,
  status: 400 | 401 | 403 | 404 | 409 | 500,
  code: ApiErrorCode,
  message: string,
) {
  return context.json(
    {
      error: {
        code,
        message,
      },
    },
    status,
  );
}
