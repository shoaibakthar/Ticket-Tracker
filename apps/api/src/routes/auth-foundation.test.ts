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
        filters: {
          applied: {
            status: null,
            priority: null,
            assigneeMemberId: null,
            q: null,
            sort: "updated_desc",
          },
          statusOptions: ["open", "in_progress"],
          priorityOptions: ["medium", "high"],
          assigneeOptions: [
            {
              memberId: "mem_viewer",
              userId: "usr_viewer",
              displayName: "Viewer User",
              email: "viewer@example.com",
            },
          ],
          totalVisibleCount: 2,
          filteredCount: 2,
        },
      },
    });
  });

  it("filters and searches the workspace ticket list without leaking internal-only tickets", async () => {
    const response = await app.request(
      "http://localhost/api/v1/workspaces/acme/tickets?status=open&priority=high&assignee=mem_viewer&q=billing&sort=priority_desc",
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
        filters: {
          applied: {
            status: "open",
            priority: "high",
            assigneeMemberId: "mem_viewer",
            q: "billing",
            sort: "priority_desc",
          },
          statusOptions: ["open", "in_progress"],
          priorityOptions: ["medium", "high"],
          assigneeOptions: [
            {
              memberId: "mem_viewer",
              userId: "usr_viewer",
              displayName: "Viewer User",
              email: "viewer@example.com",
            },
          ],
          totalVisibleCount: 2,
          filteredCount: 1,
        },
      },
    });
  });

  it("returns the workspace ticket detail for an authorized customer membership", async () => {
    const response = await app.request(
      "http://localhost/api/v1/workspaces/acme/tickets/tic_001",
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
        ticket: {
          id: "tic_001",
          ticketNumber: "TT-1",
          title: "Customer cannot upload billing CSV",
          description: "The customer billing CSV upload fails after validation completes.",
          status: "open",
          priority: "high",
          dueDate: "2025-01-17T17:00:00.000Z",
          updatedAt: "2025-01-10T09:00:00.000Z",
          assignee: {
            memberId: "mem_viewer",
            userId: "usr_viewer",
            displayName: "Viewer User",
            email: "viewer@example.com",
          },
        },
        summary: {
          currentStanding:
            "open priority high ticket assigned to Viewer User. Due 2025-01-17T17:00:00.000Z.",
        },
        editing: {
          statusOptions: [
            "open",
            "New",
            "Open",
            "Investigating",
            "Identified",
            "InProgress",
            "WaitingOnObserveID",
            "WaitingOnCustomer",
            "WaitingOnVendor",
            "Blocked",
            "Monitoring",
            "Resolved",
            "Closed",
          ],
          priorityOptions: ["high", "Low", "Medium", "High", "Urgent"],
          assigneeOptions: [
            {
              memberId: "mem_admin",
              userId: "usr_customer",
              displayName: "Customer User",
              email: "customer@example.com",
            },
            {
              memberId: "mem_viewer",
              userId: "usr_viewer",
              displayName: "Viewer User",
              email: "viewer@example.com",
            },
          ],
        },
        sections: {
          customerVisibleUpdates: [
            {
              id: "upd_001",
              message: "We reproduced the upload problem and are working on a fix.",
              createdAt: "2025-01-09T13:00:00.000Z",
              updatedAt: "2025-01-09T13:00:00.000Z",
              author: {
                userId: "usr_support",
                displayName: "Support User",
                email: "support@example.com",
              },
            },
          ],
          internalNotes: null,
          activityTimeline: [
            {
              id: "cmt_001",
              kind: "comment",
              visibility: "customer",
              message: "We can reproduce this with the January export.",
              createdAt: "2025-01-09T15:00:00.000Z",
              updatedAt: "2025-01-09T16:00:00.000Z",
              author: {
                userId: "usr_customer",
                displayName: "Customer User",
                email: "customer@example.com",
              },
            },
            {
              id: "upd_001",
              kind: "customer_update",
              visibility: "customer",
              message: "We reproduced the upload problem and are working on a fix.",
              createdAt: "2025-01-09T13:00:00.000Z",
              updatedAt: "2025-01-09T13:00:00.000Z",
              author: {
                userId: "usr_support",
                displayName: "Support User",
                email: "support@example.com",
              },
            },
            {
              id: "activity_att_001",
              kind: "attachment",
              visibility: "customer",
              createdAt: "2025-01-08T10:00:00.000Z",
              updatedAt: "2025-01-08T10:00:00.000Z",
              author: {
                userId: "usr_support",
                displayName: "Support User",
                email: "support@example.com",
              },
              attachment: {
                id: "att_001",
                visibility: "customer",
                filename: "billing-sample.csv",
                downloadPath: "/api/v1/workspaces/acme/files/att_001/download",
                contentType: "text/csv",
                sizeBytes: 24576,
                createdAt: "2025-01-08T10:00:00.000Z",
                uploadedBy: {
                  userId: "usr_support",
                  displayName: "Support User",
                  email: "support@example.com",
                },
              },
            },
          ],
          attachments: [
            {
              id: "att_001",
              visibility: "customer",
              filename: "billing-sample.csv",
              downloadPath: "/api/v1/workspaces/acme/files/att_001/download",
              contentType: "text/csv",
              sizeBytes: 24576,
              createdAt: "2025-01-08T10:00:00.000Z",
              uploadedBy: {
                userId: "usr_support",
                displayName: "Support User",
                email: "support@example.com",
              },
            },
          ],
        },
        access: {
          actorRole: "WorkspaceAdmin",
          accessPath: "workspace-membership",
          canViewInternalNotes: false,
          canViewAttachments: true,
          canCreateInternalNotes: false,
          canCreateCustomerUpdates: true,
          canUpdateTicketFields: true,
          canAssignTickets: true,
          canChangeTicketStatus: true,
        },
      },
    });
  });

  it("hides internal-only tickets from customer actors without internal-note visibility", async () => {
    const response = await app.request(
      "http://localhost/api/v1/workspaces/acme/tickets/tic_internal",
      {
        headers: {
          cookie: "oid_session=customer-token",
        },
      },
      await createApiEnv(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "not_found",
        message: "Ticket detail was not found.",
      },
    });
  });

  it("returns internal-only ticket detail for internal support actors", async () => {
    const response = await app.request(
      "http://localhost/api/v1/workspaces/acme/tickets/tic_internal",
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
        },
        ticket: {
          id: "tic_internal",
          ticketNumber: "TT-9",
          title: "Escalation triage for support team only",
          description: "Internal-only escalation thread for ObserveID operations.",
          status: "blocked",
          priority: "urgent",
          dueDate: null,
          updatedAt: "2025-01-12T08:15:00.000Z",
          assignee: null,
        },
        summary: {
          currentStanding: "blocked priority urgent ticket assigned to Unassigned. No due date is scheduled.",
        },
        editing: {
          statusOptions: [
            "blocked",
            "New",
            "Open",
            "Investigating",
            "Identified",
            "InProgress",
            "WaitingOnObserveID",
            "WaitingOnCustomer",
            "WaitingOnVendor",
            "Blocked",
            "Monitoring",
            "Resolved",
            "Closed",
          ],
          priorityOptions: ["urgent", "Low", "Medium", "High", "Urgent"],
          assigneeOptions: [
            {
              memberId: "mem_admin",
              userId: "usr_customer",
              displayName: "Customer User",
              email: "customer@example.com",
            },
            {
              memberId: "mem_viewer",
              userId: "usr_viewer",
              displayName: "Viewer User",
              email: "viewer@example.com",
            },
          ],
        },
        sections: {
          customerVisibleUpdates: [],
          internalNotes: [
            {
              id: "upd_internal_001",
              message: "Escalated to the operations triage queue for coordinated handling.",
              createdAt: "2025-01-12T08:00:00.000Z",
              updatedAt: "2025-01-12T08:00:00.000Z",
              author: {
                userId: "usr_support",
                displayName: "Support User",
                email: "support@example.com",
              },
            },
          ],
          activityTimeline: [
            {
              id: "cmt_internal_001",
              kind: "comment",
              visibility: "internal",
              message: "Waiting on the escalation owner to confirm next steps.",
              createdAt: "2025-01-12T08:10:00.000Z",
              updatedAt: "2025-01-12T08:10:00.000Z",
              author: {
                userId: "usr_support",
                displayName: "Support User",
                email: "support@example.com",
              },
            },
            {
              id: "activity_att_internal_001",
              kind: "attachment",
              visibility: "internal",
              createdAt: "2025-01-12T08:05:00.000Z",
              updatedAt: "2025-01-12T08:05:00.000Z",
              author: {
                userId: "usr_support",
                displayName: "Support User",
                email: "support@example.com",
              },
              attachment: {
                id: "att_internal_001",
                visibility: "internal",
                filename: "operations-runbook.txt",
                downloadPath: "/api/v1/workspaces/acme/files/att_internal_001/download",
                contentType: "text/plain",
                sizeBytes: 1024,
                createdAt: "2025-01-12T08:05:00.000Z",
                uploadedBy: {
                  userId: "usr_support",
                  displayName: "Support User",
                  email: "support@example.com",
                },
              },
            },
            {
              id: "upd_internal_001",
              kind: "internal_note",
              visibility: "internal",
              message: "Escalated to the operations triage queue for coordinated handling.",
              createdAt: "2025-01-12T08:00:00.000Z",
              updatedAt: "2025-01-12T08:00:00.000Z",
              author: {
                userId: "usr_support",
                displayName: "Support User",
                email: "support@example.com",
              },
            },
          ],
          attachments: [
            {
              id: "att_internal_001",
              visibility: "internal",
              filename: "operations-runbook.txt",
              downloadPath: "/api/v1/workspaces/acme/files/att_internal_001/download",
              contentType: "text/plain",
              sizeBytes: 1024,
              createdAt: "2025-01-12T08:05:00.000Z",
              uploadedBy: {
                userId: "usr_support",
                displayName: "Support User",
                email: "support@example.com",
              },
            },
          ],
        },
        access: {
          actorRole: "SupportOperator",
          accessPath: "cross-workspace-support",
          canViewInternalNotes: true,
          canViewAttachments: true,
          canCreateInternalNotes: true,
          canCreateCustomerUpdates: true,
          canUpdateTicketFields: true,
          canAssignTickets: true,
          canChangeTicketStatus: true,
        },
      },
    });
  });

  it("downloads a customer-visible attachment for an authorized workspace member", async () => {
    const response = await app.request(
      "http://localhost/api/v1/workspaces/acme/files/att_001/download",
      {
        headers: {
          cookie: "oid_session=customer-token",
        },
      },
      await createApiEnv(),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv");
    expect(response.headers.get("content-disposition")).toContain('filename="billing-sample.csv"');
    await expect(response.text()).resolves.toContain("invoice_id,status");
  });

  it("hides internal attachments from customer-facing roles", async () => {
    const response = await app.request(
      "http://localhost/api/v1/workspaces/acme/files/att_internal_001/download",
      {
        headers: {
          cookie: "oid_session=customer-token",
        },
      },
      await createApiEnv(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "not_found",
        message: "Attachment was not found.",
      },
    });
  });

  it("downloads internal attachments for authorized internal support actors", async () => {
    const response = await app.request(
      "http://localhost/api/v1/workspaces/acme/files/att_internal_001/download",
      {
        headers: {
          cookie: "oid_session=internal-token",
          "x-observeid-platform-role": "SupportOperator",
        },
      },
      await createApiEnv(),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/plain");
    expect(response.headers.get("content-disposition")).toContain('filename="operations-runbook.txt"');
    await expect(response.text()).resolves.toContain("Internal escalation runbook");
  });

  it("creates a customer-visible update for an authorized workspace admin", async () => {
    const env = await createApiEnv();
    const response = await app.request(
      "http://localhost/api/v1/workspaces/acme/tickets/tic_001/updates",
      {
        method: "POST",
        headers: {
          cookie: "oid_session=customer-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "We confirmed the failing rows and have a fix queued for deployment.",
        }),
      },
      env,
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        entry: {
          message: "We confirmed the failing rows and have a fix queued for deployment.",
          visibility: "customer",
        },
      },
    });

    const detailResponse = await app.request(
      "http://localhost/api/v1/workspaces/acme/tickets/tic_001",
      {
        headers: {
          cookie: "oid_session=customer-token",
        },
      },
      env,
    );

    expect(detailResponse.status).toBe(200);
    await expect(detailResponse.json()).resolves.toMatchObject({
      data: {
        sections: {
          customerVisibleUpdates: expect.arrayContaining([
            expect.objectContaining({
              message: "We confirmed the failing rows and have a fix queued for deployment.",
            }),
          ]),
          activityTimeline: expect.arrayContaining([
            expect.objectContaining({
              kind: "customer_update",
              message: "We confirmed the failing rows and have a fix queued for deployment.",
            }),
          ]),
        },
      },
    });
  });

  it("updates ticket fields for an authorized workspace admin and records the activity", async () => {
    const env = await createApiEnv();
    const response = await app.request(
      "http://localhost/api/v1/workspaces/acme/tickets/tic_001",
      {
        method: "PATCH",
        headers: {
          cookie: "oid_session=customer-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          status: "Investigating",
          priority: "Urgent",
          assigneeMemberId: null,
          dueDate: "2025-01-20",
        }),
      },
      env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        ticket: {
          status: "Investigating",
          priority: "Urgent",
          dueDate: "2025-01-20",
          assignee: null,
        },
        changes: [
          expect.objectContaining({ field: "status", from: "open", to: "Investigating" }),
          expect.objectContaining({ field: "priority", from: "high", to: "Urgent" }),
          expect.objectContaining({ field: "dueDate", from: "2025-01-17T17:00:00.000Z", to: "2025-01-20" }),
          expect.objectContaining({ field: "assignee", from: "Viewer User", to: "Unassigned" }),
        ],
      },
    });

    const detailResponse = await app.request(
      "http://localhost/api/v1/workspaces/acme/tickets/tic_001",
      {
        headers: {
          cookie: "oid_session=customer-token",
        },
      },
      env,
    );

    expect(detailResponse.status).toBe(200);
    await expect(detailResponse.json()).resolves.toMatchObject({
      data: {
        ticket: {
          status: "Investigating",
          priority: "Urgent",
          dueDate: "2025-01-20",
          assignee: null,
        },
        sections: {
          activityTimeline: expect.arrayContaining([
            expect.objectContaining({
              kind: "field_change",
              changes: expect.arrayContaining([
                expect.objectContaining({ field: "status", to: "Investigating" }),
                expect.objectContaining({ field: "priority", to: "Urgent" }),
              ]),
            }),
          ]),
        },
      },
    });
  });

  it("returns forbidden when a viewer attempts to update ticket fields", async () => {
    const response = await app.request(
      "http://localhost/api/v1/workspaces/acme/tickets/tic_001",
      {
        method: "PATCH",
        headers: {
          cookie: "oid_session=viewer-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          priority: "Urgent",
        }),
      },
      await createApiEnv(),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "forbidden",
        message: "The current session cannot update this ticket metadata.",
      },
    });
  });

  it("returns validation errors for blank customer-visible updates", async () => {
    const response = await app.request(
      "http://localhost/api/v1/workspaces/acme/tickets/tic_001/updates",
      {
        method: "POST",
        headers: {
          cookie: "oid_session=customer-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "   ",
        }),
      },
      await createApiEnv(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "validation_error",
        message: "A message is required.",
      },
    });
  });

  it("returns forbidden when a workspace admin attempts to create an internal note", async () => {
    const response = await app.request(
      "http://localhost/api/v1/workspaces/acme/tickets/tic_001/internal-notes",
      {
        method: "POST",
        headers: {
          cookie: "oid_session=customer-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Internal-only follow-up.",
        }),
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

  it("creates an internal note for an authorized support operator", async () => {
    const env = await createApiEnv();
    const response = await app.request(
      "http://localhost/api/v1/workspaces/acme/tickets/tic_internal/internal-notes",
      {
        method: "POST",
        headers: {
          cookie: "oid_session=internal-token",
          "x-observeid-platform-role": "SupportOperator",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Captured the latest triage handoff details for the escalation team.",
        }),
      },
      env,
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        entry: {
          message: "Captured the latest triage handoff details for the escalation team.",
          visibility: "internal",
        },
      },
    });

    const detailResponse = await app.request(
      "http://localhost/api/v1/workspaces/acme/tickets/tic_internal",
      {
        headers: {
          cookie: "oid_session=internal-token",
          "x-observeid-platform-role": "SupportOperator",
        },
      },
      env,
    );

    expect(detailResponse.status).toBe(200);
    await expect(detailResponse.json()).resolves.toMatchObject({
      data: {
        sections: {
          internalNotes: expect.arrayContaining([
            expect.objectContaining({
              message: "Captured the latest triage handoff details for the escalation team.",
            }),
          ]),
          activityTimeline: expect.arrayContaining([
            expect.objectContaining({
              kind: "internal_note",
              message: "Captured the latest triage handoff details for the escalation team.",
            }),
          ]),
        },
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

class FakeR2Bucket {
  private readonly objects = new Map<string, Uint8Array>([
    [
      "tickets/tic_001/billing-sample.csv",
      new TextEncoder().encode("invoice_id,status\ninv_001,failed\ninv_002,retried\n"),
    ],
    [
      "tickets/tic_internal/operations-runbook.txt",
      new TextEncoder().encode("Internal escalation runbook\n1. Confirm scope\n2. Assign owner\n"),
    ],
  ]);

  async get(key: string) {
    const body = this.objects.get(key);

    if (!body) {
      return null;
    }

    return {
      arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
    };
  }
}

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
    ATTACHMENTS: new FakeR2Bucket(),
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
  ];

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
  ];

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
  ];

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
  ];

  private readonly tickets: Array<{
    id: string;
    workspaceId: string;
    ticketNumber: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    visibility: string;
    assigneeMemberId: string | null;
    dueDate: string | null;
    updatedAt: string;
    archivedAt: string | null;
  }> = [
    {
      id: "tic_001",
      workspaceId: "wsp_acme",
      ticketNumber: "TT-1",
      title: "Customer cannot upload billing CSV",
      description: "The customer billing CSV upload fails after validation completes.",
      status: "open",
      priority: "high",
      visibility: "customer_visible",
      assigneeMemberId: "mem_viewer",
      dueDate: "2025-01-17T17:00:00.000Z",
      updatedAt: "2025-01-10T09:00:00.000Z",
      archivedAt: null,
    },
    {
      id: "tic_002",
      workspaceId: "wsp_acme",
      ticketNumber: "TT-2",
      title: "Page title truncates in the workspace shell",
      description: null,
      status: "in_progress",
      priority: "medium",
      visibility: "customer_visible",
      assigneeMemberId: null,
      dueDate: null,
      updatedAt: "2025-01-11T15:30:00.000Z",
      archivedAt: null,
    },
    {
      id: "tic_internal",
      workspaceId: "wsp_acme",
      ticketNumber: "TT-9",
      title: "Escalation triage for support team only",
      description: "Internal-only escalation thread for ObserveID operations.",
      status: "blocked",
      priority: "urgent",
      visibility: "internal_only",
      assigneeMemberId: null,
      dueDate: null,
      updatedAt: "2025-01-12T08:15:00.000Z",
      archivedAt: null,
    },
  ];

  private readonly ticketUpdates: Array<{
    id: string;
    ticketId: string;
    authorUserId: string;
    visibility: string;
    messageJson: string;
    createdAt: string;
    updatedAt: string;
    archivedAt: string | null;
  }> = [
    {
      id: "upd_001",
      ticketId: "tic_001",
      authorUserId: "usr_support",
      visibility: "customer",
      messageJson: JSON.stringify({
        text: "We reproduced the upload problem and are working on a fix.",
      }),
      createdAt: "2025-01-09T13:00:00.000Z",
      updatedAt: "2025-01-09T13:00:00.000Z",
      archivedAt: null,
    },
    {
      id: "upd_002",
      ticketId: "tic_001",
      authorUserId: "usr_support",
      visibility: "internal",
      messageJson: JSON.stringify({
        text: "Likely tied to CSV header normalization in the legacy importer.",
      }),
      createdAt: "2025-01-09T14:00:00.000Z",
      updatedAt: "2025-01-09T14:00:00.000Z",
      archivedAt: null,
    },
    {
      id: "upd_internal_001",
      ticketId: "tic_internal",
      authorUserId: "usr_support",
      visibility: "internal",
      messageJson: JSON.stringify({
        text: "Escalated to the operations triage queue for coordinated handling.",
      }),
      createdAt: "2025-01-12T08:00:00.000Z",
      updatedAt: "2025-01-12T08:00:00.000Z",
      archivedAt: null,
    },
  ];

  private readonly ticketComments = [
    {
      id: "cmt_001",
      ticketId: "tic_001",
      authorUserId: "usr_customer",
      visibility: "customer",
      bodyJson: JSON.stringify({
        text: "We can reproduce this with the January export.",
      }),
      createdAt: "2025-01-09T15:00:00.000Z",
      updatedAt: "2025-01-09T16:00:00.000Z",
      archivedAt: null,
    },
    {
      id: "cmt_002",
      ticketId: "tic_001",
      authorUserId: "usr_support",
      visibility: "internal",
      bodyJson: JSON.stringify({
        text: "Need to verify the fix against older CSV templates.",
      }),
      createdAt: "2025-01-09T16:00:00.000Z",
      updatedAt: "2025-01-09T16:00:00.000Z",
      archivedAt: null,
    },
    {
      id: "cmt_internal_001",
      ticketId: "tic_internal",
      authorUserId: "usr_support",
      visibility: "internal",
      bodyJson: JSON.stringify({
        text: "Waiting on the escalation owner to confirm next steps.",
      }),
      createdAt: "2025-01-12T08:10:00.000Z",
      updatedAt: "2025-01-12T08:10:00.000Z",
      archivedAt: null,
    },
  ];

  private readonly attachments = [
    {
      id: "att_001",
      workspaceId: "wsp_acme",
      linkedResourceType: "ticket",
      linkedResourceId: "tic_001",
      uploadedByUserId: "usr_support",
      r2ObjectKey: "tickets/tic_001/billing-sample.csv",
      originalFilename: "billing-sample.csv",
      contentType: "text/csv",
      sizeBytes: 24576,
      visibility: "customer",
      createdAt: "2025-01-08T10:00:00.000Z",
      archivedAt: null,
    },
    {
      id: "att_internal_001",
      workspaceId: "wsp_acme",
      linkedResourceType: "ticket",
      linkedResourceId: "tic_internal",
      uploadedByUserId: "usr_support",
      r2ObjectKey: "tickets/tic_internal/operations-runbook.txt",
      originalFilename: "operations-runbook.txt",
      contentType: "text/plain",
      sizeBytes: 1024,
      visibility: "internal",
      createdAt: "2025-01-12T08:05:00.000Z",
      archivedAt: null,
    },
  ];

  private readonly auditEvents: Array<{
    id: string;
    actorUserId: string;
    actorType: string;
    workspaceId: string;
    resourceType: string;
    resourceId: string;
    action: string;
    metadataJson: string;
    createdAt: string;
  }> = [];

  constructor(private readonly sessions: readonly SessionSeed[]) {}

  prepare(query: string) {
    return new FakePreparedStatement(this, query);
  }

  async execute(query: string, bindings: readonly unknown[]) {
    const normalizedQuery = query.replaceAll(/\s+/g, " ").trim();

    if (normalizedQuery.startsWith("INSERT INTO ticket_updates")) {
      const [id, ticketId, authorUserId, visibility, messageJson, createdAt, updatedAt] = bindings as [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ];
      this.ticketUpdates.push({
        id,
        ticketId,
        authorUserId,
        visibility,
        messageJson,
        createdAt,
        updatedAt,
        archivedAt: null,
      });
      return [];
    }

    if (normalizedQuery.startsWith("UPDATE tickets SET updated_at")) {
      const [updatedAt, ticketId] = bindings as [string, string];
      const ticket = this.tickets.find((candidate) => candidate.id === ticketId);

      if (ticket) {
        ticket.updatedAt = updatedAt;
      }

      return [];
    }

    if (normalizedQuery.startsWith("UPDATE tickets SET status = ?,")) {
      const [status, priority, assigneeMemberId, dueDate, updatedAt, ticketId] = bindings as [
        string,
        string,
        string | null,
        string | null,
        string,
        string,
      ];
      const ticket = this.tickets.find((candidate) => candidate.id === ticketId);

      if (ticket) {
        ticket.status = status;
        ticket.priority = priority;
        ticket.assigneeMemberId = assigneeMemberId;
        ticket.dueDate = dueDate;
        ticket.updatedAt = updatedAt;
      }

      return [];
    }

    if (normalizedQuery.startsWith("INSERT INTO audit_events")) {
      const [id, actorUserId, actorType, workspaceId, resourceType, resourceId, action, metadataJson, createdAt] =
        bindings as [string, string, string, string, string, string, string, string, string];
      this.auditEvents.push({
        id,
        actorUserId,
        actorType,
        workspaceId,
        resourceType,
        resourceId,
        action,
        metadataJson,
        createdAt,
      });
      return [];
    }

    if (normalizedQuery.includes("FROM sessions")) {
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

    if (normalizedQuery.includes("COUNT(")) {
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

    if (normalizedQuery.includes("FROM ticket_updates")) {
      const [ticketId, visibility] = bindings as [string, string];

      return this.ticketUpdates
        .filter(
          (entry) =>
            entry.ticketId === ticketId &&
            entry.visibility === visibility &&
            entry.archivedAt === null,
        )
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .map((entry) => {
          const author = this.users.find((candidate) => candidate.id === entry.authorUserId)!;

          return {
            entryId: entry.id,
            messageJson: entry.messageJson,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
            authorUserId: author.id,
            authorDisplayName: author.fullName,
            authorEmail: author.email,
          };
        });
    }

    if (normalizedQuery.includes("FROM audit_events")) {
      const [ticketId] = bindings as [string];

      return this.auditEvents
        .filter(
          (event) =>
            event.resourceType === "ticket" &&
            event.resourceId === ticketId &&
            event.action === "ticket.updated",
        )
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .map((event) => {
          const author = this.users.find((candidate) => candidate.id === event.actorUserId)!;

          return {
            eventId: event.id,
            metadataJson: event.metadataJson,
            createdAt: event.createdAt,
            actorUserId: author.id,
            actorDisplayName: author.fullName,
            actorEmail: author.email,
          };
        });
    }

    if (normalizedQuery.includes("FROM ticket_comments")) {
      const [ticketId, includeInternalFlag] = bindings as [string, number];

      return this.ticketComments
        .filter(
          (comment) =>
            comment.ticketId === ticketId &&
            comment.archivedAt === null &&
            (includeInternalFlag === 1 || comment.visibility !== "internal"),
        )
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .map((comment) => {
          const author = this.users.find((candidate) => candidate.id === comment.authorUserId)!;

          return {
            commentId: comment.id,
            visibility: comment.visibility,
            bodyJson: comment.bodyJson,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            authorUserId: author.id,
            authorDisplayName: author.fullName,
            authorEmail: author.email,
          };
        });
    }

    if (normalizedQuery.includes("FROM attachments") && normalizedQuery.includes("attachments.id = ?")) {
      const [workspaceId, attachmentId] = bindings as [string, string];
      const attachment = this.attachments.find(
        (candidate) =>
          candidate.workspaceId === workspaceId &&
          candidate.id === attachmentId &&
          candidate.archivedAt === null,
      );

      if (!attachment) {
        return [];
      }

      const uploadedBy = this.users.find((candidate) => candidate.id === attachment.uploadedByUserId)!;
      const ticket = this.tickets.find((candidate) => candidate.id === attachment.linkedResourceId) ?? null;

      return [
        {
          attachmentId: attachment.id,
          linkedResourceType: attachment.linkedResourceType,
          linkedResourceId: attachment.linkedResourceId,
          r2ObjectKey: attachment.r2ObjectKey,
          visibility: attachment.visibility,
          filename: attachment.originalFilename,
          contentType: attachment.contentType,
          sizeBytes: attachment.sizeBytes,
          createdAt: attachment.createdAt,
          uploadedByUserId: uploadedBy.id,
          uploadedByDisplayName: uploadedBy.fullName,
          uploadedByEmail: uploadedBy.email,
          ticketVisibility: ticket?.visibility ?? null,
        },
      ];
    }

    if (normalizedQuery.includes("FROM attachments")) {
      const [workspaceId, ticketId, includeInternalFlag] = bindings as [string, string, number];

      return this.attachments
        .filter(
          (attachment) =>
            attachment.workspaceId === workspaceId &&
            attachment.linkedResourceType === "ticket" &&
            attachment.linkedResourceId === ticketId &&
            attachment.archivedAt === null &&
            (includeInternalFlag === 1 || attachment.visibility !== "internal"),
        )
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .map((attachment) => {
          const uploadedBy = this.users.find((candidate) => candidate.id === attachment.uploadedByUserId)!;

          return {
            attachmentId: attachment.id,
            visibility: attachment.visibility,
            filename: attachment.originalFilename,
            contentType: attachment.contentType,
            sizeBytes: attachment.sizeBytes,
            createdAt: attachment.createdAt,
            uploadedByUserId: uploadedBy.id,
            uploadedByDisplayName: uploadedBy.fullName,
            uploadedByEmail: uploadedBy.email,
          };
        });
    }

    if (normalizedQuery.includes("FROM tickets") && normalizedQuery.includes("tickets.id = ?")) {
      const [workspaceId, ticketId] = bindings as [string, string];
      const ticket = this.tickets.find(
        (candidate) =>
          candidate.workspaceId === workspaceId &&
          candidate.id === ticketId &&
          candidate.archivedAt === null,
      );

      if (!ticket) {
        return [];
      }

      const assigneeMember = ticket.assigneeMemberId
        ? this.workspaceMembers.find((candidate) => candidate.id === ticket.assigneeMemberId)
        : null;
      const assigneeUser = assigneeMember
        ? this.users.find((candidate) => candidate.id === assigneeMember.userId)
        : null;

      return [
        {
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          visibility: ticket.visibility,
          dueDate: ticket.dueDate,
          updatedAt: ticket.updatedAt,
          assigneeMemberId: assigneeMember?.id ?? null,
          assigneeUserId: assigneeUser?.id ?? null,
          assigneeDisplayName: assigneeUser?.fullName ?? null,
          assigneeEmail: assigneeUser?.email ?? null,
        },
      ];
    }

    if (normalizedQuery.includes("FROM tickets")) {
      let bindingIndex = 0;
      const workspaceId = bindings[bindingIndex++] as string;
      const includeInternalOnlyFlag = bindings[bindingIndex++] as number;
      const status = normalizedQuery.includes("LOWER(tickets.status) = LOWER(?)")
        ? (bindings[bindingIndex++] as string)
        : null;
      const priority = normalizedQuery.includes("LOWER(tickets.priority) = LOWER(?)")
        ? (bindings[bindingIndex++] as string)
        : null;
      const assigneeMemberId = normalizedQuery.includes("tickets.assignee_member_id = ?")
        ? (bindings[bindingIndex++] as string)
        : null;
      const searchPattern = normalizedQuery.includes("tickets.ticket_number LIKE ? ESCAPE '\\'")
        ? (bindings[bindingIndex++] as string)
        : null;

      return this.tickets
        .filter(
          (ticket) =>
            ticket.workspaceId === workspaceId &&
            ticket.archivedAt === null &&
            (includeInternalOnlyFlag === 1 || ticket.visibility !== "internal_only") &&
            (status === null || ticket.status.toLowerCase() === status.toLowerCase()) &&
            (priority === null || ticket.priority.toLowerCase() === priority.toLowerCase()) &&
            (assigneeMemberId === null || ticket.assigneeMemberId === assigneeMemberId) &&
            (searchPattern === null || this.matchesTicketSearch(ticket, searchPattern)),
        )
        .sort((left, right) => this.compareListedTickets(left, right, normalizedQuery))
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
            visibility: ticket.visibility,
            updatedAt: ticket.updatedAt,
            assigneeMemberId: assigneeMember?.id ?? null,
            assigneeUserId: assigneeUser?.id ?? null,
            assigneeDisplayName: assigneeUser?.fullName ?? null,
            assigneeEmail: assigneeUser?.email ?? null,
          };
        });
    }

    if (
      normalizedQuery.includes("FROM workspace_members") &&
      normalizedQuery.includes("workspace_members.workspace_id = ?") &&
      normalizedQuery.includes("users.status = 'active'")
    ) {
      const [workspaceId] = bindings as [string];

      return this.workspaceMembers
        .filter(
          (member) =>
            member.workspaceId === workspaceId &&
            member.archivedAt === null &&
            member.memberStatus === "active",
        )
        .map((member) => {
          const user = this.users.find((candidate) => candidate.id === member.userId);

          return user
            ? {
                memberId: member.id,
                userId: user.id,
                displayName: user.fullName,
                email: user.email,
              }
            : null;
        })
        .filter((row): row is NonNullable<typeof row> => row !== null)
        .sort((left, right) => (left.displayName ?? left.email).localeCompare(right.displayName ?? right.email));
    }

    if (normalizedQuery.includes("WHERE workspace_members.user_id = ?") && normalizedQuery.includes("workspaces.slug = ?")) {
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

    if (normalizedQuery.includes("WHERE workspace_members.user_id = ?")) {
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

    if (normalizedQuery.includes("FROM workspaces") && !normalizedQuery.includes("workspace_members")) {
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

  private matchesTicketSearch(
    ticket: {
      ticketNumber: string;
      title: string;
      description: string | null;
    },
    searchPattern: string,
  ) {
    const normalizedSearch = searchPattern.replace(/^%|%$/g, "").replace(/\\([\\%_])/g, "$1").toLowerCase();

    return (
      ticket.ticketNumber.toLowerCase().includes(normalizedSearch) ||
      ticket.title.toLowerCase().includes(normalizedSearch) ||
      (ticket.description ?? "").toLowerCase().includes(normalizedSearch)
    );
  }

  private compareListedTickets(
    left: {
      updatedAt: string;
      ticketNumber: string;
      priority: string;
    },
    right: {
      updatedAt: string;
      ticketNumber: string;
      priority: string;
    },
    normalizedQuery: string,
  ) {
    if (normalizedQuery.includes("CASE LOWER(tickets.priority)")) {
      return (
        this.readPriorityRank(left.priority) - this.readPriorityRank(right.priority) ||
        right.updatedAt.localeCompare(left.updatedAt) ||
        right.ticketNumber.localeCompare(left.ticketNumber)
      );
    }

    if (normalizedQuery.includes("ORDER BY tickets.updated_at ASC")) {
      return left.updatedAt.localeCompare(right.updatedAt) || left.ticketNumber.localeCompare(right.ticketNumber);
    }

    return right.updatedAt.localeCompare(left.updatedAt) || right.ticketNumber.localeCompare(left.ticketNumber);
  }

  private readPriorityRank(priority: string) {
    switch (priority.toLowerCase()) {
      case "urgent":
        return 0;
      case "high":
        return 1;
      case "medium":
        return 2;
      case "low":
        return 3;
      default:
        return 4;
    }
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

  async run() {
    await this.database.execute(this.query, this.bindings);
    return {};
  }
}
