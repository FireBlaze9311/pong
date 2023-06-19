import load from "../navigation";
import { Page } from "../types";
import { Socket } from "socket.io-client";
import { ClientToServerEvents, GameWatchingData, ServerToClientEvents, User } from "../../../types";
import GamePage from "./gamePage";

export default class PlayerListPage implements Page {
    playerList: HTMLDivElement
    gameList: HTMLDivElement
    users: User[]
    games: GameWatchingData[]
    socket: Socket<ServerToClientEvents, ClientToServerEvents>
    dialog: HTMLDialogElement
    dialogMessage: HTMLDivElement
    acceptBtn: HTMLButtonElement
    user: User

    constructor(users: User[], socket: Socket<ServerToClientEvents, ClientToServerEvents>) {
        this.socket = socket
        this.users = users
    }

    onLoaded(): void {
        this.playerList = document.getElementById('playerList') as HTMLDivElement
        this.gameList = document.getElementById('games') as HTMLDivElement
        this.dialogMessage = document.getElementById('diaMessage') as HTMLDivElement
        this.dialog = document.getElementById('invitationDia') as HTMLDialogElement
        this.dialog.onclose = this.onAcceptInvitation.bind(this)
        this.acceptBtn = document.getElementById('acceptBtn') as HTMLButtonElement
        this.acceptBtn.onclick = (e) => {
            e.preventDefault()
            this.dialog.returnValue = this.acceptBtn.value
            this.dialog.close()
        }

        this.renderUsers()

        this.socket.on('userConnected', this.onUserConnected.bind(this))
        this.socket.on('userDisconnected', this.onUserDisconnected.bind(this))
        this.socket.on('invitation', this.onInvited.bind(this))
        this.socket.on('invitationAccepted', this.onInvitationAccepted.bind(this))
        this.socket.on('gameList', this.onGameListReceived.bind(this))
        this.socket.on('gameEnded', this.onGameEnded.bind(this))
        this.socket.on('gameCreated', this.onGameAdded.bind(this))
    }

    render(): string {
        return (
            `
            <div class="playerList">
                <h1>Players</h1>
                <div id="playerList"></div>
                <br>
                <h1>Watch Game</h1>
                <div id="games"></div>
                <dialog id="invitationDia">
                    <form>
                        <div id="diaMessage"></div>
                        <button class="btnDia" formmethod="dialog" value="reject">Reject</button>
                        <button class="btnDia" value="accept" id="acceptBtn">Accept</input>
                    </form<
                </dialog>
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

    renderGames(): void {
        let elements: string[] = this.games.map(e => `<div class="lstGame" id="${e.id}">${e.id}</div>`)
        this.gameList.innerHTML = elements.join('')

        const lstGames: HTMLDivElement[] = Array.from(document.getElementsByClassName('lstGame') as HTMLCollectionOf<HTMLDivElement>);

        lstGames.forEach((game: HTMLDivElement) => {
            game.onclick = () => this.watchGame(game.id)
        })
    }

    onGameListReceived(data: GameWatchingData[]) {
        this.games = data
        this.renderGames()
    }

    onGameAdded(game: GameWatchingData) {
        this.games.push(game)
        this.renderGames()
    }

    onGameEnded(id: string) {
        const idx = this.games.findIndex(e => e.id == id)
        if (idx > -1) {
            this.games.splice(idx, 1)
        }
        this.renderGames()
    }

    watchGame(id: string): void {
        this.socket.emit('watchGame', id)
        const idx = this.games.findIndex(e => e.id == id)
        load(new GamePage(this.socket, this.games[idx].init))
    }

    onPlayerClick(id: string): void {
        // todo: visualize invitation sent
        this.socket.emit('inviteUser', id)
    }

    onUserConnected(user: User): void {
        this.users.push(user)
        this.renderUsers()
    }

    onUserDisconnected(user: User): void {
        const index = this.users.indexOf(user)
        this.users.splice(index, 1)
        this.renderUsers()
    }

    onAcceptInvitation(){
        if(this.dialog.returnValue === "accept"){
            this.socket.emit('acceptInvitation', this.user.id)
            this.loadGame()
        } 
        else{
            this.socket.emit('rejectInvitation', this.user.id)
        }
    }

    onInvited(user: User): void {
        this.dialogMessage.innerHTML = `<h3>Accept Invitation from ${user.nickname}?</h3>`
        this.dialog.showModal()
        this.user = user
    }

    onInvitationAccepted(user: User): void {
        // todo: visualize
        this.loadGame()
    }

    loadGame(): void {
        load(new GamePage(this.socket))
    }

    destroy(): void {
        this.socket.off('userConnected')
        this.socket.off('userDisconnected')
        this.socket.off('invitation')
        this.socket.off('invitationAccepted')
        this.socket.off('gameList')
        this.socket.off('gameEnded')
        this.socket.off('gameCreated')
    }
}