import numpy as np
from typing import Callable

class Game:
    def __init__(self, 
        width: int = 1000, 
        height: int = 650, 
        ball_size: int = 30, 
        ball_velocity: int = 1, 
        bar_height: int = 100,
        bar_width: int = 20,
        bar_margin: int = 30, 
        bar_velocity: int = 8,
        on_score_changed: Callable[[int, int], None] | None = None):

        self.width = width
        self.height = height
        self.__score_p1 = 0
        self.__score_p2 = 0
        self.on_score_changed = on_score_changed

        self.ball = Ball(self, ball_size, ball_velocity)
        self.left_bar = Bar(self, bar_height, bar_width, bar_velocity, bar_margin)
        self.right_bar = Bar(self, bar_height, bar_width, bar_velocity, bar_margin)

    def increase_score_p1(self) -> None:
        self.__score_p1 += 1
        self.__invoke_on_score_changed()
    
    def increase_score_p2(self) -> None:
        self.__score_p2 += 1
        self.__invoke_on_score_changed()
    
    def __invoke_on_score_changed(self) -> None:
        if self.on_score_changed != None:
            self.on_score_changed(self.__score_p1, self.__score_p2)

class Ball:
    def __init__(self, game: Game, size: int, velocity: int):
        self.game = game
        self.size = size
        self.velocity = velocity
        self.pos = np.array([0, 0], dtype=np.float32)
        self.direction = np.array([0, 0], dtype=np.float32)
        self.set_init_state()
    
    def set_init_state(self) -> None:
        self.pos = 0.5 * np.array(
            [self.game.width - self.size, 
             self.game.height - self.size]
        )
        self.direction[0] = np.random.uniform(0.8, 1) * -1 if np.random.random() < 0.5 else 1
        self.direction[1] = np.random.uniform(-1, 1)
        self.direction /= np.linalg.norm(self.direction)
    
    def move(self) -> None:
        self.pos += self.velocity * self.direction
        self.handle_collision()
    
    def handle_collision(self) -> None:
        # wall collision
        if self.pos[1] <= 0 or self.pos[1] + self.size >= self.game.height:
            self.direction[1] *= -1
            return
        # scores
        elif self.pos[0] + self.size >= self.game.width:
            # left scored
            self.game.increase_score_p1()
        elif self.pos[0] <= 0:
            # right scored
            self.game.increase_score_p2()
        # left bar collision
        elif (self.pos[0] <= self.game.left_bar.margin + self.game.left_bar.width
        and self.pos[0] >= self.game.left_bar.margin
        and self.pos[1] <= self.game.left_bar.posY + self.game.left_bar.height):
            mid = self.game.left_bar.posY + self.game.left_bar.height / 2
            newDir = np.array(
                [self.game.left_bar.height * 0.8,
                self.game.ball.size/2-mid], dtype=np.float32)
            newDir /= np.linalg.norm(newDir)
            self.direction = newDir
            return
        else: return 
        # set init states
        self.set_init_state()
        self.game.left_bar.set_init_state()
        self.game.right_bar.set_init_state()

class Bar:
    def __init__(self, game: Game, height: int, width: int, velocity: int, margin: int):
        self.game = game
        self.height = height
        self.width = width
        self.velocity = velocity
        self.margin = margin
        self.posY = 0
        self.set_init_state()

    def set_init_state(self) -> None:
        self.posY = (self.game.height - self.height) / 2
    
    def move(self, direction: int) -> None:
        newPosY = self.posY
        if direction == 0:
            newPosY += self.velocity 
        else:
            newPosY -= self.velocity
        if newPosY + self.height <= self.game.height and newPosY >= 0:
            self.posY = newPosY