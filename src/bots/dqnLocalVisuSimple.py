from game import Game
import pygame
import random
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from utils import ReplayMemory, Transition
from pygameNetVisu import drawNet

device = torch.device('cpu')

pygame.init()
pygame.font.init()

game = Game(ball_velocity=8)
clock = pygame.time.Clock()

WHITE = (255, 255, 255)
PINK = (255, 0, 180)
GREEN = (0, 255, 0)
BLUE = (0, 0, 200)

WINDOW_HEIGHT = game.height + 400 
WINDOW_WIDTH = game.width + 700 
GAME_MARGIN_TOP = 50
GAME_MARGIN_LEFT = 50

print(WINDOW_HEIGHT, WINDOW_WIDTH)

window = pygame.display.set_mode([WINDOW_WIDTH, WINDOW_HEIGHT])
pygame.display.set_caption('pong training')

#epsilonSlider = Slider(window, 200, 880, 500, 30, min=0,
#                       max=100, step=1, handleColour=BLUE)
#epsilonOutput = TextBox(window, 750, 870, 50, 50, fontSize=30)
my_font = pygame.font.SysFont('Comic Sans MS', 50)

gameScore = 0
netScore = 0
reward = 0

BATCH_SIZE = 120
GAMMA = 0.99
TAU = 0.005
#LR = 1e-4
LR = 1e-3

EPS_START = 0.95
EPS_END = 0.05
EPS_DECAY = 1000 

def on_score_changed(s1: int, s2: int, args):
    global gameScore, reward
    if s1 > gameScore:
        print('win')
        gameScore = s1
        reward = 1000
    else:
        reward = -100
        # print('score:', netScore)


def on_left_block_collided():
    global reward
    reward = 50


game.on_score_changed = on_score_changed
game.on_left_block_collided = on_left_block_collided



class DQN(nn.Module):

    def __init__(self, n_observations, n_actions):
        super(DQN, self).__init__()
        self.layer1 = nn.Linear(n_observations, 15)
        self.layer2 = nn.Linear(15, 5)
        self.layer3 = nn.Linear(5, n_actions)

    def forward(self, x):
        x = F.relu(self.layer1(x))
        x = F.relu(self.layer2(x))
        return self.layer3(x)


policy_net = DQN(2, 3).to(device)
target_net = DQN(2, 3).to(device)

optimizer = optim.AdamW(policy_net.parameters(), lr=LR, amsgrad=True)
memory = ReplayMemory(8000)


steps_done = 0
def select_action(state):
    global steps_done
    eps_threshold = EPS_END + (EPS_START - EPS_END) * np.exp(-1. * steps_done / EPS_DECAY)

    steps_done += 1
    sample = random.random()
    if sample > eps_threshold:
        with torch.no_grad():
            return policy_net(state).max(1)[1].view(1, 1)
    else:
        return torch.tensor([[random.randint(0, 2)]], device=device, dtype=torch.long)

lossOut = 0
def optimize_model():
    global lossOut

    if len(memory) < BATCH_SIZE:
        return
    transitions = memory.sample(BATCH_SIZE)
    batch = Transition(*zip(*transitions))
    non_final_mask = torch.tensor(tuple(map(lambda s: s is not None,
                                            batch.next_state)), device=device, dtype=torch.bool)

    non_final_next_states = torch.cat([s for s in batch.next_state
                                       if s is not None])
    state_batch = torch.cat(batch.state)
    action_batch = torch.cat(batch.action)
    reward_batch = torch.cat(batch.reward)

    state_action_values = policy_net(state_batch).gather(1, action_batch)
    next_state_values = torch.zeros(BATCH_SIZE, device=device)
    with torch.no_grad():
        next_state_values[non_final_mask] = target_net(
            non_final_next_states).max(1)[0]
    expected_state_action_values = (next_state_values * GAMMA) + reward_batch

    criterion = nn.SmoothL1Loss()
    loss = criterion(state_action_values,
                     expected_state_action_values.unsqueeze(1))

    optimizer.zero_grad()
    loss.backward()

    lossOut = loss.item()


    torch.nn.utils.clip_grad_value_(policy_net.parameters(), 100)
    optimizer.step()


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


def stepNextState():
    simpleAlgo()
    game.ball.move()


def renderGame():
    window.fill((0, 0, 0))
    pygame.draw.rect(window, WHITE, (game.ball.pos[0] + GAME_MARGIN_LEFT, game.ball.pos[1] + GAME_MARGIN_TOP,
                                     game.ball.size, game.ball.size))
    pygame.draw.rect(window, WHITE, (game.left_block.margin + GAME_MARGIN_LEFT,
                                     game.left_block.posY + GAME_MARGIN_TOP, game.left_block.width, game.left_block.height))
    #pygame.draw.rect(window, WHITE, (game.right_blockX + GAME_MARGIN_LEFT, game.right_block.posY + GAME_MARGIN_TOP,
    #                                 game.right_block.width, game.right_block.height
    pygame.draw.rect(window, WHITE, (GAME_MARGIN_LEFT,
                     GAME_MARGIN_TOP, game.width, game.height), 2)


def renderNet(offset):
    weights = [
        policy_net.layer1.weight.detach().cpu().numpy(),
        policy_net.layer2.weight.detach().cpu().numpy(),
        policy_net.layer3.weight.detach().cpu().numpy()
    ]

    biases = [
        np.zeros(2), # input layer has no bias
        policy_net.layer1.bias.detach().numpy(),
        policy_net.layer2.bias.detach().numpy(),
        policy_net.layer3.bias.detach().numpy()
    ]

    drawNet(window, weights, biases, offset, layer_margin=80, neuron_radius=30)


running = True
while running:
    events = pygame.event.get()
    for event in events:
        if event.type == pygame.QUIT:
            running = False

    state = (game.ball.pos[1], game.left_block.posY)
    state = torch.tensor(state, dtype=torch.float32,
                         device=device).unsqueeze(0)

    action = select_action(state)

    perfomActionLeft(action.item())

    stepNextState()

    #if reward != 0:

    reward = abs((game.left_block.posY + game.left_block.height /
                2) - (game.ball.pos[1] + game.ball.size / 2)) * -1

    rewardT = torch.tensor([reward], device=device)

    next_state = (game.ball.pos[1], game.left_block.posY)
    next_state = torch.tensor(
        next_state, dtype=torch.float32, device=device).unsqueeze(0)

    memory.push(state, action, next_state, rewardT)

    state = next_state

    optimize_model()

    # Soft update of the target network's weights
    target_net_state_dict = target_net.state_dict()
    policy_net_state_dict = policy_net.state_dict()
    for key in policy_net_state_dict:
        target_net_state_dict[key] = policy_net_state_dict[key] * \
            TAU + target_net_state_dict[key]*(1-TAU)
    target_net.load_state_dict(target_net_state_dict)


    reward = 0


    stepNextState()

    renderGame()
    renderNet([game.width + 130, 10])

    #pygame_widgets.update(events)
    eps_threshold = EPS_END + (EPS_START - EPS_END) * np.exp(-1. * steps_done / EPS_DECAY)
    text_surface = my_font.render('epsilon ' + str(eps_threshold), False, WHITE)
    loss_surface = my_font.render('loss    ' + str(lossOut), False, WHITE)

    window.blit(text_surface, (20, 880))
    window.blit(loss_surface, (20, 930))

    clock.tick(1000)
    pygame.display.flip()
