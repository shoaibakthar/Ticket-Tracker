import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { text as readText } from "node:stream/consumers";

import { loadAppRouteData } from "./data/app-loader.ts";
import { renderLoadedWebAppDocument, renderWebAppDocument } from "./index.ts";
import type {
  TicketCommunicationIntent,
  TicketCommunicationSubmissionState,
  TicketFieldEditDraft,
  TicketFieldEditSubmissionState,
} from "./navigation/types.ts";
import { resolveAppRoute } from "./routing/route-state.ts";

const defaultPort = 3000;
const port = Number.parseInt(process.env.PORT ?? `${defaultPort}`, 10) || defaultPort;
const host = process.env.HOST ?? "127.0.0.1";
const stylesheetUrl = new URL("./styles/global.css", import.meta.url);
const apiBaseUrl = process.env.API_BASE_URL ?? null;
const localPreviewSessionToken = process.env.LOCAL_SESSION_TOKEN ?? "customer-token";
const localPreviewPlatformRole = process.env.LOCAL_PLATFORM_ROLE ?? null;
const ticketDetailPathPattern = /^\/workspaces\/([^/]+)\/tickets\/([^/]+)$/;
const ticketFieldDatePattern = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/;

function getStatusCode(pathname: string, resolvedPathname?: string): number {
  const routeState = resolveAppRoute(resolvedPathname ?? pathname);

  switch (routeState.kind) {
    case "marketing":
      return 200;
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

function createApiProxyHeaders(request: {
  readonly headers: Record<string, string | undefined>;
}): Record<string, string> {
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

function isTicketCommunicationIntent(value: string | null): value is TicketCommunicationIntent {
  return value === "create-customer-update" || value === "create-internal-note";
}

function isTicketFieldEditIntent(value: string | null): value is "update-ticket-fields" {
  return value === "update-ticket-fields";
}

function validateTicketCommunicationMessage(message: string): string | null {
  const trimmedMessage = message.trim();

  if (trimmedMessage.length === 0) {
    return "A message is required.";
  }

  if (trimmedMessage.length > 4_000) {
    return "Messages must stay under 4,000 characters.";
  }

  return null;
}

function validateTicketFieldDraft(draft: TicketFieldEditDraft): string | null {
  if (draft.status !== undefined && draft.status.trim().length === 0) {
    return "Select a valid ticket status.";
  }

  if (draft.priority !== undefined && draft.priority.trim().length === 0) {
    return "Select a valid ticket priority.";
  }

  if (
    draft.dueDate !== undefined &&
    draft.dueDate.trim().length > 0 &&
    !ticketFieldDatePattern.test(draft.dueDate.trim())
  ) {
    return "Provide a valid due date.";
  }

  return null;
}

function readTicketCommunicationSuccess(
  searchParams: URLSearchParams,
): TicketCommunicationSubmissionState | null {
  const submission = searchParams.get("submission");
  const intent = searchParams.get("intent");

  if (submission !== "success" || !isTicketCommunicationIntent(intent)) {
    return null;
  }

  return {
    intent,
    status: "success",
    message: intent === "create-customer-update" ? "Customer update posted." : "Internal note saved.",
    draftMessage: "",
  };
}

function readTicketFieldEditSuccess(
  searchParams: URLSearchParams,
): TicketFieldEditSubmissionState | null {
  const submission = searchParams.get("submission");
  const intent = searchParams.get("intent");

  if (submission !== "success" || !isTicketFieldEditIntent(intent)) {
    return null;
  }

  return {
    intent,
    status: "success",
    message: "Ticket details updated.",
    draft: null,
  };
}

async function renderTicketDetailSubmissionPage(options: {
  readonly request: { readonly headers: Record<string, string | undefined> };
  readonly response: {
    writeHead(statusCode: number, headers?: Record<string, string>): unknown;
    end(chunk?: string): void;
  };
  readonly requestUrl: URL;
  readonly ticketCommunicationSubmission?: TicketCommunicationSubmissionState | null;
  readonly ticketFieldEditSubmission?: TicketFieldEditSubmissionState | null;
  readonly statusCode: number;
}): Promise<void> {
  if (!apiBaseUrl) {
    options.response.writeHead(501, { "content-type": "text/plain; charset=utf-8" });
    options.response.end("Ticket detail forms require API_BASE_URL.");
    return;
  }

  const loadedData = await loadAppRouteData(options.requestUrl.pathname, {
    apiBaseUrl,
    fetchImpl: (input, init) => fetchApiWithPreviewSession(options.request, input, init),
    ticketCommunicationSubmission: options.ticketCommunicationSubmission ?? null,
    ticketFieldEditSubmission: options.ticketFieldEditSubmission ?? null,
  });

  options.response.writeHead(options.statusCode, {
    "content-type": "text/html; charset=utf-8",
  });
  options.response.end(renderLoadedWebAppDocument(loadedData));
}

async function readApiErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  const bodyText = await response.text();

  if (!bodyText.trim()) {
    return fallbackMessage;
  }

  try {
    const parsed = JSON.parse(bodyText) as { error?: { message?: unknown } };

    if (typeof parsed.error?.message === "string" && parsed.error.message.trim()) {
      return parsed.error.message;
    }
  } catch {
    // Keep the plain-text body when the response is not valid JSON.
  }

  return bodyText.trim() || fallbackMessage;
}

async function proxyApiGetRequest(options: {
  readonly request: { readonly headers: Record<string, string | undefined> };
  readonly response: {
    writeHead(statusCode: number, headers?: Record<string, string>): unknown;
    end(chunk?: string | Uint8Array): void;
  };
  readonly requestUrl: URL;
}): Promise<void> {
  if (!apiBaseUrl) {
    options.response.writeHead(501, { "content-type": "text/plain; charset=utf-8" });
    options.response.end("API proxy routes require API_BASE_URL.");
    return;
  }

  try {
    const apiResponse = await fetchApiWithPreviewSession(
      options.request,
      `${apiBaseUrl}${options.requestUrl.pathname}${options.requestUrl.search}`,
    );
    const proxiedHeaders = Object.fromEntries(apiResponse.headers.entries());
    const body = new Uint8Array(await apiResponse.arrayBuffer());

    options.response.writeHead(apiResponse.status, proxiedHeaders);
    options.response.end(body);
  } catch {
    options.response.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    options.response.end("Unable to reach API.");
  }
}

function readTicketFieldDraft(formData: URLSearchParams): TicketFieldEditDraft {
  return {
    ...(formData.has("status") ? { status: formData.get("status") ?? "" } : {}),
    ...(formData.has("priority") ? { priority: formData.get("priority") ?? "" } : {}),
    ...(formData.has("assigneeMemberId")
      ? { assigneeMemberId: formData.get("assigneeMemberId") ?? "" }
      : {}),
    ...(formData.has("dueDate") ? { dueDate: formData.get("dueDate") ?? "" } : {}),
  };
}

function buildTicketFieldPatchBody(draft: TicketFieldEditDraft): Record<string, string | null> {
  const body: Record<string, string | null> = {};

  if (draft.status !== undefined) {
    body.status = draft.status;
  }

  if (draft.priority !== undefined) {
    body.priority = draft.priority;
  }

  if (draft.assigneeMemberId !== undefined) {
    body.assigneeMemberId = draft.assigneeMemberId || null;
  }

  if (draft.dueDate !== undefined) {
    body.dueDate = draft.dueDate || null;
  }

  return body;
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", `http://${host}:${port}`);

    if (request.method === "POST") {
    if (!apiBaseUrl) {
      response.writeHead(501, { "content-type": "text/plain; charset=utf-8" });
      response.end("Ticket detail forms require API_BASE_URL.");
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
      response.end("Ticket detail routes require a workspace and ticket identifier.");
      return;
    }

    const formData = new URLSearchParams(await readText(request));
    const intent = formData.get("intent");

    if (isTicketCommunicationIntent(intent)) {
      const message = formData.get("message") ?? "";
      const apiPath =
        intent === "create-internal-note"
          ? `/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/tickets/${encodeURIComponent(ticketId)}/internal-notes`
          : `/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/tickets/${encodeURIComponent(ticketId)}/updates`;
      const validationError = validateTicketCommunicationMessage(message);

      if (validationError) {
        await renderTicketDetailSubmissionPage({
          request,
          response,
          requestUrl,
          ticketCommunicationSubmission: {
            intent,
            status: "error",
            message: validationError,
            draftMessage: message,
          },
          statusCode: 400,
        });
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
        const sectionId = intent === "create-customer-update" ? "customer-visible-updates" : "internal-notes";
        response.writeHead(303, {
          location: `${requestUrl.pathname}?submission=success&intent=${encodeURIComponent(intent)}#${sectionId}`,
        });
        response.end();
        return;
      }

      await renderTicketDetailSubmissionPage({
        request,
        response,
        requestUrl,
        ticketCommunicationSubmission: {
          intent,
          status: "error",
          message: await readApiErrorMessage(apiResponse, "Unable to save this ticket update."),
          draftMessage: message,
        },
        statusCode: apiResponse.status,
      });
      return;
    }

    if (isTicketFieldEditIntent(intent)) {
      const draft = readTicketFieldDraft(formData);
      const validationError = validateTicketFieldDraft(draft);

      if (validationError) {
        await renderTicketDetailSubmissionPage({
          request,
          response,
          requestUrl,
          ticketFieldEditSubmission: {
            intent,
            status: "error",
            message: validationError,
            draft,
          },
          statusCode: 400,
        });
        return;
      }

      const apiResponse = await fetchApiWithPreviewSession(
        request,
        `${apiBaseUrl}/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/tickets/${encodeURIComponent(ticketId)}`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(buildTicketFieldPatchBody(draft)),
        },
      );

      if (apiResponse.ok) {
        response.writeHead(303, {
          location: `${requestUrl.pathname}?submission=success&intent=${encodeURIComponent(intent)}#ticket-metadata`,
        });
        response.end();
        return;
      }

      await renderTicketDetailSubmissionPage({
        request,
        response,
        requestUrl,
        ticketFieldEditSubmission: {
          intent,
          status: "error",
          message: await readApiErrorMessage(apiResponse, "Unable to update this ticket."),
          draft,
        },
        statusCode: apiResponse.status,
      });
      return;
    }

    response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    response.end("Unknown ticket detail action.");
    return;
  }

    if (request.method !== "GET") {
      response.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
      response.end("Method Not Allowed");
      return;
    }

    if (requestUrl.pathname === "/styles/global.css") {
      const stylesheet = await readFile(stylesheetUrl, "utf8");
      response.writeHead(200, { "content-type": "text/css; charset=utf-8" });
      response.end(stylesheet);
      return;
    }

    if (requestUrl.pathname.startsWith("/api/")) {
      await proxyApiGetRequest({
        request,
        response,
        requestUrl,
      });
      return;
    }

    const loadedData = apiBaseUrl
      ? await loadAppRouteData(`${requestUrl.pathname}${requestUrl.search}`, {
          apiBaseUrl,
          fetchImpl: (input, init) => fetchApiWithPreviewSession(request, input, init),
          ticketCommunicationSubmission: readTicketCommunicationSuccess(requestUrl.searchParams),
          ticketFieldEditSubmission: readTicketFieldEditSuccess(requestUrl.searchParams),
        })
      : null;
    const html = loadedData ? renderLoadedWebAppDocument(loadedData) : renderWebAppDocument(requestUrl.pathname);

    response.writeHead(getStatusCode(requestUrl.pathname, loadedData?.routeState.pathname), {
      "content-type": "text/html; charset=utf-8",
    });
    response.end(html);
  } catch {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end("Preview server error.");
  }
});

server.listen(port, host, () => {
  console.log(`apps/web preview running at http://${host}:${port}`);
});
