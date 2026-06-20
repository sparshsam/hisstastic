/**
 * HissTastic Snake Facts & Roasts — static local dataset.
 * Each entry has an educational snake fact + contextual roasts triggered by gameplay events.
 * No external APIs, no AI/LLM calls, no telemetry.
 */

const SNAKE_FACTS = [
  // --- missed_food ---
  {
    id: 'pit_viper_heat',
    fact: 'Pit vipers can detect infrared heat from warm-blooded prey.',
    tags: ['missed_food', 'awareness'],
    roasts: [
      'You still missed food two squares away.',
      'Your awareness settings appear to be ornamental.',
      'Even a cold-blooded predator would have caught that.',
    ],
    severity: 'medium',
  },
  {
    id: 'rattlesnake_strike',
    fact: 'Rattlesnakes can strike in under 70 milliseconds.',
    tags: ['missed_food', 'speed'],
    roasts: [
      'You had milliseconds to react. You used them to hesitate.',
      'A rattlesnake would be ashamed of that reaction time.',
    ],
    severity: 'medium',
  },
  {
    id: 'anaconda_squeeze',
    fact: 'Anacondas can sense prey from meters away using tongue-flicking.',
    tags: ['missed_food', 'proximity'],
    roasts: [
      'The food was right there. Right. There.',
      'Your tongue-flicking sensor needs calibration.',
    ],
    severity: 'low',
  },

  // --- wall_collision ---
  {
    id: 'sidewinder_precision',
    fact: 'Sidewinders cross desert sands with precision, leaving J-shaped tracks.',
    tags: ['wall_collision', 'precision'],
    roasts: [
      'You just argued with the same wall again.',
      'Even a sidewinder knows where the edge is.',
      'Walls: they exist at predictable coordinates.',
    ],
    severity: 'low',
  },
  {
    id: 'mamba_speed',
    fact: 'Black mambas can reach 12 mph — the fastest snake on land.',
    tags: ['wall_collision', 'speed', 'early_death'],
    roasts: [
      'Speed means nothing if you cannot steer.',
      'You went fast. Straight into a wall.',
    ],
    severity: 'medium',
  },

  // --- self_collision ---
  {
    id: 'king_cobra_tracking',
    fact: 'King cobras can track movement carefully and hold eye contact.',
    tags: ['self_collision', 'awareness'],
    roasts: [
      'You turned directly into your own tail.',
      'Your tracking is as effective as a screen door on a submarine.',
    ],
    severity: 'high',
  },
  {
    id: 'ouroboros_mistake',
    fact: 'The ouroboros symbol shows a snake eating its own tail — an ancient metaphor.',
    tags: ['self_collision', 'irony'],
    roasts: [
      'You made the ouroboros mistake: eating yourself.',
      'Ancient symbolism. You made it literal.',
    ],
    severity: 'high',
  },

  // --- obstacle_collision ---
  {
    id: 'coral_snake_mimic',
    fact: 'Coral snakes have potent neurotoxic venom — and look-alikes mimic them.',
    tags: ['obstacle_collision', 'awareness'],
    roasts: [
      'You hit an obstacle that was clearly visible.',
      'Your obstacle detection is as reliable as coral snake mimicry.',
    ],
    severity: 'medium',
  },
  {
    id: 'burmese_python_patience',
    fact: 'Burmese pythons wait motionless for weeks if necessary.',
    tags: ['obstacle_collision', 'patience'],
    roasts: [
      'The obstacles were stationary. They did not move. You found them anyway.',
      'Even a motionless python has better spatial awareness.',
    ],
    severity: 'medium',
  },

  // --- early_death ---
  {
    id: 'thread_snake_size',
    fact: 'The thread snake is barely 10 cm long — and still survives better.',
    tags: ['early_death', 'irony'],
    roasts: [
      'A 10 cm thread snake lived longer than you.',
      'That was impressively brief.',
    ],
    severity: 'high',
  },
  {
    id: 'death_adder_camouflage',
    fact: 'Death adders bury themselves and wait. Patience is their superpower.',
    tags: ['early_death', 'patience'],
    roasts: [
      'You died faster than a death adder can strike.',
      'Zero patience. Zero survival.',
    ],
    severity: 'high',
  },

  // --- long_survival ---
  {
    id: 'python_growth',
    fact: 'Reticulated pythons can grow over 7 meters long with consistent feeding.',
    tags: ['long_survival', 'achievement'],
    roasts: [
      'You are eating well. The python way.',
      'Consistent feeding. Apex predator behavior.',
    ],
    severity: 'low',
  },
  {
    id: 'longest_lived',
    fact: 'The oldest known snake lived over 40 years in captivity.',
    tags: ['long_survival', 'achievement'],
    roasts: [
      'You are not at 40 years yet, but this is a decent start.',
      'Longevity. The snake way.',
    ],
    severity: 'low',
  },

  // --- rapid_direction_changes ---
  {
    id: 'whip_snake_agility',
    fact: 'Whip snakes are among the fastest and most agile, changing direction instantly.',
    tags: ['rapid_direction', 'awareness'],
    roasts: [
      'You changed direction more times than a whip snake in a hurricane.',
      'Decisiveness is a virtue. You seem to be collecting directions instead.',
    ],
    severity: 'low',
  },
  {
    id: 'sidewinder_track',
    fact: 'Sidewinders use a unique lateral movement to minimize contact with hot sand.',
    tags: ['rapid_direction', 'efficiency'],
    roasts: [
      'All that movement and nowhere to go.',
      'You zig-zagged more than a sidewinder on hot sand.',
    ],
    severity: 'low',
  },

  // --- power_up_collected ---
  {
    id: 'venom_evolution',
    fact: 'Snake venom evolved over 60 million years as a highly specialized tool.',
    tags: ['power_up', 'achievement'],
    roasts: [
      'Power-up acquired. Try not to waste 60 million years of evolution.',
      'Immunity. Use it wisely, unlike the snake that evolved venom for swamp rats.',
    ],
    severity: 'low',
  },

  // --- power_up_missed ---
  {
    id: 'shedding_missed',
    fact: 'Snakes shed their skin regularly to grow. You missed a growth opportunity.',
    tags: ['power_up_missed', 'awareness'],
    roasts: [
      'A power-up passed by. Much like a shed opportunity.',
      'Even a shedding snake knows when something valuable is nearby.',
    ],
    severity: 'medium',
  },

  // --- high_score ---
  {
    id: 'king_cobra_record',
    fact: 'The king cobra can deliver enough venom in one bite to kill an elephant.',
    tags: ['high_score', 'achievement'],
    roasts: [
      'High score! The king cobra approves of this devastation.',
      'You have reached peak snake. The elephant would be worried.',
    ],
    severity: 'low',
  },

  // --- idle / start_delay ---
  {
    id: 'hibernation_prep',
    fact: 'Some snakes hibernate for months at a time before spring emergence.',
    tags: ['idle', 'start_delay'],
    roasts: [
      'Hesitating like a snake deciding whether to hibernate.',
      'Ready when you are. The snakes are.',
    ],
    severity: 'low',
  },

  // --- replay_imported ---
  {
    id: 'replay_watcher',
    fact: 'Some snakes can see in infrared. You are watching your own past.',
    tags: ['replay', 'meta'],
    roasts: [
      'Even a blind worm remembers its path better.',
      'Watch closely. The mistakes do not change.',
    ],
    severity: 'low',
  },

  // --- ghost_loaded ---
  {
    id: 'ghost_snake',
    fact: 'Some blind snakes live underground and never see daylight.',
    tags: ['ghost', 'meta'],
    roasts: [
      'A ghost of your past. It does not judge. It remembers.',
      'The ghost snake has no eyes. Neither does your past self, apparently.',
    ],
    severity: 'low',
  },

  // --- general_fail ---
  {
    id: 'vine_vs_snake',
    fact: 'Vine snakes are so thin they are often mistaken for actual vines.',
    tags: ['general_fail', 'awareness'],
    roasts: [
      'You performed worse than a snake pretending to be a plant.',
      'A vine snake puts more effort into its disguise than you did into survival.',
    ],
    severity: 'medium',
  },
  {
    id: 'egg_eater_effort',
    fact: 'African egg-eating snakes can swallow eggs three times their head size.',
    tags: ['general_fail', 'effort'],
    roasts: [
      'An egg-eating snake attempted more today than you just did.',
      'You were out-efforted by a reptile that eats eggs whole.',
    ],
    severity: 'medium',
  },
  {
    id: 'bronze_back_stealth',
    fact: 'Brown tree snakes are expert climbers and notorious for hiding in cargo.',
    tags: ['general_fail', 'stealth'],
    roasts: [
      'You lack the stealth of a snake hiding in international cargo.',
      'A stowaway snake has better navigation skills.',
    ],
    severity: 'low',
  },
];

