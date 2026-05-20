import { describe, expect, it } from "vitest";

import app from "../index";
import type { ApiEnv } from "../lib/env";
import { hashSessionToken } from "../lib/session-token";

describe("API auth foundation", () => {
  it("returns an unauthenticated session envelope by default", async () => {
    const response = await app.request("http://localhost/api/v1/session", undefined, await createApiEnv());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        authenticated: false,
        user: null,
        session: {
          state: "anonymous",
          driver: "hybrid-friendly-placeholder",
          providerModel: "provider-agnostic",
          source: "none",
        },
        workspaces: [],
      },
    });
  });

  it("returns a real session bootstrap with accessible workspaces for an authenticated customer session", async () => {
    const response = await app.request(
      "http://localhost/api/v1/session",
      {
        headers: {
          cookie: "oid_session=customer-token",
        },
      },
      await createApiEnv(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        authenticated: true,
        user: {
          id: "usr_customer",
          email: "customer@example.com",
          displayName: "Customer User",
          userType: "customer",
        },
        session: {
          state: "authenticated",
          driver: "hybrid-friendly-placeholder",
          providerModel: "provider-agnostic",
          source: "cookie",
        },
        workspaces: [
          {
            workspaceId: "wsp_acme",
            workspaceSlug: "acme",
            workspaceName: "Acme Workspace",
            tenantId: "ten_acme",
            tenantSlug: "acme",
            tenantName: "Acme Co",
            actorRole: "WorkspaceAdmin",
            membershipRole: "WorkspaceAdmin",
            memberStatus: "active",
            accessPath: "workspace-membership",
            grantedPermissions: [
              "workspace.view",
              "workspace.edit",
              "workspace.members.view",
              "workspace.members.manage",
              "workspace.settings.view",
              "tickets.view",
              "tickets.create",
              "tickets.update",
              "tickets.assign",
              "tickets.comment",
              "tickets.attach",
              "tickets.create_customer_updates",
              "tickets.change_status",
              "tickets.manage_views",
              "pages.view",
              "pages.create",
              "pages.update",
              "pages.share",
              "pages.comment",
              "attachments.view",
              "attachments.upload",
              "shares.create",
              "shares.view",
              "shares.revoke",
            ],
          },
        ],
      },
    });
  });

  it("returns the accessible workspace list for an authenticated session", async () => {
    const response = await app.request(
      "http://localhost/api/v1/workspaces",
      {
        headers: {
          cookie: "oid_session=customer-token",
        },
      },
      await createApiEnv(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        items: [
          {
            workspaceId: "wsp_acme",
            workspaceSlug: "acme",
            workspaceName: "Acme Workspace",
            tenantId: "ten_acme",
            tenantSlug: "acme",
            tenantName: "Acme Co",
            actorRole: "WorkspaceAdmin",
            membershipRole: "WorkspaceAdmin",
            memberStatus: "active",
            accessPath: "workspace-membership",
            grantedPermissions: [
              "workspace.view",
              "workspace.edit",
              "workspace.members.view",
              "workspace.members.manage",
              "workspace.settings.view",
              "tickets.view",
              "tickets.create",
              "tickets.update",
              "tickets.assign",
              "tickets.comment",
              "tickets.attach",
              "tickets.create_customer_updates",
              "tickets.change_status",
              "tickets.manage_views",
              "pages.view",
              "pages.create",
              "pages.update",
              "pages.share",
              "pages.comment",
              "attachments.view",
              "attachments.upload",
              "shares.create",
              "shares.view",
              "shares.revoke",
            ],
          },
        ],
      },
    });
  });

  it("returns unauthorized for protected workspace routes without a valid session", async () => {
    const response = await app.request(
      "http://localhost/api/v1/workspaces/acme/overview",
      undefined,
      await createApiEnv(),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "unauthorized",
        message: "A valid session is required for this route.",
      },
    });
  });

  it("returns forbidden when an authenticated customer session has no workspace membership context", async () => {
    const response = await app.request(
      "http://localhost/api/v1/workspaces/acme/overview",
      {
        headers: {
          authorization: "Bearer nomember-token",
        },
      },
      await createApiEnv(),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "forbidden",
        message: "The current session cannot access this workspace route.",
      },
    });
  });

  it("returns the protected placeholder for an authorized customer membership", async () => {
    const response = await app.request(
      "http://localhost/api/v1/workspaces/acme/overview",
      {
        headers: {
          cookie: "oid_session=customer-token",
        },
      },
      await createApiEnv(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        workspace: {
          id: "wsp_acme",
          slug: "acme",
          name: "Acme Workspace",
          description: "Customer operations workspace",
          isDefault: true,
          tenant: {
            id: "ten_acme",
            name: "Acme Co",
            slug: "acme",
          },
        },
        summary: {
          activeMemberCount: 2,
        },
        membership: {
          role: "WorkspaceAdmin",
          memberStatus: "active",
        },
        access: {
          actorRole: "WorkspaceAdmin",
          accessPath: "workspace-membership",
          canViewMembers: true,
          canViewSettings: true,
        },
      },
    });
  });

  it("returns the workspace ticket list for an authorized customer membership", async () => {
    const response = await app.request(
      "http://localhost/api/v1/workspaces/acme/tickets",
      {
        headers: {
          cookie: "oid_session=customer-token",
        },
      },
      await createApiEnv(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        workspace: {
          id: "wsp_acme",
          slug: "acme",
          name: "Acme Workspace",
        },
        items: [
          {
            id: "tic_002",
            ticketNumber: "TT-2",
            title: "Page title truncates in the workspace shell",
            status: "in_progress",
            priority: "medium",
            updatedAt: "2025-01-11T15:30:00.000Z",
            assignee: null,
          },
          {
            id: "tic_001",
            ticketNumber: "TT-1",
            title: "Customer cannot upload billing CSV",
            status: "open",
            priority: "high",
            updatedAt: "2025-01-10T09:00:00.000Z",
            assignee: {
              memberId: "mem_viewer",
              userId: "usr_viewer",
              displayName: "Viewer User",
              email: "viewer@example.com",
            },
          },
        ],
      },
    });
  });

  it("returns forbidden for the workspace ticket list when the session has no workspace access", async () => {
    const response = await app.request(
      "http://localhost/api/v1/workspaces/acme/tickets",
      {
        headers: {
          authorization: "Bearer nomember-token",
        },
      },
      await createApiEnv(),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "forbidden",
        message: "The current session cannot access this workspace route.",
      },
    });
  });

  it("returns the protected placeholder for authorized internal support access", async () => {
    const response = await app.request(
      "http://localhost/api/v1/workspaces/acme/overview",
      {
        headers: {
          cookie: "oid_session=internal-token",
          "x-observeid-platform-role": "SupportOperator",
        },
      },
      await createApiEnv(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        workspace: {
          id: "wsp_acme",
          slug: "acme",
          name: "Acme Workspace",
          description: "Customer operations workspace",
          isDefault: true,
          tenant: {
            id: "ten_acme",
            name: "Acme Co",
            slug: "acme",
          },
        },
        summary: {
          activeMemberCount: 2,
        },
        membership: null,
        access: {
          actorRole: "SupportOperator",
          accessPath: "cross-workspace-support",
          canViewMembers: true,
          canViewSettings: true,
        },
      },
    });
  });
});

