"""All Pygame rendering logic."""

import pygame
from hiss_tastic.config import CONFIG
from hiss_tastic import states


def our_snake(surface, snake_list, snake_img):
    """Draw the snake."""
    for x in snake_list:
        surface.blit(snake_img, (x[0], x[1]))


def draw_obstacles(surface, obstacles, obstacle_img):
    """Draw all obstacles."""
    for obs in obstacles:
        surface.blit(obstacle_img, (obs[0], obs[1]))


def draw_food(surface, food_pos, food_img):
    """Draw the food item."""
    surface.blit(food_img, (food_pos[0], food_pos[1]))


def draw_power_up(surface, power_up_pos, power_up_img):
    """Draw the power-up if active."""
    surface.blit(power_up_img, (power_up_pos[0], power_up_pos[1]))


def display_score(surface, score, score_font, color):
    """Render the current score."""
    value = score_font.render(f"Score: {score}", True, color)
    surface.blit(value, [0, 0])


def draw_watermark(surface, bg_font, color, faded_color, width, height):
    """Draw the 'by SPARSH' watermark."""
    bg_text = bg_font.render('by SPARSH', True, color)
    bg_surface = pygame.Surface(bg_text.get_size(), pygame.SRCALPHA)
    bg_surface.fill(faded_color)
    bg_surface.blit(bg_text, (0, 0))
    surface.blit(bg_surface, (width / 2 - bg_text.get_width() / 2, height - 50))


def draw_game_over(surface, score, font_style, score_font, colors, mean_message):
    """Draw the game-over screen."""
    surface.fill(colors['bright_white'])
    msg = font_style.render(mean_message, True, colors['neon_pink'])
    surface.blit(msg, [colors['width'] / 6, colors['height'] / 3])
    display_score(surface, score, score_font, colors['black'])
    retry_text = font_style.render(
        "Press R to Retry or Q to Quit", True, colors['black']
    )
    surface.blit(retry_text, [colors['width'] / 6, colors['height'] / 2])


def draw_title_screen(surface, font_large, font_small, colors):
    """Draw the title screen."""
    surface.fill(colors['bright_white'])
    title = font_large.render("HISS-TASTIC", True, colors['neon_pink'])
    title_rect = title.get_rect(center=(colors['width'] / 2, colors['height'] / 3))
    surface.blit(title, title_rect)

    subtitle = font_small.render("by SPARSH", True, colors['black'])
    sub_rect = subtitle.get_rect(center=(colors['width'] / 2, colors['height'] / 2.5))
    surface.blit(subtitle, sub_rect)

    prompt = font_small.render("Press SPACE to start", True, colors['black'])
    prompt_rect = prompt.get_rect(center=(colors['width'] / 2, colors['height'] / 1.8))
    surface.blit(prompt, prompt_rect)


def draw_pause_overlay(surface, font_style, colors):
    """Draw the pause overlay."""
    s = pygame.Surface((colors['width'], colors['height']))
    s.set_alpha(128)
    s.fill(colors['bright_white'])
    surface.blit(s, (0, 0))
    pause_text = font_style.render("PAUSED", True, colors['neon_pink'])
    pause_rect = pause_text.get_rect(center=(colors['width'] / 2, colors['height'] / 2))
    surface.blit(pause_text, pause_rect)
