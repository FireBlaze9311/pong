from game import Game
import numpy as np
import pygame

pygame.init()

game = Game()
window = pygame.display.set_mode([game.width, game.height])
clock = pygame.time.Clock()
WHITE = (255, 255, 255)

alpha = 0.5
gamma = 0
epsilon = 0.01

Qmatrix = np.random.uniform(low=0, high=1, size=(3,) + (3,))


def perfomActionLeft(action: int):
    if action == 0:
        game.left_block.move(0)
    elif action == 1:
        game.left_block.move(1)


def perfomActionRight(action: int):
    if action == 0:
        game.right_block.move(0)
    elif action == 1:
        game.right_block.move(1)


def simpleAlgo():
    if game.ball.pos[1] + game.ball.size / 2 > game.right_block.posY + game.right_block.height / 2:
        perfomActionRight(0)
    else:
        perfomActionRight(1)


prevState = None
prevAction = None
while True:
    pygame.event.get()

    simpleAlgo()

    state = 0
    if game.ball.pos[1] > game.left_block.posY:
        state = 1
    elif game.ball.pos[1] < game.left_block.posY:
        state = 2

    reward = abs((game.left_block.posY + game.left_block.height /
                 2) - (game.ball.pos[1] + game.ball.size / 2)) * -1
    print(reward)

    window.fill((0, 0, 0))
    pygame.draw.rect(window, WHITE, (*map(int, game.ball.pos),
                     game.ball.size, game.ball.size))
    pygame.draw.rect(window, WHITE, (game.left_block.margin,
                     game.left_block.posY, game.left_block.width, game.left_block.height))
    pygame.draw.rect(window, WHITE, (game.right_blockX, game.right_block.posY,
                     game.right_block.width, game.right_block.height))

    clock.tick(1000)
    pygame.display.flip()

    # update Q-Table
    if prevState != None and prevAction is not None:
        qIndex = (prevState,) + (prevAction,)
        qMax = max(Qmatrix[state])
        Qmatrix[qIndex] += alpha * (reward + gamma * qMax - Qmatrix[qIndex])

    prevState = state
    q = Qmatrix[state]
    action = 0
    # epsilon-greedy
    if np.random.random() < epsilon:
        # pull random action
        action = np.random.randint(0, 2)
    else:
        # pull best action
        action = np.argmax(q)

    perfomActionLeft(action)
    prevAction = action

    game.ball.move()