type SessionSeed = {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: string;
  readonly revokedAt: string | null;
};

async function createApiEnv(): Promise<ApiEnv> {
  const future = new Date("2030-01-01T00:00:00.000Z").toISOString();

  const sessions = [
    {
      id: "sess_customer",
      userId: "usr_customer",
      tokenHash: await hashSessionToken("customer-token"),
      expiresAt: future,
      revokedAt: null,
    },
    {
      id: "sess_viewer",
      userId: "usr_viewer",
      tokenHash: await hashSessionToken("viewer-token"),
      expiresAt: future,
      revokedAt: null,
    },
    {
      id: "sess_nomember",
      userId: "usr_nomember",
      tokenHash: await hashSessionToken("nomember-token"),
      expiresAt: future,
      revokedAt: null,
    },
    {
      id: "sess_support",
      userId: "usr_support",
      tokenHash: await hashSessionToken("internal-token"),
      expiresAt: future,
      revokedAt: null,
    },
  ] satisfies readonly SessionSeed[];

  return {
    APP_ENV: "development",
    APP_BASE_URL: "http://localhost:8787",
    SESSION_DRIVER: "hybrid-friendly-placeholder",
    DB: new FakeD1Database(sessions),
    ATTACHMENTS: {
      bindingType: "r2",
      status: "placeholder",
    },
  };
}

