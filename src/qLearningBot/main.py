import socketio
import numpy as np

sio = socketio.Client()

sio.connect('http://localhost:5000', auth={'nickname': 'qLearningBot'})

numberOfBins: tuple[int, int, int]
lowerBounds: list
upperBounds: list
Qmatrix: np.ndarray
bins: list
blockY: int

prevPos: np.ndarray = [0, 0]
prevKey: int = 0

alpha = 0.1
gamma = 1
epsilon = 0.2
numberEpisodes = 15000


@sio.on('invitation')
def on_message(user: dict):
    print(f'I was invited by {user.get("nickname")}!')
    sio.emit('acceptInvitation', user.get('id'))


@sio.on('gameInit')
def on_game_init(init: dict):
    global Qmatrix, blockY, bins

    width = init.get('width')
    height = init.get('height')
    ball_size = init.get('ball').get('size')
    block_height = init.get('leftBlock').get('height')
    blockY = init.get('leftBlock').get('posY')

    # discretization process for observation space because it is continuous
    # subdevide in bins
    # ball position X, ball position Y, direction X, direction Y, block position Y
    numberOfBins = (30, 30, 30, 30, 30)

    lowerBounds = [0, 0, 0, 0, 0]
    upperBounds = [height - ball_size, width -
                   ball_size, 1, 1, height - block_height]

    Qmatrix = np.random.uniform(low=0, high=1, size=(numberOfBins) + (3,))

    bins = [np.linspace(lowerBounds[i], upperBounds[i], numberOfBins[i])
            for i in range(len(numberOfBins))]


def returnIndexState(state: tuple[float, float, float, float, float]):
    return tuple([np.maximum(np.digitize(state[i], bins[i]) - 1, 0) for i in range(len(bins))])


state = ()

prevStateIndex = None
prevAction = None
# one episode should be one round
# reward has to be proportional to round length
tick = 0
@sio.on('ballPos')
def on_ball_position(pos: dict):
    global tick
    # train every 20 steps
    if tick >= 200:
        train(pos)
        tick = 0
    tick += 1

def train(pos: dict):
    global blockY, epsilon, prevStateIndex, prevAction

    # get direction
    direction = [prevPos[0] - pos.get('x'), prevPos[1] - pos.get('y')]
    norm = np.linalg.norm(direction)
    direction /= norm

    state = (prevPos[0], prevPos[1], direction[0], direction[1], blockY)

    # update Q-Table
    if prevStateIndex is not None and prevAction is not None:
        qIndex = prevStateIndex + (prevAction,)
        qMax = np.max(Qmatrix[tuple(returnIndexState(state))])
        Qmatrix[qIndex] += alpha * (1 + gamma * qMax - Qmatrix[qIndex])

    prevPos[0] = pos.get('x')
    prevPos[1] = pos.get('y')

    # todo: go for shorter version
    # state = (prevPos[0], prevPos[1], direction[0], direction[1], blockY)
    stateIndex = returnIndexState(state)
    prevStateIndex = stateIndex

    q = Qmatrix[stateIndex]

    indexEpisode = 0
    action = 0

    # epsilon decay
    if indexEpisode > 7000:
        epsilon *= 0.999

    if indexEpisode < 500:
        action = np.random.randint(0, 3)

    # epsilon-greedy
    elif np.random.random() < epsilon:
        # pull random action
        action = np.random.randint(0, 3)
    else:
        # pull best action
        action = np.argmax(q)

    # perform action
    sendAction(action)
    prevAction = action

def sendAction(action: int):
    global prevKey
    sio.emit('keyUp', prevKey)
    prevKey = action
    if action == 2:
        return
    sio.emit('keyDown', action)


@sio.on('leftBlockPos')
def on_right_block_pos_changed(pos: int):
    global blockY
    blockY = pos
