import json
import time
from game import Game
from typing import Dict, List, Tuple
from websockets.sync.server import serve, ServerConnection
from websockets.exceptions import WebSocketException
from websocket_utils import *


'''

import logging

logging.basicConfig(
    format="%(message)s",
    level=logging.DEBUG,
)
'''

# todo: fix onConnectionClose event not called
# only one invitation allowed

# deploy client to github
#

clients: Dict[str, ServerConnection] = dict()
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


def broadcastPlayerList():
    '''
    Sends a list of all connected players to all available clients. 
    '''
    for nickname, ws in clients.items():
        sendPlayerList(nickname, ws)


def sendPlayerList(player: str, sc: ServerConnection):
    '''
    Sends a list of all connected player to a client.
    '''
    keys = [key for key in clients]
    keys.remove(player)
    sc.send(json.dumps({'type': 'playerList', 'data': keys}))


def sendInvitation(targetPlayer: str, srcPlayer: str):
    '''
    Sends an invitation to player.
    '''
    sc = clients.get(targetPlayer)
    if sc is not None:
        sc.send(json.dumps({'type': 'invitation', 'message': srcPlayer}))


def sendInvitationAccepted(srcPlayer: str):
    '''
    Sends an invitation confirmation.
    '''
    sc = clients.get(srcPlayer)
    if sc is not None:
        sc.send(json.dumps({'type': 'invitationAccepted', 'message': srcPlayer}))


def onScoreChanged(score1: int, score2: int, args: Tuple[ServerConnection, ServerConnection]):
    sendScore(score1, score2, list(args))


def onBallPosChanged(pos: Tuple[float, float], args: Tuple[ServerConnection, ServerConnection]):
    sendBallPos(pos, list(args))


def onLeftBlockPosChanged(posY: int, args: Tuple[ServerConnection, ServerConnection]):
    sendLeftBlockPos(posY, list(args))


def onRightBlockPosChanged(posY: int, args: Tuple[ServerConnection, ServerConnection]):
    sendRightBlockPos(posY, list(args))


def play(player1: str, player2: str):
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
    broadcastPlayerList()

    sendGameInitialization(game, [wsP1, wsP2])

    def gameLoop():
        starttime = time.time()
        interval = 0.002
        while True:
            game.ball.move()
            time.sleep(interval - ((time.time() - starttime) % interval))
    
    gameLoop()


def matchmaking(srcPlayer: str, sc: ServerConnection):
    # listen for incoming messages
    for message in sc:
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
                sendInvitation(targetPlayer, srcPlayer)

            elif type == 'acceptInvitation':
                targetPlayer = message
                if srcPlayer in invitations.get(targetPlayer, []):
                    del invitations[targetPlayer]
                    sendInvitationAccepted(targetPlayer)
                    # start game
                    play(srcPlayer, targetPlayer)

            elif type == 'rejectInvitation':
                if invitations.get(message) is not None:
                    del invitations[message]

            else:
                sc.send(json.dumps({'type': 'error', 'message': f'Wrong type "{type}".'}))

        except WebSocketException:
            return


def handler(sc: ServerConnection):
    # wait for joining message
    message = sc.recv(0.1)
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
        clients[nickname] = sc 
        sc.send(json.dumps({'type': 'joined'}))
        broadcastPlayerList()
        try:
            matchmaking(nickname, sc)

        finally:
            if clients.get(nickname) is not None:
                del clients[nickname]
            removeInvitations(nickname)
            broadcastPlayerList()
    else:
        sc.send(json.dumps({'type': 'joinError', 'message': 'Nickname already exists!'}))

def main():
    with serve(handler, '', 5000) as server:
        server.serve_forever()

if __name__ == '__main__':
    main()