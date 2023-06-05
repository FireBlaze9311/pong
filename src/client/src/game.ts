import { GameInitialization } from "../types";

export default class Game {
    private readonly BASELINE_MARGIN = 10
    private readonly BASELINE_WIDTH = 5
    private readonly N_BASELINE_STRIPS = 15
    private readonly FOREGROUND = '#ffffff'

    readonly ctx: CanvasRenderingContext2D
    readonly initData: GameInitialization 

    readonly height: number
    readonly width: number

    private readonly scoreSize: number
    private readonly scoreLeftX: number
    private readonly scoreRightX: number

    private readonly baselineHeight: number
    private readonly baselineX: number

    readonly rightBlockX: number

    scoreLeft: number = 0
    scoreRight: number = 0

    leftBlockY: number
    rightBlockY: number

    ballPosX: number
    ballPosY: number

    constructor(init: GameInitialization, ctx: CanvasRenderingContext2D) {
        this.initData = init 
        this.ctx = ctx
        this.height = init.height
        this.width = init.width
        this.leftBlockY = init.leftBlock.posY
        this.rightBlockY = init.rightBlock.posY
        this.rightBlockX = this.width - init.rightBlock.margin - init.rightBlock.width

        this.scoreSize = this.height / 7
        this.scoreLeftX = this.width / 4 - this.scoreSize / 3
        this.scoreRightX = this.width * 0.75 - this.scoreSize / 3

        this.baselineHeight = (this.height - (this.N_BASELINE_STRIPS + 1) * this.BASELINE_MARGIN) / this.N_BASELINE_STRIPS
        this.baselineX = (this.width - this.BASELINE_WIDTH) / 2
    }

    init(): void {
        // foreground
        this.ctx.fillStyle = this.FOREGROUND
        this.ctx.font = `${this.scoreSize}px sans-serif`;
        this.renderBaseline()
    }

    clear(): void {
        this.ctx.clearRect(0, 0, this.width, this.height)
    }

    render(): void {
        this.clear()
        this.renderBaseline()
        this.renderBall()
        this.renderScore()
        this.renderLeftBlock()
        this.renderRightBlock()
    }

    renderBall(): void {
        this.ctx.fillRect(this.ballPosX, this.ballPosY, this.initData.ball.size, this.initData.ball.size)
    }

    renderBaseline(): void {
        for (let i = 0; i < this.N_BASELINE_STRIPS + 1; i++) {
            this.ctx.fillRect(this.baselineX, i * this.BASELINE_MARGIN + (i - 1) * this.baselineHeight, this.BASELINE_WIDTH, this.baselineHeight)
        }
    }

    renderScore(): void {
        this.ctx.fillText(this.scoreLeft.toString(), this.scoreLeftX, this.scoreSize)
        this.ctx.fillText(this.scoreRight.toString(), this.scoreRightX, this.scoreSize)
    }

    renderLeftBlock(): void {
        this.ctx.fillRect(this.initData.leftBlock.margin, this.leftBlockY, this.initData.leftBlock.width, this.initData.leftBlock.height)
    }

    renderRightBlock(): void {
        this.ctx.fillRect(this.rightBlockX, this.rightBlockY, this.initData.rightBlock.width, this.initData.rightBlock.height)
    }
}