class FakeD1Database {
  private readonly tenants = [
    {
      id: "ten_acme",
      name: "Acme Co",
      slug: "acme",
      archivedAt: null,
    },
  ] as const;

  private readonly workspaces = [
    {
      id: "wsp_acme",
      tenantId: "ten_acme",
      name: "Acme Workspace",
      slug: "acme",
      description: "Customer operations workspace",
      isDefault: 1,
      archivedAt: null,
    },
  ] as const;

  private readonly users = [
    {
      id: "usr_customer",
      email: "customer@example.com",
      fullName: "Customer User",
      userType: "customer",
      status: "active",
      archivedAt: null,
    },
    {
      id: "usr_viewer",
      email: "viewer@example.com",
      fullName: "Viewer User",
      userType: "customer",
      status: "active",
      archivedAt: null,
    },
    {
      id: "usr_support",
      email: "support@example.com",
      fullName: "Support User",
      userType: "internal",
      status: "active",
      archivedAt: null,
    },
    {
      id: "usr_nomember",
      email: "nomember@example.com",
      fullName: "No Membership User",
      userType: "customer",
      status: "active",
      archivedAt: null,
    },
  ] as const;

  private readonly workspaceMembers = [
    {
      id: "mem_admin",
      workspaceId: "wsp_acme",
      userId: "usr_customer",
      role: "WorkspaceAdmin",
      memberStatus: "active",
      archivedAt: null,
    },
    {
      id: "mem_viewer",
      workspaceId: "wsp_acme",
      userId: "usr_viewer",
      role: "Viewer",
      memberStatus: "active",
      archivedAt: null,
    },
  ] as const;

  private readonly tickets = [
    {
      id: "tic_001",
      workspaceId: "wsp_acme",
      ticketNumber: "TT-1",
      title: "Customer cannot upload billing CSV",
      status: "open",
      priority: "high",
      assigneeMemberId: "mem_viewer",
      updatedAt: "2025-01-10T09:00:00.000Z",
      archivedAt: null,
    },
    {
      id: "tic_002",
      workspaceId: "wsp_acme",
      ticketNumber: "TT-2",
      title: "Page title truncates in the workspace shell",
      status: "in_progress",
      priority: "medium",
      assigneeMemberId: null,
      updatedAt: "2025-01-11T15:30:00.000Z",
      archivedAt: null,
    },
  ] as const;

  constructor(private readonly sessions: readonly SessionSeed[]) {}

  prepare(query: string) {
    return new FakePreparedStatement(this, query);
  }

