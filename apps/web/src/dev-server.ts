import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

import { renderWebAppDocument } from "./index.ts";
import { resolveAppRoute } from "./routing/route-state.ts";

const defaultPort = 3000;
const port = Number.parseInt(process.env.PORT ?? `${defaultPort}`, 10) || defaultPort;
const host = process.env.HOST ?? "127.0.0.1";
const defaultWorkspaceSlug = "demo-workspace";
const stylesheetUrl = new URL("./styles/global.css", import.meta.url);

function getStatusCode(pathname: string): number {
  const routeState = resolveAppRoute(pathname);

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

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://${host}:${port}`);

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

  const html = renderWebAppDocument(requestUrl.pathname);

  response.writeHead(getStatusCode(requestUrl.pathname), {
    "content-type": "text/html; charset=utf-8",
  });
  response.end(html);
});

server.listen(port, host, () => {
  console.log(`apps/web preview running at http://${host}:${port}`);
});
