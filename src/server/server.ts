import { Server, Socket } from 'socket.io';
import { createServer } from "http";
import { AuthData, ClientToServerEvents, GameInitialization, InterServerEvents, ServerToClientEvents, SocketData } from "../types"
import * as utils from './server_utils';
import { spawn } from 'child_process';

const httpServer = createServer();

function enterGameLoop(s1: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, s2: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {

  const gameLoopProcess = spawn('node', ['./dist/server/gameLoop.js'], {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  })

  s1.data.gameLoopProcess = gameLoopProcess
  s2.data.gameLoopProcess = gameLoopProcess

  let id: string

  gameLoopProcess.on('message', message => {
    const data = JSON.parse(message.toString())
    switch (data.type) {
      case 'ballPos':
        io.to(id).emit('ballPos', data.pos)
        break
      case 'leftBlockPos':
        io.to(id).emit('leftBlockPos', data.posY)
        break
      case 'rightBlockPos':
        io.to(id).emit('rightBlockPos', data.posY)
        break
      case 'score':
        io.to(id).emit('score', data.s1, data.s2)
        break
      case 'gameInit':
        id = data.id
        s1.join(id)
        s2.join(id)
        io.to(id).emit('gameInit', data.data as GameInitialization)
        break
    }
  })

  s1.on('keyDown', k => {
    gameLoopProcess.send(JSON.stringify({ pos: 'left', type: 'down', key: k }))
  })
  s1.on('keyUp', k => {
    gameLoopProcess.send(JSON.stringify({ pos: 'left', type: 'up', key: k }))
  })
  s2.on('keyDown', k => {
    gameLoopProcess.send(JSON.stringify({ pos: 'right', type: 'down', key: k }))
  })
  s2.on('keyUp', k => {
    gameLoopProcess.send(JSON.stringify({ pos: 'right', type: 'up', key: k }))
  })

  process.stdin.pipe(gameLoopProcess.stdin);
}

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData>(httpServer, {
    cors: {
      origin: "*"
    }
  });

io.use((socket, next) => {
  const nickname = (socket.handshake.auth as AuthData).nickname
  for (let [_, socket] of io.of('/').sockets) {
    if (socket.data.nickname == nickname) {
      return next(new Error('Nickname is already taken or missing.'))
    }
  }
  socket.data.nickname = nickname;
  socket.data.invitations = []
  socket.join('lobby')
  next();
});

io.on('connection', (socket) => {
  utils.broadcastConnection(socket)
  socket.on('disconnect', reason => {
    console.log(`user with id ${socket.id} disconnected`)
    socket.data.gameLoopProcess?.kill()
    utils.broadcastDisconnection(socket)
    utils.removeInvitations(socket.id, io)
  })
  socket.on('inviteUser', id => {
    if (io.of('/').sockets.get(id) !== undefined) {
      if (!socket.data.invitations.includes(id)) {
        socket.data.invitations.push(id)
        io.to(id).emit('invitation', { id: socket.id, nickname: socket.data.nickname })
      }
    }
  })
  socket.on('acceptInvitation', id => {
    const target = io.of('/').sockets.get(id)
    if (target !== undefined) {
      if (target.data.invitations.includes(socket.id)) {
        target.emit('invitationAccepted', { id: socket.id, nickname: socket.data.nickname })
        // leave lobby 
        target.leave('lobby')
        socket.leave('lobby')
        utils.broadcastDisconnection(socket)
        utils.broadcastDisconnection(target)
        // start game
        enterGameLoop(socket, target)
      }
    }
  })
  socket.on('rejectInvitation', id => {
    const target = io.of('/').sockets.get(id)
    // remove from invitations
    if (target !== undefined) {
      const index = target.data.invitations.indexOf(socket.id)
      if (index > -1) {
        target.data.invitations.splice(index, 1)
      }
    }
  })
  utils.sendUserList(socket, io)
});

httpServer.listen(5000);