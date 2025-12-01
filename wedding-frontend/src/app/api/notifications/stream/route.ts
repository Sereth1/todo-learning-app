import { NextRequest } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Disable body parsing for streaming
export const runtime = "nodejs";

/**
 * SSE endpoint for notifications using polling on the backend.
 * This creates a proper SSE stream that polls the backend API.
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return new Response(
      formatSSE("error", { message: "Not authenticated" }),
      {
        status: 401,
        headers: sseHeaders(),
      }
    );
  }

  // Get wedding ID from query params
  const weddingId = request.nextUrl.searchParams.get("wedding");

  // Create a TransformStream for SSE
  const encoder = new TextEncoder();
  let isConnectionClosed = false;
  let lastNotificationId = 0;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode(
        formatSSE("connected", { 
          message: "Connected to notification stream",
          wedding_id: weddingId,
          timestamp: new Date().toISOString(),
        })
      ));

      // Fetch initial unread count
      try {
        const countResult = await fetchUnreadCount(token, weddingId);
        if (countResult !== null) {
          controller.enqueue(encoder.encode(
            formatSSE("unread_count", { count: countResult })
          ));
        }
      } catch (e) {
        console.error("[SSE] Failed to fetch initial count:", e);
      }

      // Polling loop
      const pollInterval = setInterval(async () => {
        if (isConnectionClosed) {
          clearInterval(pollInterval);
          return;
        }

        try {
          // Fetch new notifications
          const notifications = await fetchNewNotifications(token, weddingId, lastNotificationId);
          
          for (const notification of notifications) {
            controller.enqueue(encoder.encode(
              formatSSE("notification", notification)
            ));
            if (notification.id > lastNotificationId) {
              lastNotificationId = notification.id;
            }
          }

          // Update unread count if there were new notifications
          if (notifications.length > 0) {
            const count = await fetchUnreadCount(token, weddingId);
            if (count !== null) {
              controller.enqueue(encoder.encode(
                formatSSE("unread_count", { count })
              ));
            }
          }
        } catch (e) {
          console.error("[SSE] Poll error:", e);
        }
      }, 5000); // Poll every 5 seconds

      // Heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        if (isConnectionClosed) {
          clearInterval(heartbeatInterval);
          return;
        }
        
        try {
          controller.enqueue(encoder.encode(
            formatSSE("heartbeat", { timestamp: new Date().toISOString() })
          ));
        } catch {
          // Connection closed
          isConnectionClosed = true;
          clearInterval(heartbeatInterval);
          clearInterval(pollInterval);
        }
      }, 30000); // Heartbeat every 30 seconds

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        isConnectionClosed = true;
        clearInterval(pollInterval);
        clearInterval(heartbeatInterval);
        controller.close();
      });
    },
    
    cancel() {
      isConnectionClosed = true;
    }
  });

  return new Response(stream, {
    headers: sseHeaders(),
  });
}

function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  };
}

function formatSSE(event: string, data: object): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function fetchUnreadCount(token: string, weddingId: string | null): Promise<number | null> {
  try {
    let url = `${API_URL}/wedding_planner/notifications/unread-count/`;
    if (weddingId) {
      url += `?wedding=${weddingId}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.unread_count;
    }
  } catch (e) {
    console.error("[SSE] fetchUnreadCount error:", e);
  }
  return null;
}

async function fetchNewNotifications(
  token: string, 
  weddingId: string | null, 
  afterId: number
): Promise<Array<{ id: number; [key: string]: unknown }>> {
  try {
    let url = `${API_URL}/wedding_planner/notifications/?ordering=-id&limit=10`;
    if (weddingId) {
      url += `&wedding=${weddingId}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      // Filter to only new notifications
      const notifications = Array.isArray(data) ? data : data.results || [];
      return notifications.filter((n: { id: number }) => n.id > afterId);
    }
  } catch (e) {
    console.error("[SSE] fetchNewNotifications error:", e);
  }
  return [];
}
