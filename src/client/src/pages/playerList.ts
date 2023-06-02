import Game from "./game";
import load from "../navigation";
import { IEvent, Page } from "../types";

export default class PlayerListPage implements Page {
    playerList: HTMLDivElement

    constructor() {
        /*
        this.ws = ws
        this.ws.register('playerList', this.onPlayerListReceived.bind(this))
        this.ws.register('invitation', this.onInvited.bind(this))
        this.ws.register('invitationAccepted', this.onInvitationAccepted.bind(this))
    */
    }

    onPlayerListReceived(e: IEvent): void {
        let list: string[] = e.data

        let elements: string[] = list.map(s => `<div class="lstPlayer" id="${s}">${s}</div>`)
        this.playerList.innerHTML = elements.join('')

        const lstPlayers: HTMLDivElement[] = Array.from(document.getElementsByClassName('lstPlayer') as HTMLCollectionOf<HTMLDivElement>);

        lstPlayers.forEach((player: HTMLDivElement) => {
            player.onclick = () => this.onPlayerClick(player.id)
        })
    }

    onInvited(e: IEvent): void {
        const player = e.message
        if(confirm(`Accept invitation from ${player}?`)){
            // send confirmation 
            const event: IEvent = {
                type: "acceptInvitation",
                message: player 
            }
            //this.ws.send(event)
            //this.loadGame()
        }
        else{
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

    render(): string {
        return (
            `<h1>Players<h1>
            <div id="playerList">
            </div>
            `
        )
    }

    onPlayerClick(nickname: string): void {
        // invite player
        const event: IEvent = {
            type: "challenge",
            message: nickname
        }
        //this.ws.send(event)
    }

    onLoaded(): void {
        this.playerList = document.getElementById('playerList') as HTMLDivElement
    }

}