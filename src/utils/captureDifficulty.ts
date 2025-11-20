/**
 * Capture Difficulty System
 * 
 * Based on Pokémon's capture rate (0-255):
 * - Lower capture rate = harder to catch (legendary Pokémon)
 * - Higher capture rate = easier to catch (common Pokémon)
 * 
 * Minigame adjustments:
 * - Move speed: How fast the sprite moves
 * - Move interval: How often it changes position
 * - Time limit: How long the player has to complete
 */

export type CaptureDifficulty = {
  moveSpeed: number;        // Pixels per frame (higher = faster)
  moveInterval: number;     // Milliseconds between position changes
  timeLimit: number;        // Seconds to complete capture
  tapsRequired: number;     // Number of successful taps needed
  hitboxSize: number;       // Size of the tap target (smaller = harder)
};

/**
 * Calculate capture difficulty based on capture rate (0-255)
 * 
 * Formula:
 * - difficulty = (255 - captureRate) / 255
 * - Result ranges from 0 (easiest) to 1 (hardest)
 */
export const calculateCaptureDifficulty = (
  captureRate: number,
): CaptureDifficulty => {
  // Normalize capture rate to 0-1 scale (inverted, so lower rate = harder)
  const difficulty = (255 - captureRate) / 255;

  // Calculate parameters based on difficulty
  return {
    // Move speed: 50-200 pixels per movement
    moveSpeed: Math.round(50 + difficulty * 150),

    // Move interval: 2000ms (easy) to 800ms (hard)
    moveInterval: Math.round(2000 - difficulty * 1200),

    // Time limit: 30s (easy) to 15s (hard)
    timeLimit: Math.round(30 - difficulty * 15),

    // Taps required: Always 3 (keeps it consistent)
    tapsRequired: 3,

    // Hitbox size: 120px (easy) to 60px (hard)
    hitboxSize: Math.round(120 - difficulty * 60),
  };
};

/**
 * Get difficulty tier for display
 */
export const getCaptureTier = (captureRate: number): string => {
  if (captureRate >= 200) return 'EASY';
  if (captureRate >= 120) return 'MEDIUM';
  if (captureRate >= 60) return 'HARD';
  if (captureRate >= 20) return 'VERY HARD';
  return 'LEGENDARY';
};

/**
 * Get difficulty color for UI
 */
export const getCaptureTierColor = (captureRate: number): string => {
  if (captureRate >= 200) return '#7AC74C'; // Green (grass type color)
  if (captureRate >= 120) return '#F7D02C'; // Yellow (electric type color)
  if (captureRate >= 60) return '#F5AC78'; // Orange
  if (captureRate >= 20) return '#EE8130'; // Red-orange (fire type color)
  return '#F85C50'; // Red (warning color)
};

/**
 * Get star rating (1-5) based on capture rate
 * Lower capture rate = more stars (harder to catch)
 */
export const getDifficultyStars = (captureRate: number): number => {
  if (captureRate >= 200) return 1; // Easy = 1 star
  if (captureRate >= 120) return 2; // Medium = 2 stars
  if (captureRate >= 60) return 3;  // Hard = 3 stars
  if (captureRate >= 20) return 4;  // Very Hard = 4 stars
  return 5;                         // Legendary = 5 stars
};

/**
 * Example difficulty values for common Pokémon:
 * 
 * Patrat (captureRate: 255) - EASY
 * - moveSpeed: 50, moveInterval: 2000ms, timeLimit: 30s, hitbox: 120px
 * 
 * Starter Pokémon (captureRate: 45) - HARD
 * - moveSpeed: 133, moveInterval: 1067ms, timeLimit: 22s, hitbox: 76px
 * 
 * Victini (captureRate: 3) - LEGENDARY
 * - moveSpeed: 199, moveInterval: 812ms, timeLimit: 15s, hitbox: 61px
 */

