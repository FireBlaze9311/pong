import * as helpers from './helpers.js' 

const gameWidth = 1000
const gameHeight = 650

const ballSize = 30
const ballVelocity = 5

const barHeight = 100
const barWidth = 20
const barMargin = 30
const barVelocity = 8

const posBarRightX = gameWidth - barMargin - barWidth
const posBarLeftX = barMargin

const borderMargin = 10
const borderWidth = 5

const scoreSize = +(gameHeight / 7)

let scoreLeft = 0, scoreRight = 0

const root = document.getElementById('root')
let canvas = helpers.createCanvas(gameWidth, gameHeight)
root.appendChild(canvas)
let ctx = canvas.getContext('2d')
// foreground
ctx.fillStyle = '#ffffff'
ctx.font = `${scoreSize}px sans-serif`;


let ball = {
    posX: 0,
    posY: 0,
    direction: {
        x: 0.0,
        y: 0.0
    },
    draw: function() {
        ctx.fillRect(this.posX, this.posY, ballSize, ballSize)
    },
    move: function() {
        this.posX += ballVelocity * this.direction.x
        this.posY += ballVelocity * this.direction.y
    },
    setInitState: function(){
        this.posX = Math.floor((gameWidth - ballSize) / 2),
        this.posY = Math.floor((gameHeight - ballSize) / 2)
        this.direction.x = helpers.getRandomArbitrary(0.8, 1) * (Math.random() < 0.5) ? 1 : -1,
        this.direction.y = helpers.getRandomArbitrary(-1, 1)
        helpers.normalize(this.direction)
    },
    handleCollision: function(){
        if(this.posX <= posBarLeftX + barWidth && this.posX >= posBarLeftX &&
            this.posY + ballSize >= leftBar.posY && this.posY <= leftBar.posY + barHeight){
            let mid = leftBar.posY + barHeight/2
            let newDir = {
                x: barHeight * 0.8,
                y: (this.posY+ballSize/2-mid)
            }
            helpers.normalize(newDir)
            this.direction = newDir
        }
        if(Math.ceil(this.posX) <= 0){
            // left scored
            scoreRight++
            return true
        }
        else if(Math.ceil(this.posX + ballSize) >= gameWidth){
            // right scored
            scoreLeft++
            return true
        }
        else if(Math.ceil(this.posY) <= 0 || Math.ceil(this.posY + ballSize) >= gameHeight){
            // bounce back
            this.direction.y *= -1
            return false
        }
    }
}

let leftBar = {
    posY: 0,
    setInitState: function(){
        this.posY = (gameHeight - barHeight) / 2
    },
    draw: function(){
        ctx.fillRect(posBarLeftX, this.posY, barWidth, barHeight)
    },
    move: function(keyBuffer){
        let newPosY = this.posY
        if(keyBuffer[0]){
            newPosY -= barVelocity
        }
        else if(keyBuffer[1]){
            newPosY += barVelocity
        }
        else return
        if(newPosY + barHeight <= gameHeight && newPosY >= 0){
           this.posY = newPosY 
        }
    }
}

let rightBar = {
    posY: 0,
    setInitState: function(){
        this.posY = (gameHeight - barHeight) / 2
    },
    draw: function(){
        ctx.fillRect(posBarRightX, this.posY, barWidth, barHeight)
    }
}

let Key = {
    keyBuffer: Array(2).fill(false),
    updateBuff: function(state, k){
        if(k=== 'ArrowUp'){
            this.keyBuffer[0] = state
        }
        else if (k === 'ArrowDown'){
            this.keyBuffer[1] = state 
        }
    },
    keyDown: function(e){
        this.updateBuff(true, e.key)
    },
    keyUp: function(e){
        this.updateBuff(false, e.key)
    }
}

ball.setInitState()
leftBar.setInitState()
rightBar.setInitState()

window.requestAnimationFrame(gameLoop);
window.addEventListener('keydown', (e) => Key.keyDown(e), false);
window.addEventListener('keyup', (e) => Key.keyUp(e), false);

let t0 = performance.now();

function gameLoop() {
    let fps = 1/(performance.now()-t0)**-3
    t0 = performance.now();

    ball.move()
    leftBar.move(Key.keyBuffer)

    // clear
    ctx.clearRect(0, 0, gameWidth, gameHeight)    
    // render
    ball.draw()
    leftBar.draw()
    rightBar.draw()
    renderScore()
    renderBaseline(15)

    // collisions
    if(ball.handleCollision()){
        // scored
        ball.setInitState()
    }

    window.requestAnimationFrame(gameLoop);
}

function renderScore(){
    ctx.fillText(scoreLeft, gameWidth/4 - scoreSize/3, scoreSize)
    ctx.fillText(scoreRight, gameWidth * 0.75 - scoreSize/3, scoreSize)
}

function renderBaseline(n){
    let height = (gameHeight - (n+1) * borderMargin) / n
    for(let i=0; i<n+1; i++){
        ctx.fillRect((gameWidth-borderWidth)/2, i * borderMargin + (i-1)*height, borderWidth, height)
    }
}
