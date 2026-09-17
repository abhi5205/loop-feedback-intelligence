import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { SessionUser } from "@/types";

export interface AuthContext {
  user: SessionUser;
  workspaceId: string;
}

/**
 * Validates that a user is authenticated and belongs to an active workspace.
 * Returns AuthContext or a 401 NextResponse if unauthenticated.
 */
export async function requireAuth(): Promise<AuthContext | NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Authentication required", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  const user = session.user as unknown as SessionUser;

  if (!user.workspaceId) {
    return NextResponse.json(
      { error: "No active workspace associated with session", code: "NO_WORKSPACE" },
      { status: 403 }
    );
  }

  return {
    user,
    workspaceId: user.workspaceId,
  };
}

/**
 * Validates that the authenticated user has one of the allowed roles.
 * Returns AuthContext or 401/403 NextResponse.
 */
export async function requireRole(allowedRoles: Role[]): Promise<AuthContext | NextResponse> {
  const auth = await requireAuth();

  if (auth instanceof NextResponse) {
    return auth;
  }

  if (!allowedRoles.includes(auth.user.role as Role)) {
    return NextResponse.json(
      {
        error: `Access forbidden: action requires one of [${allowedRoles.join(", ")}], but your role is ${auth.user.role}`,
        code: "FORBIDDEN",
      },
      { status: 403 }
    );
  }

  return auth;
}

/**
 * Convenience guards
 */
export const requireAdmin = () => requireRole([Role.ADMIN]);
export const requireAnalystOrAdmin = () => requireRole([Role.ADMIN, Role.ANALYST]);
export const requireAnyRole = () => requireRole([Role.ADMIN, Role.ANALYST, Role.VIEWER]);
