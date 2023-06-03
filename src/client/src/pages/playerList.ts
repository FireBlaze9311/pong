import Game from "./game";
import load from "../navigation";
import { IEvent, Page } from "../types";
import { Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents, User } from "../../../types";

export default class PlayerListPage implements Page {
    playerList: HTMLDivElement
    users: User[]
    socket: Socket<ServerToClientEvents, ClientToServerEvents>

    constructor(users: User[], socket: Socket<ServerToClientEvents, ClientToServerEvents>) {
        this.socket = socket
        this.users = users
        /*
        this.ws.register('invitation', this.onInvited.bind(this))
        this.ws.register('invitationAccepted', this.onInvitationAccepted.bind(this))
        */
    }

    onLoaded(): void {
        this.playerList = document.getElementById('playerList') as HTMLDivElement
        this.renderUsers()

        this.socket.on('userConnected', this.onUserConnected.bind(this))
        this.socket.on('userDisconnected', this.onUserDisconnected.bind(this))
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

    onPlayerClick(nickname: string): void {
        // invite player
        const event: IEvent = {
            type: "challenge",
            message: nickname
        }
        //this.socket.emit()
        //this.ws.send(event)
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

    onInvited(e: IEvent): void {
        const player = e.message
        if (confirm(`Accept invitation from ${player}?`)) {
            // send confirmation 
            const event: IEvent = {
                type: "acceptInvitation",
                message: player
            }
            //this.ws.send(event)
            //this.loadGame()
        }
        else {
            // send rejection 
            const event: IEvent = {
                type: "rejectInvitation",
                message: player
            }
            //this.ws.send(event)
        }
    }

    onInvitationAccepted(e: IEvent): void {
        this.loadGame()
    }

    loadGame(): void {
        //load(new Game(this.ws))
    }



    



}