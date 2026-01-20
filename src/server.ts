import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { onGameSocket } from './sockets/game.socket';

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

onGameSocket(io);

httpServer.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});
