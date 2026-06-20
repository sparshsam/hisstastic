"""Game entity data structures."""


class Snake:
    """Represents the snake state."""

    def __init__(self, start_x, start_y):
        self.body = [[start_x, start_y]]
        self.length = 1
        self.direction_x = 0
        self.direction_y = 0

    @property
    def head(self):
        return self.body[-1]

    def move(self):
        """Move the snake by appending a new head and trimming the tail."""
        new_x = self.head[0] + self.direction_x
        new_y = self.head[1] + self.direction_y
        self.body.append([new_x, new_y])
        if len(self.body) > self.length:
            del self.body[0]

    def grow(self):
        """Increase snake length (tail won't be trimmed next move)."""
        self.length += 1

    def collides_with_self(self):
        """Check if the snake head collides with its body (excluding head)."""
        return self.head in self.body[:-1]

    def is_on(self, x, y):
        """Check if any segment is at (x, y)."""
        return any(seg[0] == x and seg[1] == y for seg in self.body)


class Food:
    """Represents a food (rodent) item."""

    def __init__(self, x, y):
        self.x = x
        self.y = y

    @property
    def position(self):
        return (self.x, self.y)


class Obstacle:
    """Represents a single obstacle."""

    def __init__(self, x, y):
        self.x = x
        self.y = y

    @property
    def position(self):
        return (self.x, self.y)


class PowerUp:
    """Represents an immunity power-up."""

    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.active = True

    @property
    def position(self):
        return (self.x, self.y)

    def deactivate(self):
        self.active = False

    def reactivate(self, x, y):
        self.x = x
        self.y = y
        self.active = True
