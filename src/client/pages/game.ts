import { Page, IEvent } from "../types";
import WebSocketGameController from "../webSocketGameController";

export default class Game implements Page {
    ws: WebSocketGameController
    canvas: HTMLCanvasElement

    constructor(ws: WebSocketGameController) {
        this.ws = ws
        this.ws.register('initGame', this.initGame.bind(this))
    }

    render(): string {
        return (
            `
            <canvas id='game'></canvas>
            `
        )
    }

    onLoaded(): void {
        this.canvas = document.getElementById('game') as HTMLCanvasElement
    }

    initGame(e: IEvent): void {

    }

}