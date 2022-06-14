import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';

export type WSData = {
  type: 'refresh';
  [x: string]: unknown;
};

export default function getWebsocket() {
  const server = createServer();
  const wss = new WebSocketServer({ server });
  server.listen(0);

  return {
    send: function sendData(data: WSData) {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    },
    wss,
  };
}
