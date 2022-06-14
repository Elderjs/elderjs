import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';

type Reload = {
  type: 'reload';
};

type ComponentChange = {
  type: 'componentChange';
  file: string;
};

type PublicCssChange = {
  type: 'publicCssChange';
  file: string;
};

export type WSData = Reload | ComponentChange | PublicCssChange;

export default function getWebsocket() {
  const server = createServer();
  const wss = new WebSocketServer({ server });
  server.listen(0);

  return {
    send: function sendData(data: WSData) {
      console.log('sending', data);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    },
    wss,
  };
}
