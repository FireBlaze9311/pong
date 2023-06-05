import Game from "./game";
import load from "../navigation";
import { Page } from "../types";
import { Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents, User } from "../../../types";

export default class PlayerListPage implements Page {
    playerList: HTMLDivElement
    users: User[]
    socket: Socket<ServerToClientEvents, ClientToServerEvents>

    constructor(users: User[], socket: Socket<ServerToClientEvents, ClientToServerEvents>) {
        this.socket = socket
        this.users = users
    }

    onLoaded(): void {
        this.playerList = document.getElementById('playerList') as HTMLDivElement
        this.renderUsers()

        this.socket.on('userConnected', this.onUserConnected.bind(this))
        this.socket.on('userDisconnected', this.onUserDisconnected.bind(this))
        this.socket.on('invitation', this.onInvited.bind(this))
        this.socket.on('invitationAccepted', this.onInvitationAccepted.bind(this))
    }

    render(): string {
        return (
            `<h1>Players<h1>
            <div id="playerList">
            </div>
            `
        )
    }

    renderUsers(): void {
        let elements: string[] = this.users.map(u => `<div class="lstPlayer" id="${u.id}">${u.nickname}</div>`)
        this.playerList.innerHTML = elements.join('')

        const lstPlayers: HTMLDivElement[] = Array.from(document.getElementsByClassName('lstPlayer') as HTMLCollectionOf<HTMLDivElement>);

        lstPlayers.forEach((player: HTMLDivElement) => {
            player.onclick = () => this.onPlayerClick(player.id)
        })
    }

    onPlayerClick(id: string): void {
        // todo: visualize invitation sent
        this.socket.emit('inviteUser', id)
    }

    onUserConnected(user: User): void {
        this.users.push(user)
        this.renderUsers()
    }

    onUserDisconnected(user: User): void{
        const index = this.users.indexOf(user)
        this.users.splice(index, 1)
        this.renderUsers()
    }

    onInvited(user: User): void {
        // visualize
        if (confirm(`Accept invitation from ${user.nickname}?`)) {
            this.socket.emit('acceptInvitation', user.id)
            this.loadGame()
        }
        else {
            this.socket.emit('rejectInvitation', user.id)
        }
    }

    onInvitationAccepted(user: User): void {
        // todo: visualize
        this.loadGame()
    }

    loadGame(): void {
        load(new Game(this.socket))
    }

    destroy(): void {
        this.socket.off('userConnected')
        this.socket.off('userDisconnected')
        this.socket.off('invitation')
        this.socket.off('invitationAccepted')
    }
}