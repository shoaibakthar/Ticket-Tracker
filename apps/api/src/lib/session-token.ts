import type { Context } from "hono";

import { sessionStrategyPlaceholder, type SessionResolutionSource } from "../../../../packages/auth/src/index";
import type { ApiAppContext } from "./context";

export interface SessionTokenResolution {
  readonly token: string;
  readonly source: SessionResolutionSource;
}

export function readSessionToken(context: Context<ApiAppContext>): SessionTokenResolution | null {
  const authorizationHeader = context.req.header("authorization");
  const bearerToken = readBearerToken(authorizationHeader);

  if (bearerToken) {
    return {
      token: bearerToken,
      source: "authorization-header",
    };
  }

  const cookieHeader = context.req.header("cookie");
  const cookieToken = readCookieValue(cookieHeader, sessionStrategyPlaceholder.cookieName);

  if (!cookieToken) {
    return null;
  }

  return {
    token: cookieToken,
    source: "cookie",
  };
}

export async function hashSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

function readBearerToken(headerValue: string | undefined): string | null {
  if (!headerValue) {
    return null;
  }

  const [scheme, token] = headerValue.split(/\s+/, 2);

  if (scheme !== sessionStrategyPlaceholder.authorizationScheme || !token) {
    return null;
  }

  return token;
}

function readCookieValue(headerValue: string | undefined, cookieName: string): string | null {
  if (!headerValue) {
    return null;
  }

  for (const part of headerValue.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");

    if (rawName !== cookieName || rawValue.length === 0) {
      continue;
    }

    return decodeURIComponent(rawValue.join("="));
  }

  return null;
}
