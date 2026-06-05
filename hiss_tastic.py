import os
import subprocess
import sys
import pygame
import time
import random

# Function to install required packages
def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

# Check if Pygame is installed, and install it if not
try:
    import pygame
except ImportError:
    print("Pygame not found. Installing...")
    install('pygame')
    import pygame

# Initialize Pygame
pygame.init()

# Define colors
bright_white = (255, 255, 255)
neon_pink = (255, 20, 147)
black = (0, 0, 0)
faded_black = (0, 0, 0, 50)  # Semi-transparent black for the faded text

# Set display dimensions
dis_width = 600
dis_height = 400
dis = pygame.display.set_mode((dis_width, dis_height))
pygame.display.set_caption('Hiss-Tastic')

asset_dir = os.path.join(os.path.dirname(__file__), 'assets')

# Load and scale images
snake_img = pygame.image.load(os.path.join(asset_dir, 'snake.png'))
snake_img = pygame.transform.scale(snake_img, (20, 20))

food_img = pygame.image.load(os.path.join(asset_dir, 'rodent.png'))
food_img = pygame.transform.scale(food_img, (20, 20))

obstacle_img = pygame.image.load(os.path.join(asset_dir, 'danger.png'))
obstacle_img = pygame.transform.scale(obstacle_img, (20, 20))

power_up_img = pygame.image.load(os.path.join(asset_dir, 'power_up.png'))
power_up_img = pygame.transform.scale(power_up_img, (20, 20))

icon_img = pygame.image.load(os.path.join(asset_dir, 'icon.png'))
pygame.display.set_icon(icon_img)

# Set clock speed
clock = pygame.time.Clock()

# Set snake block and speed
snake_block = 20  # Adjusted for the size of the image
initial_speed = 5  # Reduced initial speed

# Define fonts
font_style = pygame.font.SysFont(None, 35)
score_font = pygame.font.SysFont(None, 35)
bg_font = pygame.font.SysFont('comicsansms', 30)

# Define obstacles
obstacle_count = 5

def our_snake(snake_list):
    for x in snake_list:
        dis.blit(snake_img, (x[0], x[1]))

def draw_obstacles(obstacles):
    for obs in obstacles:
        dis.blit(obstacle_img, (obs[0], obs[1]))

def display_score(score):
    value = score_font.render(f"Score: {score}", True, black)
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
    dis.fill(bright_white)
    mesg = font_style.render(msg, True, color)
    dis.blit(mesg, [dis_width / 6, dis_height / 3])
    pygame.display.update()
    time.sleep(2)

def gameLoop():
    game_over = False
    game_close = False

    x1 = dis_width / 2
    y1 = dis_height / 2

    x1_change = 0
    y1_change = 0

    snake_List = []
    Length_of_snake = 1

    foodx = round(random.randrange(0, dis_width - snake_block) / 20.0) * 20.0
    foody = round(random.randrange(0, dis_height - snake_block) / 20.0) * 20.0

    power_upx = round(random.randrange(0, dis_width - snake_block) / 20.0) * 20.0
    power_upy = round(random.randrange(0, dis_height - snake_block) / 20.0) * 20.0
    power_up_active = True
    immune = False
    immune_start_time = 0

    snake_speed = initial_speed

    score = 0
    food_count = 0

    obstacles = []
    for _ in range(obstacle_count):
        obs_x = round(random.randrange(0, dis_width - snake_block) / 20.0) * 20.0
        obs_y = round(random.randrange(0, dis_height - snake_block) / 20.0) * 20.0
        obstacles.append((obs_x, obs_y))

    while not game_over:

        while game_close == True:
            dis.fill(bright_white)
            mean_message = get_mean_message(score)
            msg = font_style.render(mean_message, True, neon_pink)
            dis.blit(msg, [dis_width / 6, dis_height / 3])
            display_score(score)
            retry_text = font_style.render("Press R to Retry or Q to Quit", True, black)
            dis.blit(retry_text, [dis_width / 6, dis_height / 2])
            pygame.display.update()

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    game_over = True
                    game_close = False
                if event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_q:
                        game_over = True
                        game_close = False
                    if event.key == pygame.K_r:
                        gameLoop()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                game_over = True
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
        dis.fill(bright_white)
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
        bg_text = bg_font.render('by SPARSH', True, black)
        bg_surface = pygame.Surface(bg_text.get_size(), pygame.SRCALPHA)
        bg_surface.fill(faded_black)
        bg_surface.blit(bg_text, (0, 0))
        dis.blit(bg_surface, (dis_width / 2 - bg_text.get_width() / 2, dis_height - 50))
        pygame.display.update()

        if x1 == foodx and y1 == foody:
            foodx = round(random.randrange(0, dis_width - snake_block) / 20.0) * 20.0
            foody = round(random.randrange(0, dis_height - snake_block) / 20.0) * 20.0
            Length_of_snake += 1
            snake_speed += 1
            food_count += 1
            score += get_quadratic_score(food_count)

        if power_up_active and x1 == power_upx and y1 == power_upy:
            power_up_active = False
            immune = True
            immune_start_time = time.time()

        if immune and time.time() - immune_start_time > 3.8:
            immune = False

        if not power_up_active and random.randint(1, 50) == 1:
            power_upx = round(random.randrange(0, dis_width - snake_block) / 20.0) * 20.0
            power_upy = round(random.randrange(0, dis_height - snake_block) / 20.0) * 20.0
            power_up_active = True

        clock.tick(snake_speed)

    pygame.quit()
    quit()

gameLoop()
