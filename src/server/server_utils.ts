import { Server, Socket } from "socket.io"
import { ClientToServerEvents, GameInitialization, InterServerEvents, ServerToClientEvents, SocketData, User } from "../types"
import Game from "./game"

export function sendUserList(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    server: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {
    const users: User[] = []
    // get sockets in lobby room
    const lobbySockets = server.sockets.adapter.rooms.get('lobby')
    lobbySockets.forEach(id => {
        const so = server.sockets.sockets.get(id);
        if (id != socket.id) {
            users.push({
                id: id,
                nickname: so.data.nickname,
            })
        }
    })
    socket.emit('users', users)
}

export function broadcastConnection(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {
    socket.broadcast.to('lobby').emit('userConnected', { id: socket.id, nickname: socket.data.nickname })
}

export function broadcastDisconnection(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {
    socket.broadcast.to('lobby').emit('userDisconnected', { id: socket.id, nickname: socket.data.nickname })
}

export function removeInvitations(id: string, server: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {
    for (let [id, socket] of server.of('/').sockets) {
        const index = socket.data.invitations.indexOf(socket.id)
        if (index > -1) {
            socket.data.invitations.slice(index, 1)
        }
    }
}

export function sendGameInitialization(server: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, game: Game) {
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

    server.to(game.id).emit('gameInit', gameInit)
}