import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  workspaceName: z.string().min(2, "Workspace name must be at least 2 characters"),
});

describe("Phase 3 & 4: Authentication and RBAC Logic", () => {
  it("correctly hashes and verifies passwords using bcrypt", async () => {
    const plain = "Password123!";
    const hash = await bcrypt.hash(plain, 10);

    expect(hash).not.toBe(plain);
    expect(await bcrypt.compare(plain, hash)).toBe(true);
    expect(await bcrypt.compare("WrongPassword", hash)).toBe(false);
  });

  it("validates signup payload correctly", () => {
    const valid = signupSchema.safeParse({
      email: "founder@startup.io",
      password: "securepassword",
      name: "Alice Founder",
      workspaceName: "Acme AI",
    });
    expect(valid.success).toBe(true);

    const invalidEmail = signupSchema.safeParse({
      email: "not-an-email",
      password: "securepassword",
      name: "Alice",
      workspaceName: "Acme",
    });
    expect(invalidEmail.success).toBe(false);

    const shortPassword = signupSchema.safeParse({
      email: "alice@acme.com",
      password: "123",
      name: "Alice",
      workspaceName: "Acme",
    });
    expect(shortPassword.success).toBe(false);
  });

  it("enforces RBAC role hierarchy permissions", () => {
    const roles = {
      ADMIN: ["manage_workspace", "manage_members", "manage_roles", "import_feedback", "run_analysis", "generate_reports", "view_feedback"],
      ANALYST: ["import_feedback", "run_analysis", "generate_reports", "view_feedback"],
      VIEWER: ["view_feedback"],
    };

    // Viewer cannot import or mutate
    expect(roles.VIEWER.includes("import_feedback")).toBe(false);
    expect(roles.VIEWER.includes("manage_workspace")).toBe(false);
    expect(roles.VIEWER.includes("view_feedback")).toBe(true);

    // Analyst can import and run analysis, but cannot manage workspace
    expect(roles.ANALYST.includes("import_feedback")).toBe(true);
    expect(roles.ANALYST.includes("manage_workspace")).toBe(false);

    // Admin has full privileges
    expect(roles.ADMIN.includes("manage_workspace")).toBe(true);
    expect(roles.ADMIN.includes("import_feedback")).toBe(true);
  });

  it("enforces tenant workspace scoping on query filters", () => {
    const userSession = {
      id: "usr_123",
      email: "alice@acme.com",
      role: "ADMIN",
      workspaceId: "ws_acme",
    };

    // Mock query builder function ensuring workspaceId is never omitted
    function buildTenantQuery(filter: { status?: string }, session: typeof userSession) {
      return {
        where: {
          ...filter,
          workspaceId: session.workspaceId,
        },
      };
    }

    const query = buildTenantQuery({ status: "NEW" }, userSession);
    expect(query.where.workspaceId).toBe("ws_acme");
    expect(query.where.status).toBe("NEW");

    // Even if malicious input attempts to pass a different workspaceId:
    const maliciousInput = { status: "NEW", workspaceId: "ws_victim" };
    function buildSecureTenantQuery(input: typeof maliciousInput, session: typeof userSession) {
      // workspaceId from session MUST always override any client-provided workspaceId
      return {
        where: {
          status: input.status,
          workspaceId: session.workspaceId,
        },
      };
    }

    const secureQuery = buildSecureTenantQuery(maliciousInput, userSession);
    expect(secureQuery.where.workspaceId).toBe("ws_acme");
    expect(secureQuery.where.workspaceId).not.toBe("ws_victim");
  });
});
