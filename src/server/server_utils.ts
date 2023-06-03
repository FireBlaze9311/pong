import { Server, Socket } from "socket.io"
import { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData, User } from "../types"

export function sendUserList(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    server: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {
    const users: User[] = []
    for (let [id, socket] of server.of("/").sockets) {
        users.push({
            id: id,
            nickname: socket.data.nickname,
        })
    }
    socket.emit('users', users)
}

export function broadcastConnection(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>){
    socket.broadcast.emit('userConnected', {id: socket.id, nickname: socket.data.nickname})
}

export function broadcastDisconnection(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>){
    socket.broadcast.emit('userDisconnected', {id: socket.id, nickname: socket.data.nickname})
}