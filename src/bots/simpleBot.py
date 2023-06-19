import socketio
import numpy as np

sio = socketio.Client()

sio.connect('http://localhost:5000', auth={'nickname': 'stdAlgoBot'})

leftBlockY: int = 0
rightBlockY: int = 0
blockHeight: int = 0
ballSize: int = 0

prevKey: int = 0
blockPos: int = 0


@sio.on('userConnected')
def on_user_connected(user: dict):
    # auto invite with player
    id = user.get('id')
    sio.emit('inviteUser', id)


@sio.on('gameInit')
def on_game_init(init: dict):
    global blockY, blockHeight, ballSize
    blockY = init.get('leftBlock').get('posY')
    blockHeight = init.get('leftBlock').get('height')
    ballSize = init.get('ball').get('size')
    print(ballSize)


@sio.on('invitation')
def on_message(user: dict):
    print(f'I was invited by {user.get("nickname")}!')
    sio.emit('acceptInvitation', user.get('id'))


tick = 0
@sio.on('ballPos')
def on_ball_position(pos: dict):
    global tick, ballSize, blockHeight, blockPos, rightBlockY, leftBlockY
    if tick >= 8:
        blockY = rightBlockY 
        if blockPos == 0:
            blockY = leftBlockY 
        if pos.get('y') + ballSize / 2 > blockY + blockHeight / 2:
            sendAction(1)
        else:
            sendAction(0)
        tick = 0
    tick += 1


def sendAction(action: int):
    print(action)
    global prevKey
    sio.emit('keyUp', prevKey)
    prevKey = action
    if action == 2:
        return
    sio.emit('keyDown', action)


@sio.on('rightBlockPos')
def on_right_block_pos_changed(pos: int):
    global rightBlockY
    rightBlockY = pos


@sio.on('leftBlockPos')
def on_left_block_pos_changed(pos: int):
    global leftBlockY
    leftBlockY = pos


@sio.on('blockPos')
def on_block_pos(pos: int):
    global blockPos
    blockPos = pos