/**
 * Legacy insult messages preserved as fallback.
 * These are the original game-over messages from the Python runtime.
 */
const LEGACY_INSULTS = [
  'Your IQ must be lower than room temperature!',
  'Try harder next time!',
  'Well, at least you tried!',
  'Not bad, but you can do better!',
  'Good effort, but still room for improvement!',
  'Great job, almost a pro!',
  'Wow, you\'re a snake master!',
  'You\'re a legend!',
];

/**
 * Get a legacy insult by score (preserving original behavior).
 */
function getLegacyInsult(score) {
  if (score < 0) return LEGACY_INSULTS[0];
  const thresholds = [10, 25, 50, 75, 100, 125, 150];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (score >= thresholds[i]) return LEGACY_INSULTS[i + 1];
  }
  return LEGACY_INSULTS[0];
}

/**
 * Get snake-fact roast by tags.
 * Returns { fact, roast } or null if no match.
 */
function getSnakeRoast(tags, rngFn) {
  const rand = rngFn || Math.random;
  const candidates = SNAKE_FACTS.filter(f =>
    tags.some(t => f.tags.includes(t))
  );

  if (candidates.length === 0) {
    // Fallback to any general fail
    const general = SNAKE_FACTS.filter(f => f.tags.includes('general_fail'));
    if (general.length === 0) return null;
    const pick = general[Math.floor(rand() * general.length)];
    const roast = pick.roasts[Math.floor(rand() * pick.roasts.length)];
    return { fact: pick.fact, roast: roast, id: pick.id, severity: pick.severity };
  }

  const pick = candidates[Math.floor(rand() * candidates.length)];
  const roast = pick.roasts[Math.floor(rand() * pick.roasts.length)];
  return { fact: pick.fact, roast: roast, id: pick.id, severity: pick.severity };
}

