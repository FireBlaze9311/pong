import { Page } from "../types";
import { io, Socket } from "socket.io-client";
import load from "../navigation";
import PlayerList from "./playerList";
import { AuthData, ClientToServerEvents, ServerToClientEvents, SocketData, User } from "../../../types"

export default class LoginPage implements Page {
    nickname: string | null
    socket: Socket<ServerToClientEvents, ClientToServerEvents>

    onLoaded(): void {
        (document.getElementById('ip') as HTMLInputElement).value = window.location.hostname;
        (document.getElementById('nickname') as HTMLInputElement).value = "testPlayer1";
        (document.getElementById('btnJoin')).onclick = this.connect.bind(this)
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

        this.socket = io(`http://${ip}:5000`);
        this.socket.on('connect_error', this.onConnectError.bind(this))
        this.socket.on('users', this.onUserListReceived.bind(this))

        let auth: AuthData = {'nickname': this.nickname}
        this.socket.auth = auth 

        this.socket.connect()
    }

    onUserListReceived(users: User[]){
        load(new PlayerList(users, this.socket))
    }

    onConnectError(err: Error){
        // todo: display error
        console.log(err.name, err.message)
    }

    destroy(): void {
        this.socket.off('connect_error')
    }
} 