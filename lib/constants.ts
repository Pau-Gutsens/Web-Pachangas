export const PRECIO_BASE = 8;
export const FACTOR = 2;
export const PRECIO_MIN = 6;
export const PRECIO_MAX = 20;
export const K = 2;

/**
 * Calculates the adjusted average for a player.
 * formula: (puntos_totales + K * promedio_grupo) / (pachangas_jugadas + K)
 */
export const calculateAdjustedAverage = (totalPoints: number, groupAverage: number, matchesPlayed: number): number => {
  return (totalPoints + K * groupAverage) / (matchesPlayed + K);
};

/**
 * Calculates the final price for a player based on their adjusted average.
 * formula: clamp(round(PRECIO_BASE + FACTOR * promedio_ajustado), PRECIO_MIN, PRECIO_MAX)
 */
export const calculatePrice = (adjustedAverage: number): number => {
  const price = Math.round(PRECIO_BASE + FACTOR * adjustedAverage);
  return Math.max(PRECIO_MIN, Math.min(PRECIO_MAX, price));
};

/**
 * Default average if no data exists.
 */
export const DEFAULT_GROUP_AVERAGE = 1.5;
