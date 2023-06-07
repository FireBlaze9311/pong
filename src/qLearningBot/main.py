import socketio
import numpy as np

sio = socketio.Client()

sio.connect('http://localhost:5000', auth={'nickname': 'qLearningBot'})

numberOfBins: tuple[int, int, int]
lowerBounds: list
upperBounds: list
Qmatrix: np.ndarray
bins: list

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
    width = init.get('width')
    height = init.get('height')
    ball_size = init.get('ball').get('size')
    block_height = init.get('rightBlock').get('height')

    # discretization process for observation space because it is continuous
    # subdevide in bins
    # ball position X, ball position Y, block position Y
    numberOfBins = (30, 30, 30)

    lowerBounds = [0, 0, 0]
    upperBounds = [height - ball_size, width -
                   ball_size, height - block_height]

    Qmatrix = np.random.uniform(low = 0, high = 1, size=(numberOfBins) + (2,))

    bins = [np.linspace(lowerBounds[i], upperBounds[i], numberOfBins[i])
            for i in range(len(numberOfBins))]


def returnIndexState(state):
    return tuple([np.maximum(np.digitize(state[i], bins[i]) - 1, 0) for i in range(len(bins))])

# observation space should be ball position and own block position


@sio.on('ballPos')
def on_ball_position(pos: dict):
    pass