  async execute(query: string, bindings: readonly unknown[]) {
    if (query.includes("FROM sessions")) {
      const [tokenHash, nowIso] = bindings as [string, string];
      const session = this.sessions.find(
        (candidate) =>
          candidate.tokenHash === tokenHash &&
          candidate.revokedAt === null &&
          candidate.expiresAt > nowIso,
      );

      if (!session) {
        return [];
      }

      const user = this.users.find(
        (candidate) =>
          candidate.id === session.userId &&
          candidate.status === "active" &&
          candidate.archivedAt === null,
      );

      if (!user) {
        return [];
      }

      return [
        {
          sessionId: session.id,
          userId: user.id,
          email: user.email,
          fullName: user.fullName,
          userType: user.userType,
        },
      ];
    }

    if (query.includes("COUNT(")) {
      const [workspaceSlug] = bindings as [string];
      const workspace = this.workspaces.find((candidate) => candidate.slug === workspaceSlug);

      if (!workspace) {
        return [];
      }

      const tenant = this.tenants.find((candidate) => candidate.id === workspace.tenantId);

      if (!tenant) {
        return [];
      }

      return [
        {
          workspaceId: workspace.id,
          workspaceSlug: workspace.slug,
          workspaceName: workspace.name,
          workspaceDescription: workspace.description,
          workspaceIsDefault: workspace.isDefault,
          tenantId: tenant.id,
          tenantName: tenant.name,
          tenantSlug: tenant.slug,
          activeMemberCount: this.workspaceMembers.filter(
            (candidate) =>
              candidate.workspaceId === workspace.id &&
              candidate.archivedAt === null &&
              candidate.memberStatus === "active",
          ).length,
        },
      ];
    }

    if (query.includes("FROM tickets")) {
      const [workspaceId] = bindings as [string];

      return this.tickets
        .filter((ticket) => ticket.workspaceId === workspaceId && ticket.archivedAt === null)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || right.ticketNumber.localeCompare(left.ticketNumber))
        .map((ticket) => {
          const assigneeMember = ticket.assigneeMemberId
            ? this.workspaceMembers.find((candidate) => candidate.id === ticket.assigneeMemberId)
            : null;
          const assigneeUser = assigneeMember
            ? this.users.find((candidate) => candidate.id === assigneeMember.userId)
            : null;

          return {
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            title: ticket.title,
            status: ticket.status,
            priority: ticket.priority,
            updatedAt: ticket.updatedAt,
            assigneeMemberId: assigneeMember?.id ?? null,
            assigneeUserId: assigneeUser?.id ?? null,
            assigneeDisplayName: assigneeUser?.fullName ?? null,
            assigneeEmail: assigneeUser?.email ?? null,
          };
        });
    }

    if (query.includes("WHERE workspace_members.user_id = ?") && query.includes("workspaces.slug = ?")) {
      const [userId, workspaceSlug] = bindings as [string, string];
      const workspace = this.workspaces.find((candidate) => candidate.slug === workspaceSlug);

      if (!workspace) {
        return [];
      }

      const member = this.workspaceMembers.find(
        (candidate) =>
          candidate.userId === userId &&
          candidate.workspaceId === workspace.id &&
          candidate.archivedAt === null,
      );

      if (!member) {
        return [];
      }

      return [
        {
          workspaceId: workspace.id,
          workspaceSlug: workspace.slug,
          tenantId: workspace.tenantId,
          role: member.role,
          memberStatus: member.memberStatus,
        },
      ];
    }

    if (query.includes("WHERE workspace_members.user_id = ?")) {
      const [userId] = bindings as [string];

      return this.workspaceMembers
        .filter((candidate) => candidate.userId === userId && candidate.archivedAt === null)
        .map((member) => {
          const workspace = this.workspaces.find((candidate) => candidate.id === member.workspaceId);
          const tenant = this.tenants.find((candidate) => candidate.id === workspace?.tenantId);

          return workspace && tenant
            ? {
                workspaceId: workspace.id,
                workspaceSlug: workspace.slug,
                workspaceName: workspace.name,
                tenantId: tenant.id,
                tenantSlug: tenant.slug,
                tenantName: tenant.name,
                membershipRole: member.role,
                memberStatus: member.memberStatus,
              }
            : null;
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);
    }

    if (query.includes("FROM workspaces") && !query.includes("workspace_members")) {
      return this.workspaces.map((workspace) => {
        const tenant = this.tenants.find((candidate) => candidate.id === workspace.tenantId)!;

        return {
          workspaceId: workspace.id,
          workspaceSlug: workspace.slug,
          workspaceName: workspace.name,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          tenantName: tenant.name,
        };
      });
    }

    throw new Error(`Unhandled fake D1 query: ${query}`);
  }
}

class FakePreparedStatement {
  private bindings: readonly unknown[] = [];

  constructor(
    private readonly database: FakeD1Database,
    private readonly query: string,
  ) {}

  bind(...values: readonly unknown[]) {
    this.bindings = values;
    return this;
  }

  async first<Row>() {
    const rows = await this.database.execute(this.query, this.bindings);
    return (rows[0] as Row | undefined) ?? null;
  }

  async all<Row>() {
    return {
      results: (await this.database.execute(this.query, this.bindings)) as unknown as readonly Row[],
    };
  }
}
