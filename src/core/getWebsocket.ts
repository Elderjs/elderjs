import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';

type Reload = {
  type: 'reload';
  file: string;
};

type ComponentChange = {
  type: 'componentChange';
  file: string;
};

type PublicCssChange = {
  type: 'publicCssChange';
  file: string;
};

type OtherCssFile = {
  type: 'otherCssFile';
  file: string;
};

export type WSData = Reload | ComponentChange | PublicCssChange | OtherCssFile;

export default function getWebsocket() {
  const server = createServer();
  const wss = new WebSocketServer({ server });
  wss.on('connection', function connection(ws) {
    ws.on('message', function message(data) {
      console.log('> (client) %s', data);
    });
  });

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
