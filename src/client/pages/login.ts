import IEvent from "../IEvent";
import Page from "../page";
import load from "../navigation";
import PlayerList from "./playerList";
import WebSocketGameController from "../webSocketGameController";

export default class LoginPage implements Page {
    wsg: WebSocketGameController = new WebSocketGameController() 
    nickname: string | null

    onLoaded(): void {
        (document.getElementById('ip') as HTMLInputElement).value = window.location.hostname;
        (document.getElementById('nickname') as HTMLInputElement).value = "testPlayer1";
        (document.getElementById('btnJoin')).onclick = this.connect.bind(this)

        this.wsg.register('joined', this.joined.bind(this))
        this.wsg.register('joinError', this.joinError.bind(this))
    }

    render(): string {
        return (
            `<label for="ip">IP-Address</label> 
        <input type="text" name="ip" id="ip">
        <br/>
        <label for="nickname">Nickname</label>
        <input type="text" name="nickname" id="nickname">
        <br/>
        <input type="button" value="Join" id="btnJoin">`)
    }

    connect(): void {
        let ip: string | null = (document.getElementById('ip') as HTMLInputElement).value
        this.nickname = (document.getElementById('nickname') as HTMLInputElement).value

        this.wsg.connect(ip, this.nickname)
        this.wsg.onError = this.onConnectingError
        this.wsg.onConnectionClose = this.onConnectionClosed.bind(this)
    }

    joinError(e: IEvent): void {
        alert(e.message)
    }

    joined(e: IEvent): void {
        load(new PlayerList(this.wsg))
    }

    onConnectionClosed(e: Event): void {
        load(this)
        alert('Connection closed.')
    }

    onConnectingError(e: Event): void {
        alert('Error connecting.')
    }
} 