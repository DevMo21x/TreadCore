export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import {
  initMqtt,
  getMessageStore,
  onMessage,
  onStatusChange,
  isMqttConnected,
} from '@/lib/mqtt/provider';

export function GET(req: NextRequest) {
  initMqtt();

  const stream = new ReadableStream({
    start(controller) {
      // Send current connection status to new clients
      controller.enqueue(
        `event: status\ndata: ${JSON.stringify({ connected: isMqttConnected() })}\n\n`
      );

      // Send current message store snapshot to new clients
      const store = getMessageStore();
      for (const [topic, value] of Object.entries(store)) {
        controller.enqueue(`data: ${JSON.stringify({ topic, value })}\n\n`);
      }

      // Unsubscribe functions
      const unsubscribeMessages = onMessage((topic, value) => {
        controller.enqueue(`data: ${JSON.stringify({ topic, value })}\n\n`);
      });

      const unsubscribeStatus = onStatusChange((connected) => {
        controller.enqueue(`event: status\ndata: ${JSON.stringify({ connected })}\n\n`);
      });

      // Keep-alive heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        controller.enqueue(':\n\n');
      }, 30000);

      // Cleanup on client disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        unsubscribeMessages();
        unsubscribeStatus();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
