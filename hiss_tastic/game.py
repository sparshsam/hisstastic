"""Main game class and game loop."""

import pygame
import random
import time as time_module

from hiss_tastic.config import CONFIG, get_difficulty_preset
from hiss_tastic.assets import load_all_assets, asset_dir
from hiss_tastic.entities import Snake, Food, Obstacle, PowerUp
from hiss_tastic import states
from hiss_tastic.input import process_events
from hiss_tastic.rendering import (
    our_snake, draw_obstacles, draw_food, draw_power_up,
    display_score, draw_watermark, draw_game_over,
    draw_title_screen, draw_pause_overlay, draw_ghost,
)
from hiss_tastic.scoring import get_quadratic_score, get_mean_message
from hiss_tastic.audio import init as init_audio, play_eat, play_powerup, play_gameover
from hiss_tastic.spawns import (
    safe_food_position, safe_power_up_position, generate_obstacles,
)


class Game:
    """Main game class managing state, entities, and the game loop."""

    def __init__(self):
        pygame.init()

        # Window
        self.width = CONFIG['window']['width']
        self.height = CONFIG['window']['height']
        self.block_size = CONFIG['grid']['block_size']

        self.surface = pygame.display.set_mode((self.width, self.height))
        pygame.display.set_caption(CONFIG['window']['title'])

        # Clock
        self.clock = pygame.time.Clock()

        # Fonts
        self.font_style = pygame.font.SysFont(
            CONFIG['fonts']['style_name'], CONFIG['fonts']['size_normal']
        )
        self.score_font = pygame.font.SysFont(
            CONFIG['fonts']['score_name'], CONFIG['fonts']['size_normal']
        )
        self.bg_font = pygame.font.SysFont(
            CONFIG['fonts']['bg_name'], CONFIG['fonts']['size_bg']
        )
        self.title_font = pygame.font.SysFont(
            CONFIG['fonts']['bg_name'], 50
        )

        # Assets
        self.assets = load_all_assets()
        icon = self.assets.get('icon')
        if icon:
            pygame.display.set_icon(icon)

        # Audio
        init_audio()

        # State
        self.state = states.TITLE
        self.difficulty_mode = CONFIG['difficulty']['mode']
        self.muted = CONFIG['audio']['muted']

        # Replay recorder (set externally by replay_cli)
        self.replay_recorder = None
        self.ghost_session = None

    # ---- Input helpers ----

    def _get_direction_from_action(self, direction):
        """Convert a direction tuple to pixel delta."""
        if direction is None:
            return (0, 0)
        dx, dy = direction
        return (dx * self.block_size, dy * self.block_size)

    # ---- Title screen ----

    def _run_title(self):
        """Show title screen until SPACE is pressed."""
        while self.state == states.TITLE:
            draw_title_screen(self.surface, self.title_font, self.font_style, {
                'width': self.width,
                'height': self.height,
                'bright_white': CONFIG['colors']['bright_white'],
                'neon_pink': CONFIG['colors']['neon_pink'],
                'black': CONFIG['colors']['black'],
            })
            pygame.display.update()

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.state = states.EXIT
                    return
                if event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_SPACE:
                        self.state = states.PLAYING
                    elif event.key in (pygame.K_1, pygame.K_2, pygame.K_3):
                        self.difficulty_mode = {pygame.K_1: 'easy', pygame.K_2: 'normal', pygame.K_3: 'hard'}[event.key]

    # ---- Main game ----

    def _run_game(self):
        """Run one game session from start to game over."""
        preset = get_difficulty_preset(self.difficulty_mode)

        snake_speed = preset['initial_speed']
        snake = Snake(self.width / 2, self.height / 2)

        # Seed the RNG for this session (deterministic replay)
        seed = random.randint(0, 2**31 - 1)
        rng = random.Random(seed)

        # Generate obstacles
        obstacle_positions = generate_obstacles(
            preset['obstacle_count'],
            self.width, self.height, self.block_size,
            (snake.head[0], snake.head[1]),
            rng=rng,
        )

        # Place food safely
        fx, fy = safe_food_position(
            self.width, self.height, self.block_size,
            snake.body, obstacle_positions,
            rng=rng,
        )
        food = Food(fx, fy)

        # Place power-up safely
        px, py = safe_power_up_position(
            self.width, self.height, self.block_size, obstacle_positions,
            rng=rng,
        )
        power_up = PowerUp(px, py)

        immune = False
        immune_start_time = 0
        score = 0
        food_count = 0

        # Setup replay recorder
        if self.replay_recorder:
            self.replay_recorder.seed = seed

        while self.state == states.PLAYING:
            # Process input
            action = process_events()

            if action.quit:
                self.state = states.EXIT
                break

            # Pause toggle
            if action.pause:
                self.state = states.PAUSED
                self._run_pause()
                if self.state == states.EXIT:
                    break
                continue

            # Mute toggle
            if action.mute:
                self.muted = not self.muted

            # Apply direction
            if action.direction:
                dx, dy = self._get_direction_from_action(action.direction)
                snake.direction_x = dx
                snake.direction_y = dy

            # Record input for replay
            if self.replay_recorder:
                self.replay_recorder.record_input(action.direction)

            # Check wall collision
            head_x, head_y = snake.head[0], snake.head[1]
            if head_x >= self.width or head_x < 0 or head_y >= self.height or head_y < 0:
                self.state = states.GAME_OVER
                break

            # Move snake
            snake.move()

            # Check self-collision
            if snake.collides_with_self() and not immune:
                self.state = states.GAME_OVER
                break

            # Check obstacle collision
            for obs_pos in obstacle_positions:
                if snake.head[0] == obs_pos[0] and snake.head[1] == obs_pos[1]:
                    if not immune:
                        self.state = states.GAME_OVER
                        break
            if self.state == states.GAME_OVER:
                break

            # Check food collection
            if snake.head[0] == food.x and snake.head[1] == food.y:
                fx, fy = safe_food_position(
                    self.width, self.height, self.block_size,
                    snake.body, obstacle_positions,
                    rng=rng,
                )
                food = Food(fx, fy)
                snake.grow()
                snake_speed += preset['speed_increment']
                food_count += 1
                score += get_quadratic_score(food_count)
                play_eat()

            # Check power-up collection
            if power_up.active and snake.head[0] == power_up.x and snake.head[1] == power_up.y:
                power_up.deactivate()
                play_powerup()
                immune = True
                immune_start_time = time_module.time()

            # Check immunity timeout
            if immune and time_module.time() - immune_start_time > preset['immunity_duration']:
                immune = False

            # Random power-up respawn
            if not power_up.active and rng.randint(1, CONFIG['gameplay']['power_up_respawn_chance']) == 1:
                px, py = safe_power_up_position(
                    self.width, self.height, self.block_size, obstacle_positions,
                    rng=rng,
                )
                power_up.reactivate(px, py)

            # Record tick for replay
            if self.replay_recorder:
                self.replay_recorder.record_frame(snake, score)
                self.replay_recorder.tick()

            # ---- Render ----
            self.surface.fill(CONFIG['colors']['bright_white'])
            draw_food(self.surface, food.position, self.assets['food'])
            if power_up.active:
                draw_power_up(self.surface, power_up.position, self.assets['power_up'])
            if self.ghost_session:
                draw_ghost(
                    self.surface,
                    self.ghost_session.current_payload(),
                    self.block_size,
                )
                self.ghost_session.advance()
            our_snake(self.surface, snake.body, self.assets['snake'])
            draw_obstacles(self.surface, obstacle_positions, self.assets['obstacle'])
            display_score(self.surface, score, self.score_font, CONFIG['colors']['black'])
            draw_watermark(
                self.surface, self.bg_font,
                CONFIG['colors']['black'], CONFIG['colors']['faded_black'],
                self.width, self.height,
            )

            if self.muted:
                mute_text = self.font_style.render("MUTED", True, (200, 0, 0))
                self.surface.blit(mute_text, (self.width - 70, 5))

            pygame.display.update()
            self.clock.tick(snake_speed)

        # Game over — record final score in replay
        if self.replay_recorder:
            self.replay_recorder.set_final_score(score, snake.length)

        play_gameover()

        return score, snake.length

    # ---- Pause ----

    def _run_pause(self):
        """Handle pause state."""
        while self.state == states.PAUSED:
            draw_pause_overlay(self.surface, self.font_style, {
                'width': self.width,
                'height': self.height,
                'bright_white': CONFIG['colors']['bright_white'],
                'neon_pink': CONFIG['colors']['neon_pink'],
            })
            pygame.display.update()

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.state = states.EXIT
                    return
                if event.type == pygame.KEYDOWN:
                    if event.key in (pygame.K_p, pygame.K_ESCAPE):
                        self.state = states.PLAYING
                        return
                    if event.key == pygame.K_q:
                        self.state = states.EXIT
                        return

    # ---- Game over ----

    def _run_game_over(self, score):
        """Show game-over screen with retry/quit options."""
        while self.state == states.GAME_OVER:
            mean_message = get_mean_message(score)
            draw_game_over(self.surface, score, self.font_style, self.score_font, {
                'width': self.width,
                'height': self.height,
                'bright_white': CONFIG['colors']['bright_white'],
                'neon_pink': CONFIG['colors']['neon_pink'],
                'black': CONFIG['colors']['black'],
            }, mean_message)
            display_score(self.surface, score, self.score_font, CONFIG['colors']['black'])
            pygame.display.update()

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.state = states.EXIT
                    return
                if event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_r:
                        self.state = states.TITLE
                        return
                    if event.key == pygame.K_q:
                        self.state = states.EXIT
                        return

    # ---- Main loop ----

    def run(self):
        """Main game loop orchestrating state transitions."""
        while self.state != states.EXIT:
            if self.state == states.TITLE:
                self._run_title()
            elif self.state == states.PLAYING:
                score, slen = self._run_game()
                if self.state != states.EXIT:
                    self.state = states.GAME_OVER
            elif self.state == states.GAME_OVER:
                self._run_game_over(score if 'score' in dir() else 0)
            elif self.state == states.PAUSED:
                self._run_pause()

        pygame.quit()


def run_game():
    """Convenience entry point to create and run the game."""
    game = Game()
    game.run()


if __name__ == '__main__':
    run_game()
