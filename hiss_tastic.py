import os
import sys
import time
import random

try:
    import pygame
except ImportError:
    print("Error: pygame is not installed. Run: pip install pygame")
    sys.exit(1)

# Initialize Pygame
pygame.init()

CONFIG = {
    'colors': {
        'bright_white': (255, 255, 255),
        'neon_pink': (255, 20, 147),
        'black': (0, 0, 0),
        'faded_black': (0, 0, 0, 50),
    },
    'window': {
        'width': 600,
        'height': 400,
        'title': 'HissTastic',
    },
    'grid': {
        'block_size': 20,
    },
    'gameplay': {
        'initial_speed': 5,
        'speed_increment': 1,
        'immunity_duration': 3.8,
        'obstacle_count': 5,
        'power_up_respawn_chance': 50,
    },
    'fonts': {
        'style_name': None,
        'score_name': None,
        'bg_name': 'comicsansms',
        'size_normal': 35,
        'size_bg': 30,
    },
    'assets': {
        'size': 20,
    },
}

# Set display dimensions
dis_width = CONFIG['window']['width']
dis_height = CONFIG['window']['height']
dis = pygame.display.set_mode((dis_width, dis_height))
pygame.display.set_caption(CONFIG['window']['title'])

asset_dir = os.path.join(os.path.dirname(__file__), 'assets')

snake_block = CONFIG['grid']['block_size']
initial_speed = CONFIG['gameplay']['initial_speed']

# Define fonts
font_style = pygame.font.SysFont(CONFIG['fonts']['style_name'], CONFIG['fonts']['size_normal'])
score_font = pygame.font.SysFont(CONFIG['fonts']['score_name'], CONFIG['fonts']['size_normal'])
bg_font = pygame.font.SysFont(CONFIG['fonts']['bg_name'], CONFIG['fonts']['size_bg'])

obstacle_count = CONFIG['gameplay']['obstacle_count']

# Clock
clock = pygame.time.Clock()


def load_asset(filename, asset_dir, size=None):
    """Load an image asset with a clear error message if missing."""
    path = os.path.join(asset_dir, filename)
    try:
        img = pygame.image.load(path)
        if size:
            img = pygame.transform.scale(img, (size, size))
        return img
    except pygame.error:
        print(f"Warning: Missing asset 'assets/{filename}'. Place it in the assets/ directory.")
        surf = pygame.Surface((size or 20, size or 20))
        surf.fill((255, 0, 255))  # Magenta placeholder
        return surf


# Load and scale images
snake_img = load_asset('snake.png', asset_dir, CONFIG['assets']['size'])
food_img = load_asset('rodent.png', asset_dir, CONFIG['assets']['size'])
obstacle_img = load_asset('danger.png', asset_dir, CONFIG['assets']['size'])
power_up_img = load_asset('power_up.png', asset_dir, CONFIG['assets']['size'])

# Load icon (silent failure — not critical)
try:
    icon_img = pygame.image.load(os.path.join(asset_dir, 'icon.png'))
    pygame.display.set_icon(icon_img)
except pygame.error:
    pass


def our_snake(snake_list):
    for x in snake_list:
        dis.blit(snake_img, (x[0], x[1]))


def draw_obstacles(obstacles):
    for obs in obstacles:
        dis.blit(obstacle_img, (obs[0], obs[1]))


def display_score(score):
    value = score_font.render(f"Score: {score}", True, CONFIG['colors']['black'])
    dis.blit(value, [0, 0])


def get_quadratic_score(n):
    return n ** 2


def get_mean_message(score):
    if score < 10:
        return "Your IQ must be lower than room temperature!"
    elif score < 25:
        return "Try harder next time!"
    elif score < 50:
        return "Well, at least you tried!"
    elif score < 75:
        return "Not bad, but you can do better!"
    elif score < 100:
        return "Good effort, but still room for improvement!"
    elif score < 125:
        return "Great job, almost a pro!"
    elif score < 150:
        return "Wow, you're a snake master!"
    else:
        return "You're a legend!"


def message(msg, color):
    dis.fill(CONFIG['colors']['bright_white'])
    mesg = font_style.render(msg, True, color)
    dis.blit(mesg, [dis_width / 6, dis_height / 3])
    pygame.display.update()
    time.sleep(2)


def random_grid_position(width, height, block_size):
    """Return a random position aligned to the grid."""
    return (
        round(random.randrange(0, width - block_size) / block_size) * block_size,
        round(random.randrange(0, height - block_size) / block_size) * block_size,
    )


def is_on_snake(x, y, snake_body):
    """Check if (x, y) overlaps with any segment of the snake body."""
    return any(seg[0] == x and seg[1] == y for seg in snake_body)


def is_on_obstacles(x, y, obstacles):
    """Check if (x, y) overlaps with any obstacle."""
    return (x, y) in obstacles


def safe_food_position(width, height, block_size, snake_body, obstacles, max_attempts=100):
    """Find a grid position that is not on the snake or obstacles."""
    for _ in range(max_attempts):
        fx, fy = random_grid_position(width, height, block_size)
        if not is_on_snake(fx, fy, snake_body) and not is_on_obstacles(fx, fy, obstacles):
            return (fx, fy)
    return random_grid_position(width, height, block_size)


