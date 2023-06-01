from typing import List, Tuple, Dict, Any
from game import Game
from websockets.sync.server import ServerConnection
import json

def broadcastEvent(event: Dict[str, Any], clients: List[ServerConnection]):
    '''
    Broadcasts an event to all given clients.
    '''
    for client in clients:
        client.send(json.dumps(event))


def sendScore(score1: int, score2: int, clients: List[ServerConnection]):
    '''
    Sends score to clients.
    '''
    event = {
        'type': 'score', 
        'data': (score1, score2)
    }
    broadcastEvent(event, clients)


def sendGameInitialization(game: Game, clients: List[ServerConnection]):
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
    broadcastEvent(initEvent, clients)

def sendBallPos(pos: Tuple[float, float], clients: List[ServerConnection]):
    '''
    Sends the ball position to all clients.
    '''
    event = {
        'type': 'ballPos',
        'data': pos
    }
    broadcastEvent(event, clients)

def sendLeftBlockPos(posY: int, clients: List[ServerConnection]):
    '''
    Sends left block position to all clients.
    '''
    event = {
        'type': 'leftBlockPos',
        'data': posY
    }
    broadcastEvent(event, clients)

def sendRightBlockPos(posY: int, clients: List[ServerConnection]):
    '''
    Sends right block position to all clients.
    '''
    event = {
        'type': 'rightBlockPos',
        'data': posY
    }
    broadcastEvent(event, clients)