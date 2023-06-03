import { Server, Socket } from 'socket.io';
import { createServer } from "http";
import { AuthData, ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData, User } from "../types"
import { broadcastConnection, broadcastDisconnection, sendUserList } from './server_utils';

const httpServer = createServer();

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData>(httpServer, {
    cors: {
      origin: "http://localhost:8080"
    }
  });

io.use((socket, next) => {
  const nickname = (socket.handshake.auth as AuthData).nickname
  for (let [_, socket] of io.of('/').sockets){
    if(socket.data.nickname == nickname){
      return next(new Error('Nickname is already taken or missing.'))
    }
  }
  socket.data.nickname = nickname;
  next();
});

io.on('connection', (socket) => {
  console.log('a user connected')
  broadcastConnection(socket)
  socket.on('disconnect', (reason) =>{
    console.log('a user disconnected')
    broadcastDisconnection(socket)
  })
  sendUserList(socket, io)
});

httpServer.listen(5000);