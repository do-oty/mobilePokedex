// Simple XP and leveling system
export const calculateLevel = (xp: number): number => {
  // Simple formula: level = floor(sqrt(xp / 100))
  // Level 1 = 0 XP, Level 2 = 100 XP, Level 3 = 400 XP, etc.
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const getXPForLevel = (level: number): number => {
  // XP needed to reach this level
  return (level - 1) * (level - 1) * 100;
};

export const getXPForNextLevel = (currentXP: number): number => {
  const currentLevel = calculateLevel(currentXP);
  return getXPForLevel(currentLevel + 1);
};

export const getXPProgress = (currentXP: number): {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercent: number;
} => {
  const level = calculateLevel(currentXP);
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const xpIntoLevel = currentXP - currentLevelXP;
  const xpNeededForLevel = nextLevelXP - currentLevelXP;
  const progressPercent = Math.floor((xpIntoLevel / xpNeededForLevel) * 100);

  return {
    level,
    currentLevelXP: xpIntoLevel,
    nextLevelXP: xpNeededForLevel,
    progressPercent,
  };
};

// XP rewards
export const XP_REWARDS = {
  CAPTURE: 50,
  DAILY_CHALLENGE: 100,
  STREAK_BONUS: 25,
  FIRST_SEEN: 10,
};

