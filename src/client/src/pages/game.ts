import { Socket } from "socket.io-client";
import { ClientToServerEvents, GameInitialization, Key, ServerToClientEvents, Vector } from "../../../types";
import Game from "../../game";
import { Page } from "../types";
import { createCanvas } from "../utils";

export default class GamePage implements Page {
    canvas: HTMLCanvasElement
    rootElement: HTMLDivElement
    game: Game
    socket: Socket<ServerToClientEvents, ClientToServerEvents>

    constructor(socket: Socket<ServerToClientEvents, ClientToServerEvents>) {
        this.socket = socket
        document.addEventListener('keydown', this.onKeyDown.bind(this))
        document.addEventListener('keyup', this.onKeyUp.bind(this))
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
        this.socket.on('gameInit', this.initGame.bind(this))
        this.socket.on('ballPos', this.onBallPosChanged.bind(this))
        this.socket.on('score', this.onScoreChanged.bind(this))
        this.socket.on('leftBlockPos', this.onLeftBlockPosChanged.bind(this))
        this.socket.on('rightBlockPos', this.onRightBlockPosChanged.bind(this))
    }

    initGame(init: GameInitialization): void {
        // create canvas
        this.canvas = createCanvas(init.width, init.height)
        this.rootElement.appendChild(this.canvas)
        let ctx = this.canvas.getContext('2d')

        this.game = new Game(init, ctx)
        this.game.init()
    }

    onBallPosChanged(pos: Vector): void {
        this.game.ballPosX = pos.x
        this.game.ballPosY = pos.y
        this.game.render()
    }

    onScoreChanged(s1: number, s2: number): void {
        this.game.scoreLeft = s1
        this.game.scoreRight = s2
        this.game.render()
    }

    onLeftBlockPosChanged(posY: number): void {
        this.game.leftBlockY = posY
        this.game.render()
    }

    onRightBlockPosChanged(posY: number): void {
        this.game.rightBlockY = posY
        this.game.render()
    }

    onKeyDown(e: KeyboardEvent){
        if(e.key == 'ArrowDown'){
            this.socket.emit('keyDown', Key.ArrowDown)
        }
        else if(e.key == 'ArrowUp'){
            this.socket.emit('keyDown', Key.ArrowUp)
        }
    }

    onKeyUp(e: KeyboardEvent){
        if(e.key == 'ArrowDown'){
            this.socket.emit('keyUp', Key.ArrowDown)
        }
        else if(e.key == 'ArrowUp'){
            this.socket.emit('keyUp', Key.ArrowUp)
        }
    }

    destroy(): void { }

}