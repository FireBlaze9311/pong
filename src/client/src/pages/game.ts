import Game from "../../game";
import { Page, IEvent, GameConfigurationData } from "../types";
import { createCanvas } from "../utils";

export default class GamePage implements Page {
    canvas: HTMLCanvasElement
    rootElement: HTMLDivElement
    game: Game

    constructor() {
        /*
        this.ws.register('initGame', this.initGame.bind(this))
        this.ws.register('ballPos', this.onBallPosChanged.bind(this))
        this.ws.register('score', this.onScoreChanged.bind(this))
        this.ws.register('leftBlockPos', this.onScoreChanged.bind(this))
        */
    }

    render(): string {
        return (
            `
            <div id='rootGame'></div>
            `
        )
    }

    onLoaded(): void {
        this.rootElement = document.getElementById('rootGame') as HTMLDivElement
    }

    initGame(e: IEvent): void {
        let gameData = e.data as GameConfigurationData
        // create canvas
        this.canvas = createCanvas(gameData.width, gameData.height)
        this.rootElement.appendChild(this.canvas)
        let ctx = this.canvas.getContext('2d')

        this.game = new Game(gameData, ctx)
        this.game.init()
    }

    onBallPosChanged(e: IEvent): void {
        this.game.ballPosX = e.data[0]
        this.game.ballPosY = e.data[1]
        this.game.render()
    }

    onScoreChanged(e: IEvent): void {
        this.game.scoreLeft = e.data[0]
        this.game.scoreRight = e.data[1]
        this.game.render()
    }

    onLeftBlockPosChanged(e: IEvent): void {
        this.game.leftBlockY = e.data
        this.game.render()
    }

    onRightBlockPosChanged(e: IEvent): void {
        this.game.rightBlockY = e.data
        this.game.render()
    }

}