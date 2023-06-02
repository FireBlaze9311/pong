import { Server } from 'socket.io';
import { createServer } from "http";

const httpServer = createServer();

const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>(httpServer);

io.on('connection', (socket) => {
  console.log('a user connected');
});

httpServer.listen(5000);