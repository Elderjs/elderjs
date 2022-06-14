import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';

export type WSData = {
  type: 'refresh';
  [x: string]: unknown;
};

export default function getWebsocket() {
  const server = createServer();
  const wss = new WebSocketServer({ server });

  wss.on('connection', function connection(ws) {
    ws.on('open', () => {
      ws.send('hi');
    });
    // ws.on('message', function message(data) {
    // console.log('received: %s', data);
    // });
  });

  server.listen(0);

  console.log('address', wss.address());
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
