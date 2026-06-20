"""Input handling — maps Pygame events to game actions."""

import pygame


class InputAction:
    """Represents the result of processing one frame of input."""

    def __init__(self):
        self.quit = False
        self.direction = None  # (dx, dy) tuple
        self.retry = False
        self.pause = False
        self.mute = False


def process_events():
    """Process pygame events and return an InputAction."""
    action = InputAction()

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            action.quit = True

        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_LEFT:
                action.direction = (-1, 0)
            elif event.key == pygame.K_RIGHT:
                action.direction = (1, 0)
            elif event.key == pygame.K_UP:
                action.direction = (0, -1)
            elif event.key == pygame.K_DOWN:
                action.direction = (0, 1)
            elif event.key == pygame.K_r:
                action.retry = True
            elif event.key == pygame.K_q:
                action.quit = True
            elif event.key in (pygame.K_p, pygame.K_ESCAPE):
                action.pause = True
            elif event.key == pygame.K_m:
                action.mute = True

    return action
