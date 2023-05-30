import IEvent from "./IEvent";
import EventHandler from "./eventHandler";

export default class WebSocketGameController{
    private ws: WebSocket | null
    private nickname: string | null
    private eventHandler: EventHandler = new EventHandler()
    onError: (e: Event) => void
    onConnectionClose: (e: Event) => void

    connect(hostname: string, nickname: string){
        this.nickname = nickname
        this.ws = new WebSocket(`ws://${hostname}:5000/`)
        this.ws.onopen = this.onConnectionOpen.bind(this)
        this.ws.onmessage = this.eventHandler.handle.bind(this.eventHandler)
        this.ws.onerror = this.onError
        this.ws.onclose = this.onConnectionClose
        this.register('error', this.onErrorReceived.bind(this))
    }

    send(e: IEvent){
        this.ws?.send(JSON.stringify(e))
    }

    private onConnectionOpen(e: Event): void {
        if(this.nickname != null){
            this.send({type: 'join', message: this.nickname})
        }
        else{
            throw new Error("Nickname not provided.")
        }
    }

    private onErrorReceived(e: IEvent): void {
        console.warn(e.message)
    }

    register(type: string, handler: (event: Event) => void): void {
        this.eventHandler.register(type, handler)
    }
}