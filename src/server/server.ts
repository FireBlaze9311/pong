import { Server, Socket } from 'socket.io';
import { createServer } from "http";
import { AuthData, BlockPosition, ClientToServerEvents, GameInitialization, GameWatchingData, InterServerEvents, Key, ServerToClientEvents, SocketData } from "../types"
import * as utils from './server_utils';
import Game, { BlockDirection, GameConfiguration } from './game';

const httpServer = createServer();

const games: GameWatchingData[] = []

function enterGameLoop(s1: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, s2: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {

  const gameConfig: GameConfiguration = {
    width: 1000,
    height: 650,
    ball_size: 30,
    ball_velocity: 4,
    block_height: 100,
    block_width: 20,
    block_margin: 30,
    block_velocity: 8
  }

  const game = new Game(gameConfig)

  const gameInit: GameInitialization = {
    width: game.width,
    height: game.height,
    ball: {
      size: game.ball.size,
      pos: [game.ball.pos.x, game.ball.pos.y],
    },
    leftBlock: {
      height: game.leftBlock.height,
      width: game.leftBlock.width,
      margin: game.leftBlock.margin,
      posY: game.leftBlock.posY
    },
    rightBlock: {
      height: game.rightBlock.height,
      width: game.rightBlock.width,
      margin: game.rightBlock.margin,
      posY: game.rightBlock.posY
    }
  }

  s1.data.gameId = game.id
  s2.data.gameId = game.id
  s1.join(game.id)
  s2.join(game.id)

  s1.emit('blockPos', BlockPosition.Left)
  s2.emit('blockPos', BlockPosition.Right)

  const data = { init: gameInit, id: game.id }
  games.push(data)
  s1.broadcast.emit('gameCreated', data)

  const keyBuffer = [[false, false], [false, false]]

  io.to(game.id).emit('gameInit', gameInit)

  game.onScoreChanged = (s1, s2) => {
    io.to(game.id).emit('score', s1, s2)
  }
  game.ball.onPosChanged = pos => {
    io.to(game.id).emit('ballPos', pos)
  }
  game.leftBlock.onPosChanged = posY => {
    io.to(game.id).emit('leftBlockPos', posY)
  }
  game.rightBlock.onPosChanged = posY => {
    io.to(game.id).emit('rightBlockPos', posY)
  }

  s1.on('keyDown', k => {
    setKeyBuffer(k, true, 0)
  })

  s1.on('keyUp', k => {
    setKeyBuffer(k, false, 0)
  })

  s2.on('keyDown', k => {
    setKeyBuffer(k, true, 1)
  })
  s2.on('keyUp', k => {
    setKeyBuffer(k, false, 1)
  })

  function setKeyBuffer(k: Key, value: boolean, player: number) {
    if (k == Key.ArrowDown) {
      keyBuffer[player][0] = value
    }
    else {
      keyBuffer[player][1] = value
    }
  }

  setInterval(() => {
    game.ball.move()
    if (keyBuffer[0][0]) {
      game.leftBlock.move(BlockDirection.DOWN)
    }
    else if (keyBuffer[0][1]) {
      game.leftBlock.move(BlockDirection.UP)
    }
    if (keyBuffer[1][0]) {
      game.rightBlock.move(BlockDirection.DOWN)
    }
    else if (keyBuffer[1][1]) {
      game.rightBlock.move(BlockDirection.UP)
    }

  }, 8)
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
  console.log(`user with id ${socket.id} connected`)
  utils.broadcastConnection(socket)
  socket.on('disconnect', reason => {
    console.log(`user with id ${socket.id} disconnected`)
    utils.broadcastDisconnection(socket)
    utils.removeInvitations(socket.id, io)

    // end game
    // remove from list
    const idx = games.findIndex(e => socket.data.gameId == e.id)

    if (idx > -1) {
      socket.broadcast.emit('gameEnded', games[idx].id)
      games.splice(idx, 1)
    }

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

  socket.on('watchGame', id => {
    // check if games exists
    if (games.findIndex(e => e.id == id) > -1) {
      socket.join(id)
    }
  })

  socket.on('unsubGame', id => {
    socket.leave(id)
  })

  utils.sendUserList(socket, io)
  socket.emit('gameList', games)

})

httpServer.listen(5000)