/**
 * Get a game-over snake-fact roast based on the current game stats.
 * Falls back to legacy insult if no matching fact found.
 */
function getGameOverRoast(gameState, rngFn) {
  const rand = rngFn || Math.random;
  const score = gameState.score;
  const tags = [];

  // Determine tags from game state
  if (gameState.wallCollision) tags.push('wall_collision');
  if (gameState.selfCollision) tags.push('self_collision');
  if (gameState.obstacleCollision) tags.push('obstacle_collision');
  if (gameState.earlyDeath && score < 10) tags.push('early_death');
  if (gameState.longSurvival && score >= 75) tags.push('long_survival');
  if (gameState.rapidDirectionChanges) tags.push('rapid_direction');
  if (gameState.powerUpCollected) tags.push('power_up');
  if (gameState.powerUpMissed) tags.push('power_up_missed');
  if (gameState.missedFoodCount > 2) tags.push('missed_food');

  // If no specific tags, derive from score
  if (tags.length === 0) {
    if (score < 10) tags.push('early_death');
    else if (score >= 100) tags.push('high_score');
    else tags.push('general_fail');
  }

  const roast = getSnakeRoast(tags, rand);
  if (!roast) return getLegacyInsult(score);

  return roast.fact + ' ' + roast.roast;
}

// Export for browser
window.SNAKE_FACTS = SNAKE_FACTS;
window.LEGACY_INSULTS = LEGACY_INSULTS;
window.getSnakeRoast = getSnakeRoast;
window.getGameOverRoast = getGameOverRoast;
window.getLegacyInsult = getLegacyInsult;
