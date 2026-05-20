declare const process: {
  readonly env: Record<string, string | undefined>;
};

declare module "node:http" {
  export interface IncomingMessage {
    readonly method?: string;
    readonly url?: string;
  }

  export interface ServerResponse {
    writeHead(statusCode: number, headers?: Record<string, string>): this;
    end(chunk?: string): void;
  }

  export interface Server {
    listen(port: number, host: string, callback?: () => void): void;
  }

  export function createServer(
    handler: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>,
  ): Server;
}

declare module "node:fs/promises" {
  export function readFile(path: string | URL, encoding: "utf8"): Promise<string>;
}
