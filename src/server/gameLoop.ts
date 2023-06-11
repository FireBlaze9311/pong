import { GameInitialization, IKey, Key } from "../types"
import Game, { BlockDirection, GameConfiguration } from "./game"

const gameConfig: GameConfiguration = {
    width: 1000,
    height: 650,
    ball_size: 30,
    ball_velocity: 4,
    block_height: 100,
    block_width: 20,
    block_margin: 30,
    block_velocity: 8
}

const game = new Game(gameConfig)

const gameInit: GameInitialization = {
    width: game.width,
    height: game.height,
    ball: {
        size: game.ball.size,
        pos: [game.ball.pos.x, game.ball.pos.y],
    },
    leftBlock: {
        height: game.leftBlock.height,
        width: game.leftBlock.width,
        margin: game.leftBlock.margin,
        posY: game.leftBlock.posY
    },
    rightBlock: {
        height: game.rightBlock.height,
        width: game.rightBlock.width,
        margin: game.rightBlock.margin,
        posY: game.rightBlock.posY
    }
}

const keyBuffer = new Map<string, IKey>()
keyBuffer.set('right', { arrowDown: false, arrowUp: false })
keyBuffer.set('left', { arrowDown: false, arrowUp: false })

process.on('message', message => {
    const event = JSON.parse(message.toString())
    if (event.key == Key.ArrowDown) {
        keyBuffer.get(event.pos).arrowDown = event.type == 'down'
    }
    else {
        keyBuffer.get(event.pos).arrowUp = event.type == 'down'
    }
})

process.send(JSON.stringify({ type: 'gameInit', data: gameInit, id: game.id }))

game.onScoreChanged = (s1, s2) => {
    process.send(JSON.stringify({ type: 'score', s1: s1, s2: s2 }))
}
game.ball.onPosChanged = pos => {
    process.send(JSON.stringify({ type: 'ballPos', pos: pos }))
}
game.leftBlock.onPosChanged = posY => {
    process.send(JSON.stringify({ type: 'leftBlockPos', posY: posY }))
}
game.rightBlock.onPosChanged = posY => {
    process.send(JSON.stringify({ type: 'rightBlockPos', posY: posY }))
}

setInterval(() => {
    game.ball.move()
    if (keyBuffer.get('left').arrowDown) {
        game.leftBlock.move(BlockDirection.DOWN)
    }
    else if (keyBuffer.get('left').arrowUp) {
        game.leftBlock.move(BlockDirection.UP)
    }
    else if (keyBuffer.get('right').arrowUp) {
        game.rightBlock.move(BlockDirection.UP)
    }
    else if (keyBuffer.get('right').arrowDown) {
        game.rightBlock.move(BlockDirection.DOWN)
    }
}, 15)