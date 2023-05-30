from typing import List, Tuple, Dict, Any
from game import Game
from websockets.server import WebSocketServerProtocol
import json

async def broadcastEvent(event: Dict[str, Any], clients: List[WebSocketServerProtocol]):
    '''
    Broadcasts an event to all given clients.
    '''
    for client in clients:
        await client.send(json.dumps(event))


async def sendScore(score1: int, score2: int, clients: List[WebSocketServerProtocol]):
    '''
    Sends score to clients.
    '''
    event = {
        'type': 'score', 
        'data': (score1, score2)
    }
    await broadcastEvent(event, clients)


async def sendGameInitialization(game: Game, clients: List[WebSocketServerProtocol]):
    '''
    Sends game initialization data to clients.
    '''
    initEvent = {
        'type': 'initGame',
        'data': {
            'width': game.width,
            'height': game.height,
            'ball':{
                'size': game.ball.size,
                'pos': list(game.ball.pos)
            },
            'leftBlock': {
                'height': game.left_block.height,
                'width': game.left_block.width,
                'margin': game.left_block.margin,
                'posY': game.left_block.posY
            },
            'rightBlock': {
                'height': game.right_block.height,
                'width': game.right_block.width,
                'margin': game.right_block.margin,
                'posY': game.right_block.posY
            }
        }
    }
    await broadcastEvent(initEvent, clients)

async def sendBallPos(pos: Tuple[float, float], clients: List[WebSocketServerProtocol]):
    '''
    Sends the ball position to all clients.
    '''
    event = {
        'type': 'ballPos',
        'data': pos
    }
    await broadcastEvent(event, clients)

async def sendLeftBlockPos(posY: int, clients: List[WebSocketServerProtocol]):
    '''
    Sends left block position to all clients.
    '''
    event = {
        'type': 'leftBlockPos',
        'data': posY
    }
    await broadcastEvent(event, clients)

async def sendRightBlockPos(posY: int, clients: List[WebSocketServerProtocol]):
    '''
    Sends right block position to all clients.
    '''
    event = {
        'type': 'rightBlockPos',
        'data': posY
    }
    await broadcastEvent(event, clients)