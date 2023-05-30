import asyncio
import json
import time
from game import Game
from typing import Dict, List, Tuple
from websockets.server import serve, WebSocketServerProtocol
from websockets.exceptions import WebSocketException
from websocket_utils import *

import logging

logging.basicConfig(
    format="%(message)s",
    level=logging.DEBUG,
)

# todo: fix onConnectionClose event not called
# only one invitation allowed

# deploy client to github
#

clients: Dict[str, WebSocketServerProtocol] = dict()
invitations: Dict[str, List[str]] = dict()
games: Dict[str, Tuple[Game, Tuple[str, str]]]


def removeInvitations(player: str):
    '''
    Removes all invitations of a player.
    '''
    if invitations.get(player) is not None:
        del invitations[player]
    for _, val in invitations.items():
        if player in val:
            val.remove(player)


async def broadcastPlayerList():
    '''
    Sends a list of all connected players to all available clients. 
    '''
    for nickname, ws in clients.items():
        await sendPlayerList(nickname, ws)


async def sendPlayerList(player: str, websocket: WebSocketServerProtocol):
    '''
    Sends a list of all connected player to a client.
    '''
    keys = [key for key in clients]
    keys.remove(player)
    await websocket.send(json.dumps({'type': 'playerList', 'data': keys}))


async def sendInvitation(targetPlayer: str, srcPlayer: str):
    '''
    Sends an invitation to player.
    '''
    ws = clients.get(targetPlayer)
    if ws is not None:
        await ws.send(json.dumps({'type': 'invitation', 'message': srcPlayer}))

async def sendInvitationAccepted(srcPlayer: str):
    '''
    Sends an invitation confirmation.
    '''
    ws = clients.get(srcPlayer)
    if ws is not None:
        await ws.send(json.dumps({'type': 'invitationAccepted', 'message': srcPlayer}))


async def onScoreChanged(score1: int, score2: int, args: Tuple[WebSocketServerProtocol, WebSocketServerProtocol]):
    await sendScore(score1, score2, list(args))


async def onBallPosChanged(pos: Tuple[float, float], args: Tuple[WebSocketServerProtocol, WebSocketServerProtocol]):
    await sendBallPos(pos, list(args))


async def onLeftBlockPosChanged(posY: int, args: Tuple[WebSocketServerProtocol, WebSocketServerProtocol]):
    await sendLeftBlockPos(posY, list(args))


async def onRightBlockPosChanged(posY: int, args: Tuple[WebSocketServerProtocol, WebSocketServerProtocol]):
    await sendRightBlockPos(posY, list(args))


async def play(player1: str, player2: str):
    wsP1 = clients[player1]
    wsP2 = clients[player2]
    game = Game(
        on_score_changed=onScoreChanged,
        on_ball_pos_changed=onBallPosChanged,
        on_left_block_pos_changed=onLeftBlockPosChanged,
        on_right_block_pos_changed=onRightBlockPosChanged,
        args=(wsP1, wsP2)
    )

    # remove players from matchmaking list
    del clients[player1]
    del clients[player2]
    await broadcastPlayerList()

    await sendGameInitialization(game, [wsP1, wsP2])

    async def gameLoop():
        starttime = time.time()
        interval = 0.002
        while True:
            await game.ball.move()
            await asyncio.sleep(interval - ((time.time() - starttime) % interval))

    await gameLoop()


async def matchmaking(srcPlayer: str, websocket: WebSocketServerProtocol):
    # listen for incoming messages
    async for message in websocket:
        try:
            # load message attributes
            event = json.loads(message)
            type = event.get('type')
            message = event.get('message')

            if type == 'challenge':
                targetPlayer = message
                if srcPlayer in invitations:
                    if targetPlayer in invitations[srcPlayer]:
                        continue
                    else:
                        invitations[srcPlayer].append(targetPlayer)
                else:
                    invitations[srcPlayer] = [targetPlayer]
                await sendInvitation(targetPlayer, srcPlayer)

            elif type == 'acceptInvitation':
                targetPlayer = message
                if srcPlayer in invitations.get(targetPlayer, []):
                    del invitations[targetPlayer]
                    await sendInvitationAccepted(targetPlayer)
                    # start game
                    # await play(srcPlayer, targetPlayer)

            elif type == 'rejectInvitation':
                if invitations.get(message) is not None:
                    del invitations[message]

            else:
                await websocket.send(json.dumps({'type': 'error', 'message': f'Wrong type "{type}".'}))

        except WebSocketException:
            return


async def handler(websocket: WebSocketServerProtocol):
    # wait for joining message
    message = await asyncio.wait_for(websocket.recv(), 0.1)
    event = json.loads(message)

    # load message attributes
    nickname = event.get('message')
    type = event.get('type')
    assert type == 'join', 'Wrong type'
    assert nickname, 'No nickname provided.'

    # if nickname is available
    # else send error message
    if not clients.get(nickname):
        # join matchmaking
        clients[nickname] = websocket
        await websocket.send(json.dumps({'type': 'joined'}))
        await broadcastPlayerList()
        try:
            await matchmaking(nickname, websocket)

        finally:
            if clients.get(nickname) is not None:
                del clients[nickname]
            removeInvitations(nickname)
            await broadcastPlayerList()
    else:
        await websocket.send(json.dumps({'type': 'joinError', 'message': 'Nickname already exists!'}))


async def main():
    async with serve(handler, '', 5000):
        await asyncio.Future()

if __name__ == '__main__':
    asyncio.run(main())
