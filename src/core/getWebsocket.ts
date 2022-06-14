import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';

export default function getWebsocket(port = 8080) {
  const server = createServer();
  const wss = new WebSocketServer({ server });

  wss.on('connection', function connection(ws) {
    ws.on('open', () => {
      ws.send('hi');
    });
    ws.on('message', function message(data) {
      console.log('received: %s', data);
    });
  });

  server.listen(0);

  console.log('address', wss.address());
  return {
    send: function sendData(data) {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    },
    wss,
  };
}
