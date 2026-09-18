import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { NextResponse } from "next/server";

/**
 * GET /api/feedback/stream
 * Server-Sent Events endpoint — streams live feedback event notifications
 * to connected clients within the same workspace (tenant-isolated).
 *
 * Clients receive JSON events whenever feedback is simulated or imported.
 * Uses a global in-memory event bus (suitable for single-instance dev/Vercel).
 */

import { subscribers, broadcastToWorkspace } from "@/lib/sse";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const workspaceId = auth.workspaceId;

  const stream = new ReadableStream({
    start(controller) {
      // Register subscriber
      if (!subscribers.has(workspaceId)) {
        subscribers.set(workspaceId, new Set());
      }
      subscribers.get(workspaceId)!.add(controller);

      // Send initial heartbeat so client knows connection is alive
      const heartbeat = `data: ${JSON.stringify({ type: "connected", workspaceId })}\n\n`;
      controller.enqueue(new TextEncoder().encode(heartbeat));

      // Cleanup on disconnect
      req.signal.addEventListener("abort", () => {
        subscribers.get(workspaceId)?.delete(controller);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