def safe_power_up_position(width, height, block_size, obstacles, max_attempts=100):
    """Find a grid position not on any obstacle."""
    for _ in range(max_attempts):
        px, py = random_grid_position(width, height, block_size)
        if not is_on_obstacles(px, py, obstacles):
            return (px, py)
    return random_grid_position(width, height, block_size)


def generate_obstacles(count, width, height, block_size, snake_head, max_attempts=100):
    """Generate non-overlapping obstacles, avoiding snake head."""
    obstacles = []
    for _ in range(count):
        for _ in range(max_attempts):
            ox, oy = random_grid_position(width, height, block_size)
            if (ox, oy) not in obstacles and (ox, oy) != (snake_head[0], snake_head[1]):
                obstacles.append((ox, oy))
                break
    return obstacles


def gameLoop():
    game_exit = False

    while not game_exit:
        # Reset all game state (state-machine outer loop — no recursion)
        game_over = False
        game_close = False

        x1 = dis_width / 2
        y1 = dis_height / 2

        x1_change = 0
        y1_change = 0

        snake_List = []
        Length_of_snake = 1

        # Generate obstacles first so food/power-up can avoid them
        obstacles = generate_obstacles(
            CONFIG['gameplay']['obstacle_count'],
            dis_width, dis_height, snake_block,
            (x1, y1)
        )

        # Place food safely (avoid snake head and obstacles)
        foodx, foody = safe_food_position(
            dis_width, dis_height, snake_block,
            [(x1, y1)], obstacles
        )

        # Place power-up safely (avoid obstacles)
        power_upx, power_upy = safe_power_up_position(
            dis_width, dis_height, snake_block, obstacles
        )
        power_up_active = True
        immune = False
        immune_start_time = 0

        snake_speed = CONFIG['gameplay']['initial_speed']

        score = 0
        food_count = 0

        while not game_over:
            # Game over screen
            while game_close:
                dis.fill(CONFIG['colors']['bright_white'])
                mean_message = get_mean_message(score)
                msg = font_style.render(mean_message, True, CONFIG['colors']['neon_pink'])
                dis.blit(msg, [dis_width / 6, dis_height / 3])
                display_score(score)
                retry_text = font_style.render(
                    "Press R to Retry or Q to Quit", True, CONFIG['colors']['black']
                )
                dis.blit(retry_text, [dis_width / 6, dis_height / 2])
                pygame.display.update()

                for event in pygame.event.get():
                    if event.type == pygame.QUIT:
                        game_over = True
                        game_close = False
                        game_exit = True
                    if event.type == pygame.KEYDOWN:
                        if event.key == pygame.K_q:
                            game_over = True
                            game_close = False
                            game_exit = True
                        if event.key == pygame.K_r:
                            # Signal outer loop to reset — no recursive call
                            game_over = True
                            game_close = False

            if game_over:
                continue

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    game_over = True
                    game_exit = True
                if event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_LEFT:
                        x1_change = -snake_block
                        y1_change = 0
                    elif event.key == pygame.K_RIGHT:
                        x1_change = snake_block
                        y1_change = 0
                    elif event.key == pygame.K_UP:
                        y1_change = -snake_block
                        x1_change = 0
                    elif event.key == pygame.K_DOWN:
                        y1_change = snake_block
                        x1_change = 0

            if x1 >= dis_width or x1 < 0 or y1 >= dis_height or y1 < 0:
                game_close = True

            x1 += x1_change
            y1 += y1_change
            dis.fill(CONFIG['colors']['bright_white'])
            dis.blit(food_img, (foodx, foody))
            if power_up_active:
                dis.blit(power_up_img, (power_upx, power_upy))

            snake_Head = []
            snake_Head.append(x1)
            snake_Head.append(y1)
            snake_List.append(snake_Head)
            if len(snake_List) > Length_of_snake:
                del snake_List[0]

            for x in snake_List[:-1]:
                if x == snake_Head:
                    if not immune:
                        game_close = True

            for obs in obstacles:
                if x1 == obs[0] and y1 == obs[1]:
                    if not immune:
                        game_close = True

            our_snake(snake_List)
            draw_obstacles(obstacles)
            display_score(score)
            bg_text = bg_font.render('by SPARSH', True, CONFIG['colors']['black'])
            bg_surface = pygame.Surface(bg_text.get_size(), pygame.SRCALPHA)
            bg_surface.fill(CONFIG['colors']['faded_black'])
            bg_surface.blit(bg_text, (0, 0))
            dis.blit(bg_surface, (dis_width / 2 - bg_text.get_width() / 2, dis_height - 50))

            pygame.display.update()

            if x1 == foodx and y1 == foody:
                foodx, foody = safe_food_position(
                    dis_width, dis_height, snake_block, snake_List, obstacles
                )
                Length_of_snake += 1
                snake_speed += CONFIG['gameplay']['speed_increment']
                food_count += 1
                score += get_quadratic_score(food_count)

            if power_up_active and x1 == power_upx and y1 == power_upy:
                power_up_active = False
                immune = True
                immune_start_time = time.time()

            if immune and time.time() - immune_start_time > CONFIG['gameplay']['immunity_duration']:
                immune = False

            if not power_up_active and random.randint(1, CONFIG['gameplay']['power_up_respawn_chance']) == 1:
                power_upx, power_upy = safe_power_up_position(
                    dis_width, dis_height, snake_block, obstacles
                )
                power_up_active = True

            clock.tick(snake_speed)

    pygame.quit()
    quit()


gameLoop()
