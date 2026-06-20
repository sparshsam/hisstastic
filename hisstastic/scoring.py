"""Scoring logic — quadratic scoring and legacy insult messages."""


def get_quadratic_score(n):
    """Calculate score for the nth food item."""
    return n ** 2


def get_mean_message(score):
    """Return a (legacy) score message. These are preserved from the original GPT-era prototype."""
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
