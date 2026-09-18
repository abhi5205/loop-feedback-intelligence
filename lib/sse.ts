// In-memory subscriber registry: workspaceId -> Set of ReadableStream controllers
export const subscribers = new Map<string, Set<ReadableStreamDefaultController>>();

/**
 * Broadcasts an SSE payload to all active clients connected in a specific workspace.
 */
export function broadcastToWorkspace(workspaceId: string, event: object) {
  const controllers = subscribers.get(workspaceId);
  if (!controllers || controllers.size === 0) return;

  const payload = `data: ${JSON.stringify(event)}\n\n`;
  controllers.forEach((ctrl) => {
    try {
      ctrl.enqueue(new TextEncoder().encode(payload));
    } catch {
      // Controller closed — will be cleaned up on client disconnect
    }
  });
}
