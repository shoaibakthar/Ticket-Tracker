import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { text as readText } from "node:stream/consumers";

import { loadAppRouteData } from "./data/app-loader.ts";
import { renderLoadedWebAppDocument, renderWebAppDocument } from "./index.ts";
import { resolveAppRoute } from "./routing/route-state.ts";

const defaultPort = 3000;
const port = Number.parseInt(process.env.PORT ?? `${defaultPort}`, 10) || defaultPort;
const host = process.env.HOST ?? "127.0.0.1";
const defaultWorkspaceSlug = "acme";
const stylesheetUrl = new URL("./styles/global.css", import.meta.url);
const apiBaseUrl = process.env.API_BASE_URL ?? null;
const localPreviewSessionToken = process.env.LOCAL_SESSION_TOKEN ?? "customer-token";
const localPreviewPlatformRole = process.env.LOCAL_PLATFORM_ROLE ?? null;
const ticketDetailPathPattern = /^\/workspaces\/([^/]+)\/tickets\/([^/]+)$/;

function getStatusCode(pathname: string, resolvedPathname?: string): number {
  const routeState = resolveAppRoute(resolvedPathname ?? pathname);

  switch (routeState.kind) {
    case "workspace":
    case "shared":
      return 200;
    case "not-authorized":
      return 403;
    case "not-found":
      return 404;
  }
}

function hasSessionCookie(cookieHeader: string): boolean {
  return /(?:^|;\s*)oid_session=/.test(cookieHeader);
}

function createApiProxyHeaders(request: { readonly headers: Record<string, string | undefined> }): Record<string, string> {
  const proxiedHeaders: Record<string, string> = {};
  const cookieHeader = request.headers.cookie?.trim() ?? "";
  const authorizationHeader = request.headers.authorization?.trim() ?? "";
  const platformRoleHeader = request.headers["x-observeid-platform-role"]?.trim() ?? "";

  if (authorizationHeader) {
    proxiedHeaders.authorization = authorizationHeader;
  }

  if (cookieHeader) {
    proxiedHeaders.cookie = cookieHeader;
  }

  if (platformRoleHeader) {
    proxiedHeaders["x-observeid-platform-role"] = platformRoleHeader;
  }

  if (!authorizationHeader && !hasSessionCookie(cookieHeader)) {
    proxiedHeaders.cookie = cookieHeader
      ? `${cookieHeader}; oid_session=${encodeURIComponent(localPreviewSessionToken)}`
      : `oid_session=${encodeURIComponent(localPreviewSessionToken)}`;

    if (localPreviewPlatformRole) {
      proxiedHeaders["x-observeid-platform-role"] = localPreviewPlatformRole;
    }
  }

  return proxiedHeaders;
}

async function fetchApiWithPreviewSession(
  request: { readonly headers: Record<string, string | undefined> },
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const initHeaders =
    init?.headers && !Array.isArray(init.headers)
      ? Object.fromEntries(new Headers(init.headers).entries())
      : {};

  return fetch(input, {
    ...init,
    headers: {
      ...createApiProxyHeaders(request),
      ...initHeaders,
    },
  });
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://${host}:${port}`);

  if (request.method === "POST") {
    if (!apiBaseUrl) {
      response.writeHead(501, { "content-type": "text/plain; charset=utf-8" });
      response.end("Ticket communication forms require API_BASE_URL.");
      return;
    }

    const ticketMatch = requestUrl.pathname.match(ticketDetailPathPattern);

    if (!ticketMatch) {
      response.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
      response.end("Method Not Allowed");
      return;
    }

    const workspaceSlug = ticketMatch[1] ?? "";
    const ticketId = ticketMatch[2] ?? "";

    if (!workspaceSlug || !ticketId) {
      response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
      response.end("Ticket communication routes require a workspace and ticket identifier.");
      return;
    }
    const formData = new URLSearchParams(await readText(request));
    const intent = formData.get("intent");
    const message = formData.get("message") ?? "";

    const apiPath =
      intent === "create-internal-note"
        ? `/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/tickets/${encodeURIComponent(ticketId)}/internal-notes`
        : intent === "create-customer-update"
          ? `/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/tickets/${encodeURIComponent(ticketId)}/updates`
          : null;

    if (!apiPath) {
      response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
      response.end("Unknown ticket communication action.");
      return;
    }

    const apiResponse = await fetchApiWithPreviewSession(request, `${apiBaseUrl}${apiPath}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message,
      }),
    });

    if (apiResponse.ok) {
      response.writeHead(303, {
        location: requestUrl.pathname,
      });
      response.end();
      return;
    }

    response.writeHead(apiResponse.status, {
      "content-type": "text/plain; charset=utf-8",
    });
    response.end(await apiResponse.text());
    return;
  }

  if (request.method !== "GET") {
    response.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
    response.end("Method Not Allowed");
    return;
  }

  if (requestUrl.pathname === "/") {
    response.writeHead(302, {
      location: `/workspaces/${defaultWorkspaceSlug}/overview`,
    });
    response.end();
    return;
  }

  if (requestUrl.pathname === "/styles/global.css") {
    const stylesheet = await readFile(stylesheetUrl, "utf8");
    response.writeHead(200, { "content-type": "text/css; charset=utf-8" });
    response.end(stylesheet);
    return;
  }

  const loadedData = apiBaseUrl
    ? await loadAppRouteData(requestUrl.pathname, {
        apiBaseUrl,
        fetchImpl: (input, init) => fetchApiWithPreviewSession(request, input, init),
      })
    : null;
  const html = loadedData ? renderLoadedWebAppDocument(loadedData) : renderWebAppDocument(requestUrl.pathname);

  response.writeHead(getStatusCode(requestUrl.pathname, loadedData?.routeState.pathname), {
    "content-type": "text/html; charset=utf-8",
  });
  response.end(html);
});

server.listen(port, host, () => {
  console.log(`apps/web preview running at http://${host}:${port}`);
});
