import prisma from "@/lib/prisma";

/**
 * Validates whether a specific entity belongs to the requesting tenant workspace.
 * Prevents IDOR (Insecure Direct Object Reference) vulnerabilities.
 */
export async function assertFeedbackBelongsToWorkspace(
  feedbackId: string,
  workspaceId: string
): Promise<boolean> {
  const count = await prisma.feedback.count({
    where: {
      id: feedbackId,
      workspaceId: workspaceId,
    },
  });
  return count > 0;
}

export async function assertThemeBelongsToWorkspace(
  themeId: string,
  workspaceId: string
): Promise<boolean> {
  const count = await prisma.theme.count({
    where: {
      id: themeId,
      workspaceId: workspaceId,
    },
  });
  return count > 0;
}

export async function assertReportBelongsToWorkspace(
  reportId: string,
  workspaceId: string
): Promise<boolean> {
  const count = await prisma.report.count({
    where: {
      id: reportId,
      workspaceId: workspaceId,
    },
  });
  return count > 0;
}
