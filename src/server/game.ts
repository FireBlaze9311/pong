import { Vector } from "../types";
import { add, mul, normalize } from "./vector"
import { v4 as uuidv4 } from 'uuid';

export default class Game {
    private _score = { p1: 0, p2: 0 }
    public readonly rightBlockX: number

    public readonly ball: Ball
    public readonly leftBlock: Block
    public readonly rightBlock: Block
    public readonly width: number
    public readonly height: number
    public readonly id: string

    public onScoreChanged?: (scoreP1: number, scoreP2: number) => void

    constructor(config: GameConfiguration) {
        this.id = uuidv4()

        this.width = config.width
        this.height = config.height

        this.ball = new Ball(
            this,
            config.ball_size,
            config.ball_velocity,
        )

        this.leftBlock = new Block(
            this,
            config.block_height,
            config.block_width,
            config.block_velocity,
            config.block_margin,
        )

        this.rightBlock = new Block(
            this,
            config.block_height,
            config.block_width,
            config.block_velocity,
            config.block_margin,
        )

        this.rightBlockX = this.width - this.rightBlock.margin - this.rightBlock.width
    }

    public increaseScoreP1() {
        this._score.p1++
        this.onScoreChanged?.(this._score.p1, this._score.p2)
    }

    public increaseScoreP2() {
        this._score.p2++
        this.onScoreChanged?.(this._score.p1, this._score.p2)
    }
}

class Ball {
    private readonly game: Game
    private velocity: number
    private _pos: Vector = { x: 0, y: 0 }
    private direction: Vector = { x: 0, y: 0 }

    public readonly size: number
    public onPosChanged?: (newPos: Vector) => void

    constructor(game: Game, size: number, velocity: number) {
        this.game = game
        this.size = size
        this.velocity = velocity
        this.setInitState()
    }

    public get pos(): Vector {
        return this._pos
    }

    private set pos(vector: Vector) {
        this._pos = vector
        this.onPosChanged?.(vector)
    }

    private setInitState(): void {
        this.pos.x = (this.game.width - this.size) / 2
        this.pos.y = (this.game.height - this.size) / 2
        this.direction.x = (0.8 + Math.random() * 0.2) * (Math.random() < 0.5 ? -1 : 1)
        this.direction.y = -1 + Math.random() * 2
        normalize(this.direction)
    }

    public move(): void {
        this.pos = add(this.pos, mul(this.direction, this.velocity))
        this.handleCollision()
    }

    private handleCollision(): void {
        // wall collision
        if (this.pos.y <= 0 || this.pos.y + this.size >= this.game.height) {
            this.direction.y *= -1
            return
        }
        // scores
        else if (this.pos.x + this.size >= this.game.width) {
            // left scored
            this.game.increaseScoreP1()
        }
        else if (this.pos.x <= 0) {
            // right scored
            this.game.increaseScoreP2()
        }
        // left block collision
        else if (this.pos.x <= this.game.leftBlock.margin + this.game.leftBlock.width
            && this.pos.x >= this.game.leftBlock.margin
            && this.pos.y + this.game.ball.size >= this.game.leftBlock.posY
            && this.pos.y <= this.game.leftBlock.posY + this.game.leftBlock.height) {
            let mid = this.game.leftBlock.posY + this.game.leftBlock.height / 2
            let newDir: Vector = {
                x: this.game.leftBlock.height * 0.8,
                y: (this.game.ball.pos.y + this.game.ball.size / 2) - mid
            }
            normalize(newDir)
            this.direction = newDir
            return
        }
        // right block collision
        else if (this.pos.x + this.size >= this.game.rightBlockX
            && this.pos.x <= this.game.rightBlockX + this.game.rightBlock.width
            && this.pos.y + this.game.ball.size >= this.game.rightBlock.posY
            && this.pos.y <= this.game.rightBlock.posY + this.game.rightBlock.height) {
            let mid = this.game.rightBlock.posY + this.game.rightBlock.height / 2
            let newDir: Vector = {
                x: this.game.rightBlock.height * -0.8,
                y: (this.game.ball.pos.y + this.game.ball.size / 2) - mid
            }
            normalize(newDir)
            this.direction = newDir
            return
        }
        else {
            return
        }
        this.setInitState()
        this.game.leftBlock.setInitState()
        this.game.rightBlock.setInitState()
    }
}

class Block {
    private readonly game: Game
    public readonly height: number
    public readonly width: number
    private readonly velocity: number
    private _posY: number = 0

    public readonly margin: number
    public onPosChanged?: (newPosY: number) => void

    constructor(game: Game,
        height: number,
        width: number,
        velocity: number,
        margin: number) {

        this.game = game
        this.height = height
        this.velocity = velocity
        this.margin = margin
        this.width = width
        this.setInitState()
    }

    private set posY(value: number) {
        this._posY = value
        this.onPosChanged?.(value)
    }

    public get posY(): number {
        return this._posY
    }

    public setInitState() {
        this.posY = (this.game.height - this.height) / 2
    }

    public move(direction: BlockDirection) {
        let newPosY = this.posY
        if (direction == BlockDirection.DOWN) {
            newPosY += this.velocity
        }
        else {
            newPosY -= this.velocity
        }
        if (newPosY + this.height <= this.game.height && newPosY >= 0) {
            this.posY = newPosY
        }
    }
}

export interface GameConfiguration {
    width: number
    height: number
    ball_size: number
    ball_velocity: number
    block_height: number
    block_width: number
    block_margin: number
    block_velocity: number
}

export enum BlockDirection {
    UP,
    DOWN
}