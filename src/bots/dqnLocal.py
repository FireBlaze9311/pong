from game import Game
import math
import pygame
from collections import namedtuple, deque
import random
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

pygame.init()

game = Game()
window = pygame.display.set_mode([game.width, game.height])
clock = pygame.time.Clock()
WHITE = (255, 255, 255)

gameScore = 0
netScore = 0
reward = 0

BATCH_SIZE = 128
GAMMA = 0.99
EPS_START = 0.9
EPS_END = 0.05
EPS_DECAY = 1000
TAU = 0.005
LR = 2e-4

Transition = namedtuple('Transition', ('state', 'action', 'next_state', 'reward'))

def on_score_changed(s1: int, s2: int, args):
    global gameScore, reward
    if s1 > gameScore:
        print('win')
        gameScore = s1
        reward = 1000
    else:
        reward = -100
        print('score:', netScore)
    
def on_left_block_collided():
    global reward
    reward = 50

game.on_score_changed = on_score_changed
game.on_left_block_collided = on_left_block_collided

class ReplayMemory(object):

    def __init__(self, capacity):
        self.memory = deque([], maxlen=capacity)

    def push(self, *args):
        self.memory.append(Transition(*args))
    
    def sample(self, batch_size):
        return random.sample(self.memory, batch_size)

    def __len__(self):
        return len(self.memory) 

class DQN(nn.Module):

    def __init__(self, n_observations, n_actions):
        super(DQN, self).__init__()
        self.layer1 = nn.Linear(n_observations, 80)
        self.layer2 = nn.Linear(80, 30)
        self.layer3 = nn.Linear(30, n_actions)
    
    def forward(self, x):
        x = F.relu(self.layer1(x))
        x = F.relu(self.layer2(x))
        return self.layer3(x)

policy_net = DQN(2, 2).to(device)
target_net = DQN(2, 2).to(device)

optimizer = optim.AdamW(policy_net.parameters(), lr=LR, amsgrad=True)
memory = ReplayMemory(12000)

steps_done = 0

def select_action(state):
    global steps_done
    sample = random.random()
    eps_threshold = EPS_END + (EPS_START - EPS_END) * math.exp(-1. * steps_done / EPS_DECAY)
    steps_done += 1
    if sample > eps_threshold:
        with torch.no_grad():
            return policy_net(state).max(1)[1].view(1, 1)
    else:
        return torch.tensor([[random.randint(0, 1)]], device=device, dtype=torch.long)

def optimize_model():
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
        next_state_values[non_final_mask] = target_net(non_final_next_states).max(1)[0]
    expected_state_action_values = (next_state_values * GAMMA) + reward_batch

    criterion = nn.SmoothL1Loss()
    loss = criterion(state_action_values, expected_state_action_values.unsqueeze(1))

    optimizer.zero_grad()
    loss.backward()

    print(loss)

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

state = torch.tensor([game.ball.pos[1], game.left_block.posY], dtype=torch.float32, device=device).unsqueeze(0)
while True:
    pygame.event.get()

    action = select_action(state)
    perfomActionLeft(action.item())
    stepNextState()

    if reward != 0:
        rewardT = torch.tensor([reward], device=device)

        next_state = torch.tensor([game.ball.pos[1], game.left_block.posY], dtype=torch.float32, device=device).unsqueeze(0)

        memory.push(state, action, next_state, rewardT)

        state = next_state

        optimize_model()

    # Soft update of the target network's weights
    target_net_state_dict = target_net.state_dict()
    policy_net_state_dict = policy_net.state_dict()
    for key in policy_net_state_dict:
        target_net_state_dict[key] = policy_net_state_dict[key]*TAU + target_net_state_dict[key]*(1-TAU)
    target_net.load_state_dict(target_net_state_dict)

    reward = 0

    window.fill((0, 0, 0))
    pygame.draw.rect(window, WHITE, (*map(int, game.ball.pos),
                    game.ball.size, game.ball.size))
    pygame.draw.rect(window, WHITE, (game.left_block.margin,
                    game.left_block.posY, game.left_block.width, game.left_block.height))
    pygame.draw.rect(window, WHITE, (game.right_blockX, game.right_block.posY,
                    game.right_block.width, game.right_block.height))

    clock.tick(1000)
    pygame.display.flip()